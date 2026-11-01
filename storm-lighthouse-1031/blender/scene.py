"""폭풍 속 등대 — Blender scene builder (one minute, 7 shots, 24 fps, 1440 frames).

Builds the whole scene from nothing: ocean, cliff, lighthouse with a turning lamp and a beam, a small boat with a cabin light,
storm sky with lightning, and seven cameras bound to timeline markers. No external assets.

Written to run on Blender 3.6 – 5.x: it avoids the APIs that changed between versions (Principled BSDF socket names,
the EEVEE engine id, Action.fcurves, the FFMPEG output switch). Continuous motion uses drivers, shots use keyframes.

In Blender (any OS):  Scripting tab → Open → scene.py → Run Script, then Render → Render Animation (Ctrl+F12).
From a terminal:
  blender -b -P scene.py -- --render            # full 1920×1080 render to ./render/ as PNG frames
  blender -b -P scene.py -- --preview           # 960×540, few samples, every frame
  blender -b -P scene.py -- --stills 100 500    # only these frames
  add --save to also write storm-lighthouse.blend next to this script.
"""
import bpy, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() and __file__ else os.getcwd()
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
FPS, END = 24, 1440

# ---------------------------------------------------------------- helpers
def clean():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras, bpy.data.textures, bpy.data.worlds):
        for d in list(coll): coll.remove(d)
    for m in list(bpy.context.scene.timeline_markers): bpy.context.scene.timeline_markers.remove(m)

def link(o):
    bpy.context.scene.collection.objects.link(o); return o

def sock(node, *names):
    for n in names:
        if n in node.inputs: return node.inputs[n]
    return None

def principled(name, color, rough=.5, metal=0., emit=None, emit_strength=0.):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        s = sock(b, 'Emission Color', 'Emission'); s.default_value = (*emit, 1)
        st = sock(b, 'Emission Strength')
        if st: st.default_value = emit_strength
    return m

def beam_material():
    """Soft light shaft: a fully transparent surface with emission added on top, strongest where the cone is seen face-on
    (the thickest part of the shaft) and fading out toward its silhouette."""
    m = bpy.data.materials.new('Beam'); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    em = nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (1., .86, .6, 1)
    lw = nt.nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = .5
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = .0; ramp.color_ramp.elements[0].color = (1, 1, 1, 1)
    ramp.color_ramp.elements[1].position = .9; ramp.color_ramp.elements[1].color = (0, 0, 0, 1)
    k = nt.nodes.new('ShaderNodeMath'); k.operation = 'MULTIPLY'; k.inputs[1].default_value = .55
    add = nt.nodes.new('ShaderNodeAddShader')
    nt.links.new(lw.outputs['Facing'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], k.inputs[0])
    nt.links.new(k.outputs['Value'], em.inputs['Strength'])
    nt.links.new(tr.outputs['BSDF'], add.inputs[0])
    nt.links.new(em.outputs['Emission'], add.inputs[1])
    nt.links.new(add.outputs['Shader'], out.inputs['Surface'])
    if hasattr(m, 'blend_method'): m.blend_method = 'BLEND'
    if hasattr(m, 'surface_render_method'): m.surface_render_method = 'BLENDED'
    return m

def drive(owner, path, expr, index=-1):
    d = owner.driver_add(path, index) if index >= 0 else owner.driver_add(path)
    d.driver.type = 'SCRIPTED'; d.driver.expression = expr      # simple expressions (frame, sin, cos) run without "Auto Run Python"
    return d

def key(owner, path, frame, value, index=-1):
    if index >= 0: getattr(owner, path)[index] = value
    else: setattr(owner, path, value)
    owner.keyframe_insert(data_path=path, frame=frame, index=index)

def mesh_obj(name, op, **kw):
    op(**kw); o = bpy.context.active_object; o.name = name; return o

# ---------------------------------------------------------------- world and lightning
def build_world():
    w = bpy.data.worlds.new('Storm'); bpy.context.scene.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (.010, .016, .026, 1)
    bg.inputs['Strength'].default_value = 1.
    for f, v in [(1, 1), (149, 1), (150, 14), (151, 2), (152, 18), (156, 1), (999, 1), (1000, 22), (1002, 3), (1003, 16), (1008, 1)]:
        bg.inputs['Strength'].default_value = v; bg.inputs['Strength'].keyframe_insert('default_value', frame=f)
    moon = link(bpy.data.objects.new('Moonlight', bpy.data.lights.new('Moonlight', 'SUN')))
    moon.data.color = (.62, .72, 1.); moon.rotation_euler = (math.radians(58), 0, math.radians(-40))
    for f, v in [(1, .45), (149, .45), (150, 7), (151, .8), (152, 9), (156, .45), (999, .45), (1000, 11), (1002, 1), (1003, 8), (1008, .45)]:
        moon.data.energy = v; moon.data.keyframe_insert('energy', frame=f)

