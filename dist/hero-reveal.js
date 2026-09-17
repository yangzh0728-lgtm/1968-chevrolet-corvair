// Two aligned studio renders of the same model, revealed through a fluid mask.
// No model download is required on the opening page.
const root = document.querySelector('[data-car-reveal]');
if (root) init(root);

async function init(root) {
  const stage = root.querySelector('.reveal-stage');
  const canvas = root.querySelector('canvas');
  const exterior = root.querySelector('.reveal-exterior');
  const mechanical = root.querySelector('.reveal-mechanical');
  const slider = root.querySelector('input');
  const replay = root.querySelector('.reveal-replay');
  const status = root.querySelector('.reveal-status');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let current = .5, target = .5, frame = 0, introStart = null;
  let pointerY = .5, currentY = .5, lastTime = 0, visible = true;
  let drawGL = null, gl = null, lastWidth = 0, lastHeight = 0;
  const canAnimate = () => !reduce.matches && !document.body.classList.contains('motion-paused');
  const ease = t => t * t * (3 - 2 * t);

  function updateLabel(value) {
    slider.value = String(Math.round(value * 100));
    slider.setAttribute('aria-valuetext', `${Math.round(value * 100)}% mechanical view`);
  }
  function requestDraw() {
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function stopIntro() {
    introStart = null;
    replay.textContent = canAnimate() ? 'Replay reveal' : 'Switch view';
    replay.setAttribute('aria-label', canAnimate() ? 'Replay the opening car reveal' : 'Switch between exterior and mechanical views');
  }
  function tick(now) {
    frame = 0;
    const dt = Math.min((now - (lastTime || now - 16)) / 1000, .05);
    lastTime = now;
    if (introStart !== null) {
      const t = (now - introStart) / 1000;
      // Let the exterior settle, reveal the engineering, then meet halfway.
      target = t < .45 ? 0 : t < 2.15 ? .94 * ease((t - .45) / 1.7)
        : t < 2.55 ? .94 : .94 - .44 * ease(Math.min(1, (t - 2.55) / 1.2));
      updateLabel(target);
      if (t >= 3.75) stopIntro();
    }
    const blend = canAnimate() ? 1 - Math.exp(-dt * 11) : 1;
    current += (target - current) * blend;
    currentY += (pointerY - currentY) * blend;
    if (Math.abs(current - target) < .0004) current = target;
    const velocity = Math.min(1, Math.abs(target - current) * 7);
    root.style.setProperty('--reveal', `${current * 100}%`);
    if (drawGL) drawGL(current, currentY, velocity);
    if (introStart !== null || Math.abs(current - target) > .0004 || Math.abs(pointerY - currentY) > .001) requestDraw();
  }
  function setValue(value) {
    stopIntro(); target = Math.max(0, Math.min(1, value)); updateLabel(target); requestDraw();
  }
  slider.addEventListener('input', () => setValue(Number(slider.value) / 100));
  replay.addEventListener('click', () => {
    if (introStart !== null) { stopIntro(); target = current; updateLabel(target); }
    else if (canAnimate()) { current = target = 0; introStart = performance.now(); replay.textContent = 'Pause reveal'; replay.setAttribute('aria-label', 'Pause the opening car reveal'); }
    else { setValue(target < .5 ? 1 : 0); }
    requestDraw();
  });
  // Horizontal dragging preserves normal vertical touch scrolling.
  let dragging = false;
  function track(event) {
    const rect = stage.getBoundingClientRect();
    pointerY = 1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    setValue(1 - (event.clientX - rect.left) / rect.width);
  }
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    dragging = true; stage.setPointerCapture(event.pointerId); track(event);
  });
  stage.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse' || dragging) track(event);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) stage.addEventListener(type, () => { dragging = false; });
  function motionChanged() {
    if (!canAnimate()) { stopIntro(); current = target; }
    replay.textContent = canAnimate() ? 'Replay reveal' : 'Switch view';
    replay.setAttribute('aria-label', canAnimate() ? 'Replay the opening car reveal' : 'Switch between exterior and mechanical views');
    requestDraw();
  }
  reduce.addEventListener('change', motionChanged);
  new MutationObserver(motionChanged).observe(document.body, {attributes: true, attributeFilter: ['class']});
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) { stopIntro(); cancelAnimationFrame(frame); frame = 0; }
    else requestDraw();
  }, {threshold: .01}).observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopIntro(); cancelAnimationFrame(frame); frame = 0; }
    else requestDraw();
  });

  try {
    await Promise.all([exterior.decode(), mechanical.decode()]);
  } catch {
    status.textContent = 'The interactive preview is unavailable. Explore the full model below.';
    return;
  }
  try {
    gl = canvas.getContext('webgl', {alpha: false, antialias: false, powerPreference: 'low-power'});
    if (gl) {
      drawGL = createRenderer(gl, exterior, mechanical);
      root.classList.add('reveal-webgl');
    }
  } catch { gl = null; drawGL = null; }
  function resize() {
    const box = stage.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 1.75);
    const width = Math.round(box.width * ratio), height = Math.round(box.height * ratio);
    if (width !== lastWidth || height !== lastHeight) {
      canvas.width = lastWidth = width; canvas.height = lastHeight = height;
      if (gl) gl.viewport(0, 0, width, height);
      requestDraw();
    }
  }
  new ResizeObserver(resize).observe(stage); resize();
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); drawGL = null; gl = null; root.classList.remove('reveal-webgl'); requestDraw();
  });
  root.classList.add('reveal-ready');
  root.querySelector('.reveal-controls').hidden = false;
  status.textContent = matchMedia('(pointer: fine)').matches ? 'Move across the car to look inside.' : 'Swipe across the car to look inside.';
  if (canAnimate() && visible && !document.hidden) {
    current = target = 0; introStart = performance.now(); replay.textContent = 'Pause reveal'; replay.setAttribute('aria-label', 'Pause the opening car reveal');
  }
  else motionChanged();
  updateLabel(target); requestDraw();
}

