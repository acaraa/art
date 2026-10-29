// AI 위클리 — channel sting (4.0–5.5 s of ai-week-1029.mp4) rebuilt as an EffectCraft composition.
// Two lemon slashes → the plate slams in with an overshoot, a shake and an impact ring → its letters drop in →
// wordmark and dateline open → the plate flies to the top right and becomes the channel bug.
// Run: effectcraft-cli script sting.jsx --save-as ai-weekly-sting.ecproj   (see README.md)
// Timings match main.js (shotSting / stingLogo), with t = 0 at the start of the sting.

var W = 1920, H = 1080, FPS = 30, DUR = 2.0;
var INK = [18, 20, 23], LEMON = [242, 207, 29], LEMON_L = [248, 222, 74], LEMON_D = [216, 179, 12], GOLD = [212, 176, 100], WHITE = [255, 255, 255];
function rgb(c) { return [c[0] / 255, c[1] / 255, c[2] / 255]; }
var FONT_BOLD = "BarlowCondensed-ExtraBold", FONT_MONO = "IBMPlexMono-Medium";   // falls back to a bundled face if not installed

var comp = app.project.items.addComp("AI 위클리 · 스팅", W, H, 1, DUR, FPS);
comp.bgColor = rgb(INK);
comp.openInViewer && comp.openInViewer();

// keyframes with an ease on both sides of every key (influence in %, 0 speed): the house "snap and settle" feel
function keys(prop, list, influence) {
  for (var i = 0; i < list.length; i++) prop.setValueAtTime(list[i][0], list[i][1]);
  if (influence === undefined) return;
  var dims = prop.value instanceof Array ? prop.value.length : 1;
  if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) dims = 1;
  var e = [];
  for (var d = 0; d < dims; d++) e.push(new KeyframeEase(0, influence));
  for (var k = 1; k <= prop.numKeys; k++) prop.setTemporalEaseAtKey(k, e, e);
}
function hold(prop) { for (var k = 1; k <= prop.numKeys; k++) prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD); }
function shapeLayer(name) { var l = comp.layers.addShape(); l.name = name; return l; }
function group(layer, name) { var g = layer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group"); g.name = name; return g; }
function pathShape(g, pts) {
  var s = new Shape(); s.vertices = pts; s.closed = true;
  g.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValue(s);
}
function fill(g, c) { g.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(rgb(c)); }
function text(name, s, size, color, font, pos, just) {
  var l = comp.layers.addText(s); l.name = name;
  var p = l.property("ADBE Text Properties").property("ADBE Text Document"), d = p.value;
  d.fontSize = size; d.fillColor = rgb(color); d.applyFill = true; d.applyStroke = false;
  try { d.font = font; } catch (e) {}
  d.justification = just || ParagraphJustification.CENTER_JUSTIFY; d.tracking = 140;
  p.setValue(d);
  l.property("ADBE Transform Group").property("ADBE Position").setValue(pos);
  return l;
}
function tr(l, n) { return l.property("ADBE Transform Group").property(n); }

// —— background: ink solid with two slow light fins (static; the film's fins drift by a few pixels in 1.5 s) ——
var bg = comp.layers.addSolid(rgb(INK), "Background", W, H, 1);
// warm lemon glow upper right (the film's radial gradient: 16 % at the centre, gone by ~1100 px)
var glow = shapeLayer("Glow"), glg = group(glow, "Glow");
glg.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse").property("ADBE Vector Ellipse Size").setValue([1500, 1500]);
fill(glg, LEMON);
tr(glow, "ADBE Position").setValue([1300, 380]); tr(glow, "ADBE Opacity").setValue(12);
glow.property("ADBE Effect Parade").addProperty("ADBE Gaussian Blur 2").property(1).setValue(450);
var fins = shapeLayer("Light Fins");
[[300, 90, 0.05], [1120, 140, 0.04], [1680, 60, 0.035]].forEach(function (f) {
  var g = group(fins, "Fin " + f[0]);
  pathShape(g, [[f[0], 0], [f[0] + f[1], 0], [f[0] + f[1] - 500, H], [f[0] - 500, H]]);
  fill(g, LEMON);
  g.property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity").setValue(f[2] * 100);
});
fins.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);
tr(fins, "ADBE Position").setValue([0, 0]);