# ---------------------------------------------------------------- sea, cliff, lighthouse, boat
LH = (0., 60., 0.)            # lighthouse base (x, y); the cliff top is at z = 18
LAMP_Z = 18 + 17.5

def build_sea():
    bpy.ops.mesh.primitive_plane_add(size=2, location=(0, 0, 0)); sea = bpy.context.active_object; sea.name = 'Sea'
    oc = sea.modifiers.new('Ocean', 'OCEAN')
    oc.geometry_mode = 'GENERATE'; oc.repeat_x = oc.repeat_y = 3
    oc.spatial_size = 120; oc.resolution = int(os.environ.get('OCEAN_RES', 14))
    oc.wave_scale = 2.2; oc.choppiness = 1.3; oc.wind_velocity = 26
    sea.location = (-180, -180, 0)                                 # repeat 3×3 tiles of 120 m → about 360 m of sea around the action
    drive(oc, 'time', 'frame / 24 * 1.1')
    sea.data.materials.append(principled('Sea', (.010, .030, .040), rough=.08))
    bpy.ops.object.shade_smooth()
    return sea

def build_cliff():
    cliff = mesh_obj('Cliff', bpy.ops.mesh.primitive_cylinder_add, vertices=48, radius=26, depth=40, location=(LH[0], LH[1] + 6, -2))
    sub = cliff.modifiers.new('Sub', 'SUBSURF'); sub.levels = sub.render_levels = 3
    tex = bpy.data.textures.new('Rock', 'CLOUDS'); tex.noise_scale = 4.; tex.noise_depth = 4
    dis = cliff.modifiers.new('Rock', 'DISPLACE'); dis.texture = tex; dis.strength = 5.; dis.mid_level = .5
    cliff.data.materials.append(principled('Rock', (.035, .033, .030), rough=.92))
    return cliff

def build_lighthouse():
    white = principled('Paint', (.78, .76, .72), rough=.6)
    red = principled('Red', (.35, .03, .02), rough=.55)
    dark = principled('Iron', (.02, .02, .02), rough=.4, metal=.8)
    glass = principled('Lamp', (1, .9, .7), emit=(1., .82, .5), emit_strength=40.)
    x, y = LH[0], LH[1]
    tower = mesh_obj('Tower', bpy.ops.mesh.primitive_cone_add, vertices=40, radius1=3.2, radius2=2.2, depth=15, location=(x, y, 18 + 7.5))
    tower.data.materials.append(white); bpy.ops.object.shade_smooth()
    for i, z in enumerate((18 + 4, 18 + 10)):
        band = mesh_obj(f'Band{i}', bpy.ops.mesh.primitive_cylinder_add, vertices=40, radius=3.05 - i * .45, depth=1.6, location=(x, y, z))
        band.data.materials.append(red); bpy.ops.object.shade_smooth()
    gallery = mesh_obj('Gallery', bpy.ops.mesh.primitive_cylinder_add, vertices=40, radius=3.0, depth=.4, location=(x, y, 18 + 15.2))
    gallery.data.materials.append(dark)
    lantern = mesh_obj('Lantern', bpy.ops.mesh.primitive_cylinder_add, vertices=16, radius=1.6, depth=2.6, location=(x, y, LAMP_Z))
    lantern.data.materials.append(glass)
    cap = mesh_obj('Cap', bpy.ops.mesh.primitive_cone_add, vertices=32, radius1=2.1, radius2=.2, depth=1.8, location=(x, y, LAMP_Z + 2.2))
    cap.data.materials.append(red); bpy.ops.object.shade_smooth()
    house = mesh_obj('Keeper', bpy.ops.mesh.primitive_cube_add, size=1, location=(x + 7, y + 4, 18 + 2))
    house.scale = (5, 4, 4); house.data.materials.append(white)
    win = mesh_obj('Window', bpy.ops.mesh.primitive_plane_add, size=1.2, location=(x + 4.45, y + 4, 18 + 2.2))
    win.rotation_euler = (0, math.radians(90), 0); win.data.materials.append(principled('Window', (1, .7, .4), emit=(1, .62, .3), emit_strength=8))

    # the turning lamp: a pivot that carries a spot light and the visible beam
    pivot = link(bpy.data.objects.new('LampPivot', None)); pivot.location = (x, y, LAMP_Z)
    spot = link(bpy.data.objects.new('LampSpot', bpy.data.lights.new('LampSpot', 'SPOT')))
    spot.data.energy = 900000; spot.data.color = (1, .85, .6); spot.data.spot_size = math.radians(9); spot.data.spot_blend = .4
    spot.data.shadow_soft_size = .3
    spot.parent = pivot; spot.rotation_euler = (0, math.radians(90), 0)      # point the spot along +X
    beam = mesh_obj('Beam', bpy.ops.mesh.primitive_cone_add, vertices=32, radius1=.8, radius2=7, depth=90, location=(0, 0, 0), end_fill_type='NOTHING')
    beam.rotation_euler = (0, math.radians(90), 0); beam.location = (45, 0, 0); beam.parent = pivot
    beam.data.materials.append(beam_material())
    if hasattr(beam, 'visible_shadow'): beam.visible_shadow = False
    pivot.rotation_euler = (0, math.radians(17), 0)                          # tipped down toward the sea
    # yaw: keeps turning, then finds the boat (frame 1050), holds on it, and turns on again
    yaw_boat = math.atan2(BOAT_AT_FIND[1] - y, BOAT_AT_FIND[0] - x)
    turns_before = yaw_boat + 2 * math.pi * 11
    for f, v in [(1, 0.), (1030, turns_before - .35), (1060, turns_before), (1250, turns_before + .05), (1440, turns_before + 2 * math.pi * 1.6)]:
        key(pivot, 'rotation_euler', f, v, index=2)
    return pivot

