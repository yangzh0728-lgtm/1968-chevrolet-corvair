"""Render the v7 red car aligned with the existing blue website hero.
Uses the camera, lighting, floor and color management from hero.py.
Does not save changes to the source Blender model.
"""
import bpy, json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'artifacts/corvair-as-purchased/seat-peeling-v7/Legacy_Garage_Corvair_Peeling_Seat_v7.blend'
OUTPUT = ROOT / 'dist/assets/corvair-as-purchased.webp'
REPORT = ROOT / 'artifacts/hero-comparison'
REPORT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
scene = bpy.context.scene
scene.frame_set(1)
bpy.context.view_layer.update()
# Deepen only the surviving burgundy pigment. This node comes before the
# primer, rust, grime and chipped-paint layers, so the age stays legible.
paint = bpy.data.materials['V2 • Weathered burgundy lacquer']
pigment = paint.node_tree.nodes['Deeper weathered burgundy pigment']
pigment.inputs[2].default_value = (.24, .13, .15, 1)
# Keep the dead lacquer from washing pink beneath the broad studio lights.
# Apply this only to the painted body; glass, chrome and lights keep their sheen.
surface = paint.node_tree.nodes['Surface']
surface.inputs['Specular IOR Level'].default_value = .24
surface.inputs['Coat Weight'].default_value = .008
for ob in list(bpy.data.collections['STUDIO • cameras and lighting'].all_objects):
    ob.hide_render = True

def aim(obj, point):
    obj.rotation_euler = (Vector(point) - obj.location).to_track_quat('-Z', 'Y').to_euler()

scene.render.engine = 'CYCLES'
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.render.resolution_x = 1600
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'WEBP'
scene.render.image_settings.quality = 94
scene.render.film_transparent = False
scene.world = bpy.data.worlds.new('HERO • matching studio world')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.65, .72, .82, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .55
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'None'
scene.view_settings.exposure = 0
scene.view_settings.gamma = 1

bpy.ops.object.camera_add(location=(-6.8, -8.2, 4.2))
camera = bpy.context.object
camera.name = 'HERO • aligned old-car comparison'
aim(camera, (0, 0, .68))
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 6.2
scene.camera = camera
for location, power, size in [((-3, -4, 7), 1700, 5), ((2, 2, 6), 2100, 5), ((0, -1, 5), 650, 3)]:
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.data.energy = power
    light.data.shape = 'DISK'
    light.data.size = size
    aim(light, (0, 0, .4))
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.035))
floor = bpy.context.object
floor.name = 'HERO • matching studio floor'
mat = bpy.data.materials.new('HERO • matching light gray floor')
mat.diffuse_color = (.78, .81, .82, 1)
mat.use_nodes = True
mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.78, .81, .82, 1)
mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .85
floor.data.materials.append(mat)
scene.render.filepath = str(OUTPUT)
bpy.ops.render.render(write_still=True)
manifest = {
    'source': str(SOURCE.relative_to(ROOT)), 'output': str(OUTPUT.relative_to(ROOT)),
    'reference_setup': 'scripts/render/hero.py', 'dimensions': [1600, 1000],
    'camera_position': list(camera.location), 'camera_target': [0, 0, .68],
    'orthographic_scale': camera.data.ortho_scale, 'source_frame': 1,
    'bytes': OUTPUT.stat().st_size,
    'paint_pigment_multiplier': list(pigment.inputs[2].default_value),
    'paint_specular_ior_level': surface.inputs['Specular IOR Level'].default_value,
    'paint_coat_weight': surface.inputs['Coat Weight'].default_value,
    'description': 'As-purchased Corvair with deeper burgundy paint, v7 peeling seat and all prior modeled wear.'
}
(REPORT / 'render-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print('MATCHED OLD-CAR HERO COMPLETE', json.dumps(manifest), flush=True)