// —— two slashes sweep across (0.04–0.30 and 0.10–0.36) ——
function slash(name, h, dy, a, b) {
  var l = shapeLayer(name), g = group(l, "Bar");
  var r = g.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Rect");
  r.property("ADBE Vector Rect Size").setValue([1400, h]);
  fill(g, LEMON);
  tr(l, "ADBE Rotate Z").setValue(-8);
  keys(tr(l, "ADBE Position"), [[a, [-940, 470 + dy]], [b, [2860, 470 + dy]]], 60);
  l.inPoint = a; l.outPoint = b;
  return l;
}
slash("Slash 1", 22, -60, 0.04, 0.30);
slash("Slash 2", 8, 40, 0.10, 0.36);

// —— impact ring (0.42–0.80) ——
var ring = shapeLayer("Impact Ring"), rg = group(ring, "Ring");
var el = rg.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse");
var st = rg.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Stroke");
st.property("ADBE Vector Stroke Color").setValue(rgb(LEMON));
keys(el.property("ADBE Vector Ellipse Size"), [[0.42, [600, 240]], [0.80, [2000, 840]]], 70);
keys(st.property("ADBE Vector Stroke Width"), [[0.42, 7], [0.80, 1]]);
keys(st.property("ADBE Vector Stroke Opacity"), [[0.42, 100], [0.80, 0]]);
tr(ring, "ADBE Position").setValue([960, 450]);
ring.inPoint = 0.42; ring.outPoint = 0.80;

// —— wordmark and dateline open from the centre (0.50–0.80), gone by 1.18 ——
// "AI" in lemon, "WEEKLY" in white: two layers placed from the measured width of the whole word, so the pair stays centred
var probe = text("probe", "AI WEEKLY", 70, WHITE, FONT_BOLD, [0, 0]), whole = probe.sourceRectAtTime(0, false).width; probe.remove();
var wmA = text("Wordmark AI", "AI", 70, LEMON, FONT_BOLD, [960 - whole / 2, 640], ParagraphJustification.LEFT_JUSTIFY);
var wmB = text("Wordmark WEEKLY", "WEEKLY", 70, WHITE, FONT_BOLD, [960 + whole / 2, 640], ParagraphJustification.RIGHT_JUSTIFY);
var dl = text("Dateline", "WEEK 44 · 26–29 OCT 2026", 22, GOLD, FONT_MONO, [960, 690]);
[wmA, wmB, dl].forEach(function (l) {
  tr(l, "ADBE Anchor Point").setValue([960 - tr(l, "ADBE Position").value[0], 0]);   // scale from the centre of the comp, like the film's clip
  tr(l, "ADBE Position").setValue([960, tr(l, "ADBE Position").value[1]]);
  keys(tr(l, "ADBE Scale"), [[0.50, [70, 100]], [0.80, [100, 100]]], 75);
  keys(tr(l, "ADBE Opacity"), [[0.50, 0], [0.65, 100], [1.05, 100], [1.18, 0]]);
});

// —— the plate: parallelogram with a vertical lemon gradient, ink and gold bars at the left ——
var plate = shapeLayer("Plate");
var pw = 520, ph = 180, k = ph * 0.28;
var gx = -pw / 2 - k, b1 = pw * 0.085, b2 = pw * 0.11;
var inkBar = group(plate, "Ink Bar"); pathShape(inkBar, [[gx + 2 * k, -ph / 2], [gx + 2 * k + b1, -ph / 2], [gx + b1, ph / 2], [gx, ph / 2]]); fill(inkBar, INK);
var goldBar = group(plate, "Gold Bar"); pathShape(goldBar, [[gx + 2 * k + b1, -ph / 2], [gx + 2 * k + b2, -ph / 2], [gx + b2, ph / 2], [gx + b1, ph / 2]]); fill(goldBar, GOLD);
var body = group(plate, "Body");
pathShape(body, [[-pw / 2 + k, -ph / 2], [pw / 2 + k, -ph / 2], [pw / 2 - k, ph / 2], [-pw / 2 - k, ph / 2]]);
var gf = body.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - G-Fill");
try {   // linear gradient top → bottom; a plain fill if the gradient API is unavailable
  gf.property("ADBE Vector Grad Start Pt").setValue([0, -ph / 2]);
  gf.property("ADBE Vector Grad End Pt").setValue([0, ph / 2]);
  gf.property("ADBE Vector Grad Colors").setValue([0, LEMON_L[0] / 255, LEMON_L[1] / 255, LEMON_L[2] / 255, 1, LEMON_D[0] / 255, LEMON_D[1] / 255, LEMON_D[2] / 255]);
} catch (e) { gf.remove(); fill(body, LEMON); }
// the bars are created first so they draw above the body (the first group in Contents is on top)
plate.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);