BOAT_START, BOAT_AT_FIND, BOAT_END = (-55., -30.), (-22., -38.), (-14., -20.)

def build_boat():
    root = link(bpy.data.objects.new('Boat', None))
    hull = mesh_obj('Hull', bpy.ops.mesh.primitive_cube_add, size=1, location=(0, 0, 0))
    hull.scale = (5.5, 2.0, 1.1); bev = hull.modifiers.new('Bevel', 'BEVEL'); bev.width = .35; bev.segments = 3
    hull.data.materials.append(principled('Hull', (.18, .05, .03), rough=.7)); hull.parent = root
    cabin = mesh_obj('Cabin', bpy.ops.mesh.primitive_cube_add, size=1, location=(-.8, 0, 1.3))
    cabin.scale = (2.0, 1.5, 1.4); cabin.data.materials.append(principled('Cabin', (.6, .58, .52), rough=.6)); cabin.parent = root
    mast = mesh_obj('Mast', bpy.ops.mesh.primitive_cylinder_add, vertices=8, radius=.08, depth=4, location=(.8, 0, 2.6))
    mast.data.materials.append(principled('Wood', (.1, .07, .04), rough=.8)); mast.parent = root
    lamp = link(bpy.data.objects.new('CabinLight', bpy.data.lights.new('CabinLight', 'POINT')))
    lamp.data.color = (1, .62, .28); lamp.data.shadow_soft_size = .2; lamp.location = (.5, 0, 2.3); lamp.parent = root
    winmat = principled('CabinWindow', (1, .7, .4), emit=(1, .6, .28), emit_strength=6)
    for side in (-1, 1):                                              # lit windows on both sides of the cabin
        w = mesh_obj('CabinWin', bpy.ops.mesh.primitive_plane_add, size=1, location=(-.8, side * .76, 1.45))
        w.scale = (.9, .45, 1); w.rotation_euler = (math.radians(90), 0, 0); w.data.materials.append(winmat); w.parent = root
    # flicker while lost, steady once found (driver keeps working in every version)
    drive(lamp.data, 'energy', '(160 + 140*abs(sin(frame*0.71)*sin(frame*1.37)))*(frame < 1060) + 380*(frame >= 1060)')
    # bob and roll on the swell
    drive(root, 'location', 'sin(frame*0.09)*0.55 + sin(frame*0.23)*0.25 + 0.9', index=2)
    drive(root, 'rotation_euler', 'sin(frame*0.11)*0.10 + sin(frame*0.31)*0.04', index=0)
    drive(root, 'rotation_euler', 'sin(frame*0.07+1.0)*0.06', index=1)
    # course: drifting, found by the beam, turns toward the lighthouse
    for f, (bx, by) in [(1, BOAT_START), (1050, BOAT_AT_FIND), (1440, BOAT_END)]:
        key(root, 'location', f, bx, index=0); key(root, 'location', f, by, index=1)
    toward = math.atan2(LH[1] - BOAT_AT_FIND[1], LH[0] - BOAT_AT_FIND[0])
    for f, v in [(1, math.radians(-15)), (1100, math.radians(-10)), (1230, toward), (1440, toward)]:
        key(root, 'rotation_euler', f, v, index=2)
    return root

