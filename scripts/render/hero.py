"""Render aligned exterior and mechanical hero plates from the supplied model.
Run with Blender --background --python scripts/render/hero.py.
"""
import bpy, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
groups={}
for name in ['body','body-2','trim','interior','wheels','chassis','engine']:
 before=set(bpy.data.objects)
 bpy.ops.import_scene.gltf(filepath=str(ROOT/'dist/anatomy/assets'/f'{name}.glb'))
 groups[name]=list(set(bpy.data.objects)-before)
print('Imported',sum(map(len,groups.values())),'objects',flush=True)
scene=bpy.context.scene
scene.render.engine='CYCLES'; scene.cycles.samples=24; scene.cycles.use_denoising=True
scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='WEBP';scene.render.image_settings.quality=94
scene.world.color=(.7,.7,.7)
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.72,.82,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
scene.view_settings.view_transform='AgX'
# glTF's Y-up becomes Blender's Z-up. Negative X is the car's front.
def aim(obj,point):obj.rotation_euler=(Vector(point)-obj.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(-6.8,-8.2,4.2));camera=bpy.context.object;aim(camera,(0,0,.68));camera.data.type='ORTHO';camera.data.ortho_scale=6.2;scene.camera=camera
for location,power,size in [((-3,-4,7),1700,5),((2,2,6),2100,5),((0,-1,5),650,3)]:
 bpy.ops.object.light_add(type='AREA',location=location);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size;aim(light,(0,0,.4))
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.035));floor=bpy.context.object
mat=bpy.data.materials.new('Studio floor');mat.diffuse_color=(.78,.81,.82,1);mat.use_nodes=True
mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.78,.81,.82,1);mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.85;floor.data.materials.append(mat)
scene.render.filepath=str(ROOT/'dist/assets/corvair-exterior.webp');bpy.ops.render.render(write_still=True)
for group in ['body','body-2','trim','interior']:
 for obj in groups[group]:obj.hide_render=True
scene.render.filepath=str(ROOT/'dist/assets/corvair-mechanical.webp');bpy.ops.render.render(write_still=True)
print('Hero plates complete',flush=True)