// letters ride on the plate (parented), dropping in from above 0.30–0.70
// position, scale and rotation are set after parenting, so they are in the plate's own space (its centre is 0, 0)
var letters = text("Plate Letters", "AI·W", 144, INK, FONT_BOLD, [0, 0]);
letters.parent = plate;
tr(letters, "ADBE Scale").setValue([100, 100]); tr(letters, "ADBE Rotate Z").setValue(0);
keys(tr(letters, "ADBE Opacity"), [[0.30, 0], [0.45, 100]]);
keys(tr(letters, "ADBE Position"), [[0.30, [20, 12]], [0.70, [20, 52]]], 80);

// plate motion: slam (0.16–0.42, overshoot), shake (0.42–0.70), hold, fly to the bug (1.12–1.45)
var pp = tr(plate, "ADBE Position"), ps = tr(plate, "ADBE Scale"), pr = tr(plate, "ADBE Rotate Z");
keys(ps, [[0.16, [0, 0]], [0.32, [118, 118]], [0.42, [100, 100]], [1.12, [100, 100]], [1.45, [32.7, 32.7]]], 70);
keys(pr, [[0.16, -7], [0.42, 0]], 70);
keys(pp, [[0.16, [960, 450]], [0.42, [960, 450]], [0.47, [974, 450]], [0.52, [951, 450]], [0.58, [966, 450]], [0.64, [956, 450]], [0.70, [960, 450]],
          [1.12, [960, 450]], [1.45, [1739, 86]]], 60);

// glint: a white band sweeps across the plate (0.85–1.12), clipped to the plate by an alpha matte
var glint = shapeLayer("Glint"), gg = group(glint, "Band");
pathShape(gg, [[-80, -120], [0, -120], [-60, 120], [-140, 120]]); fill(gg, WHITE);
gg.property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity").setValue(55);
keys(tr(glint, "ADBE Position"), [[0.85, [960 - 330, 450]], [1.12, [960 + 400, 450]]], 50);
glint.inPoint = 0.85; glint.outPoint = 1.12;
var matte = plate.duplicate(); matte.name = "Plate (glint matte)";
matte.moveBefore(glint);   // a track matte sits directly above the layer it clips
try { glint.trackMatteType = TrackMatteType.ALPHA; } catch (e) {}

// the bug's caption appears once the plate lands
var cap = text("Bug Caption", "WEEKLY", 26, WHITE, FONT_BOLD, [1650, 96], ParagraphJustification.RIGHT_JUSTIFY);
keys(tr(cap, "ADBE Opacity"), [[1.38, 0], [1.50, 95]]);
// the maker's handle under the bug, as in the film
var handle = text("Handle", "@noah.aiart", 18, [244, 241, 232], FONT_MONO, [1836, 148], ParagraphJustification.RIGHT_JUSTIFY);
keys(tr(handle, "ADBE Opacity"), [[1.45, 0], [1.70, 80]]);

handle.moveToBeginning();
// order, top to bottom: handle, caption, glint, its matte, letters, plate, wordmark, dateline, ring, slashes, fins, background
cap.moveToBeginning();
writeLn("built " + comp.name + ": " + comp.numLayers + " layers, " + comp.duration + " s at " + comp.frameRate + " fps");
comp.name;