# ---------------------------------------------------------------- cameras: one per shot, bound to markers
SHOTS = [  # (name, first frame, last frame, lens mm, (camera from, to), (look-at from, to), follow boat?)
    ('S1_lost',      1,    240, 28, ((-70, -52, 3.2), (-48, -46, 2.6)),   ((0, 0, 1.0), (1, 0, 1.2)), True),
    ('S2_cabin',   241,    408, 85, ((-26, -36, 2.4), (-25, -33, 2.2)),   ((0, 0, 1.4), (0, 0, 1.5)), True),
    ('S3_tower',   409,    600, 35, ((-30, -60, 6), (-20, -30, 9)),       ((0, 60, 26), (0, 60, 28)), False),
    ('S4_lamp',    601,    792, 24, ((6, 50, 27), (5, 52, 28)),           ((0, 60, 35.5), (0, 60, 35.5)), False),
    ('S5_search',  793,   1104, 32, ((26, 96, 72), (20, 92, 66)),          ((-30, -20, 0), (-22, -38, 0)), False),
    ('S6_turn',   1105,   1250, 40, ((-46, -26, 3.4), (-42, -24, 3.8)),   ((0, 0, 1.6), (2, 0, 1.8)), True),
    ('S7_harbour', 1251,  1440, 30, ((-40, -70, 8), (-70, -120, 40)),     ((-10, 10, 4), (0, 40, 10)), False),
]

def build_cameras(boat):
    scene = bpy.context.scene
    for name, f0, f1, lens, (c0, c1), (t0, t1), follow in SHOTS:
        cam = link(bpy.data.objects.new(name, bpy.data.cameras.new(name)))
        cam.data.lens = lens; cam.data.clip_end = 2000
        cam.data.dof.use_dof = True; cam.data.dof.aperture_fstop = 2.8 if lens >= 80 else 5.6
        tgt = link(bpy.data.objects.new(name + '_aim', None))
        if follow: tgt.parent = boat                                  # aim offsets are relative to the boat
        con = cam.constraints.new('TRACK_TO'); con.target = tgt; con.track_axis = 'TRACK_NEGATIVE_Z'; con.up_axis = 'UP_Y'
        cam.data.dof.focus_object = tgt
        for f, c, t in ((f0, c0, t0), (f1, c1, t1)):
            for i in range(3):
                key(cam, 'location', f, c[i], index=i); key(tgt, 'location', f, t[i], index=i)
        # handheld drift on the boat shots
        if follow:
            drive(cam, 'rotation_euler', 'sin(frame*0.13)*0.004', index=2)
        m = scene.timeline_markers.new(name, frame=f0); m.camera = cam
    scene.camera = bpy.data.objects[SHOTS[0][0]]

# ---------------------------------------------------------------- render settings
def setup_render(preview=False):
    s = bpy.context.scene
    s.render.fps = FPS; s.frame_start = 1; s.frame_end = END
    s.render.resolution_x, s.render.resolution_y = (960, 540) if preview else (1920, 1080)
    s.render.resolution_percentage = 100
    s.render.engine = 'CYCLES'
    s.cycles.samples = 24 if preview else int(os.environ.get('SAMPLES', 128))
    s.cycles.use_denoising = True
    try:                                                                # use the GPU when the preferences have one set up
        prefs = bpy.context.preferences.addons['cycles'].preferences
        if prefs.compute_device_type != 'NONE': s.cycles.device = 'GPU'
    except Exception: pass
    s.render.image_settings.file_format = 'PNG'
    s.render.filepath = os.path.join(HERE, 'render', 'f_')
    s.render.use_motion_blur = True
    try: s.view_settings.view_transform = 'AgX'
    except TypeError: s.view_settings.view_transform = 'Filmic'
    try: s.view_settings.look = 'AgX - Medium High Contrast'
    except TypeError: pass

# ---------------------------------------------------------------- build
clean()
build_world()
build_sea(); build_cliff()
boat = build_boat()
build_lighthouse()
build_cameras(boat)
setup_render(preview='--preview' in ARGS or '--stills' in ARGS)
bpy.context.scene.frame_set(1)
print('storm-lighthouse: scene built,', len(bpy.data.objects), 'objects, frames 1 –', END)

if '--save' in ARGS:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'storm-lighthouse.blend'))
if '--stills' in ARGS:
    frames = [int(a) for a in ARGS[ARGS.index('--stills') + 1:] if a.isdigit()]
    s = bpy.context.scene
    for f in frames:
        s.frame_set(f)
        for m in sorted(s.timeline_markers, key=lambda m: m.frame):    # bind the shot's camera by hand (stills skip the marker switch)
            if m.frame <= f: s.camera = m.camera
        s.render.filepath = os.path.join(HERE, 'render', f'still_{f:04d}')
        bpy.ops.render.render(write_still=True)
        print('still', f)
elif '--render' in ARGS or '--preview' in ARGS:
    bpy.ops.render.render(animation=True)
