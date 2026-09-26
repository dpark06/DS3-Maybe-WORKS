"""Builds the studio HDRI the cans reflect (public/env/studio.hdr).
Run:  /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python scripts/make-hdri.py
Big soft key box on one side, cool rim strips behind, a top panel, and a blue floor bounce that matches the page."""
import bpy, math, os
from mathutils import Vector

out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'env', 'studio.hdr')
os.makedirs(os.path.dirname(out), exist_ok=True)

sc = bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
sc.render.engine = 'CYCLES'
sc.cycles.samples = 48
sc.cycles.device = 'CPU'
sc.render.resolution_x, sc.render.resolution_y = 1024, 512
sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = 'HDR'
sc.render.image_settings.color_depth = '32'
sc.view_settings.view_transform = 'Standard'

# world: dark studio, blue ground bounce, faint cool top
w = bpy.data.worlds.new('hdri'); sc.world = w; w.use_nodes = True
nt = w.node_tree; nt.nodes.clear()
tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
ramp = nt.nodes.new('ShaderNodeValToRGB'); bg = nt.nodes.new('ShaderNodeBackground'); out_n = nt.nodes.new('ShaderNodeOutputWorld')
nt.links.new(tc.outputs['Generated'], sep.inputs[0]); nt.links.new(sep.outputs['Z'], ramp.inputs[0])
e = ramp.color_ramp.elements
e[0].position = 0.30; e[0].color = (0.01, 0.05, 0.55, 1)      # blue floor bounce
e[1].position = 0.52; e[1].color = (0.03, 0.03, 0.05, 1)      # dark horizon
e2 = e.new(0.85); e2.color = (0.12, 0.13, 0.18, 1)            # cool top glow
nt.links.new(ramp.outputs[0], bg.inputs[0]); nt.links.new(bg.outputs[0], out_n.inputs[0])

def panel(name, az, el, w_, h_, strength, color=(1, 1, 1), dist=10):
    """Emissive rectangle on a sphere around the origin. az 0 = toward -Y (the viewer), positive = to the viewer's right."""
    a, e_ = math.radians(az), math.radians(el)
    pos = Vector((math.sin(a) * math.cos(e_), -math.cos(a) * math.cos(e_), math.sin(e_))) * dist
    bpy.ops.mesh.primitive_plane_add(size=1, location=pos)
    p = bpy.context.active_object; p.name = name; p.scale = (w_, h_, 1)
    p.rotation_euler = (-pos).to_track_quat('Z', 'Y').to_euler()
    m = bpy.data.materials.new(name); m.use_nodes = True; n = m.node_tree; n.nodes.clear()
    em = n.nodes.new('ShaderNodeEmission'); em.inputs[0].default_value = (*color, 1); em.inputs[1].default_value = strength
    o = n.nodes.new('ShaderNodeOutputMaterial'); n.links.new(em.outputs[0], o.inputs[0]); p.data.materials.append(m)

panel('key',        -55,  28, 7.0, 9.0, 30, (1.0, 0.97, 0.92))   # big warm softbox, viewer's left
panel('rim_left',  -150,  10, 1.6, 9.0, 55, (0.85, 0.92, 1.0))   # cool strip behind-left
panel('rim_right',  150,  10, 1.6, 9.0, 55, (0.85, 0.92, 1.0))   # cool strip behind-right
panel('top',          0,  75, 8.0, 5.0, 10, (1.0, 1.0, 1.0))     # overhead
panel('fill',        50,   5, 5.0, 5.0,  2.5, (0.95, 0.97, 1.0)) # weak fill on the right
panel('front_kick',   5,  -8, 3.0, 1.2, 4, (1.0, 1.0, 1.0))      # thin low front strip for a bright edge line

bpy.ops.object.camera_add(location=(0, 0, 0), rotation=(math.radians(90), 0, 0))
cam = bpy.context.active_object; sc.camera = cam
cam.data.type = 'PANO'
try: cam.data.panorama_type = 'EQUIRECTANGULAR'
except Exception: cam.data.cycles.panorama_type = 'EQUIRECTANGULAR'
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print('HDRI written', out, os.path.getsize(out))