function createRenderer(gl, exterior, mechanical) {
  const vertex = `attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const fragment = `precision mediump float;
    varying vec2 uv; uniform sampler2D outsideImage; uniform sampler2D insideImage;
    uniform vec2 resolution; uniform float reveal; uniform float pointerY; uniform float force;
    float noise(vec2 p){return sin(p.x*5.7+p.y*9.2)*.45+sin(p.x*12.3-p.y*6.4)*.3+sin(p.y*24.+p.x*3.)*.15;}
    void main(){
      vec2 imageUV=uv; float aspect=resolution.x/resolution.y; float sourceAspect=1.6;
      if(aspect>sourceAspect) imageUV.y=(uv.y-.5)*sourceAspect/aspect+.5;
      else imageUV.x=(uv.x-.5)*aspect/sourceAspect+.5;
      float active=sin(clamp(reveal,0.,1.)*3.141593);
      float wave=noise(vec2(reveal*2.,uv.y))*.022;
      float pull=exp(-pow((uv.y-pointerY)*3.,2.))*.055*force;
      float boundary=1.-reveal+(wave+pull)*active;
      float dist=uv.x-boundary;
      float mask=smoothstep(-.012,.012,dist);
      if(reveal<.001)mask=0.; if(reveal>.999)mask=1.;
      vec2 refractUV=imageUV; refractUV.x+=exp(-abs(dist)*65.)*.006*active;
      vec3 outside=texture2D(outsideImage,refractUV).rgb;
      vec3 inside=texture2D(insideImage,refractUV).rgb;
      vec3 color=mix(outside,inside,mask);
      color+=vec3(.06,.085,.11)*exp(-abs(dist)*150.)*active;
      gl_FragColor=vec4(color,1.);
    }`;
  function shader(type, source) {
    const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error('Reveal shader unavailable');
    return s;
  }
  const program = gl.createProgram();
  gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex)); gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Reveal renderer unavailable');
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  [exterior, mechanical].forEach((image, index) => {
    gl.activeTexture(gl.TEXTURE0 + index); gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(gl.getUniformLocation(program, index ? 'insideImage' : 'outsideImage'), index);
  });
  const locations = Object.fromEntries(['reveal','pointerY','force','resolution'].map(name => [name, gl.getUniformLocation(program, name)]));
  return (value, y, force) => {
    gl.uniform1f(locations.reveal, value); gl.uniform1f(locations.pointerY, y); gl.uniform1f(locations.force, force);
    gl.uniform2f(locations.resolution, gl.canvas.width, gl.canvas.height); gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
}
