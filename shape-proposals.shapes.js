/* Twenty silhouettes, proposed for the site's dark field. Scratch: nothing in
 * the build imports this, and `shape-proposals.html` beside it is the only page
 * that does.
 *
 * A silhouette here is not written as a `d` string. It is written as a ring of
 * anchors — a point, the direction the outline travels through it, and how full
 * the turn is — and the cubic handles are solved for. Two reasons, both of them
 * failures the shipped shapes are documented with:
 *
 *   G1. `clipDefs()` in src/layouts/base.mjs says a silhouette joins "at the
 *       extremes with matching tangents so nothing corners mid-curve". Written
 *       as a `d` string that is a promise about two control points being
 *       collinear with an anchor, kept by hand, in twenty shapes. Here the
 *       anchor owns one tangent and both handles are struck along it, so a
 *       corner mid-curve is not a mistake that can be made — only a corner
 *       declared with `tin`/`tout`, which is what a weld on a page edge is.
 *
 *   G2. `dnaBlob` carries the other half: "the handle lengths are picked so the
 *       radius of curvature runs on across each join instead of stepping. Drawn
 *       by eye the flank stepped from 66px to 84px at its foot, which the eye
 *       reads as a flat spot." Curvature at an anchor works out to C/a² on the
 *       way in and C'/b² on the way out, where C and C' do not depend on a or b
 *       at all — so equalising them is a ratio, and `relax()` below solves the
 *       ring for it. The author sets how full a turn is; the solver decides
 *       where that fullness goes.
 *
 * Everything is in the unit square of the box that carries the shape, y down,
 * the same space `clipPathUnits="objectBoundingBox"` reads.
 */

/* ------------------------------------------------------------------ *
 * Vectors
 * ------------------------------------------------------------------ */

const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const mul = (p, k) => [p[0] * k, p[1] * k];
const len = (p) => Math.hypot(p[0], p[1]);
const cross = (p, q) => p[0] * q[1] - p[1] * q[0];
const unit = (p) => { const l = len(p) || 1; return [p[0] / l, p[1] / l]; };

/* ------------------------------------------------------------------ *
 * The ring
 * ------------------------------------------------------------------ */

/* An anchor is `{ p, t }` plus, optionally:
 *   tin / tout  — a declared corner. Only ever used where the outline is welded
 *                 to a page edge or to a panel's rule, which is the one place
 *                 this system allows a corner. `t` fills whichever is absent,
 *                 so an anchor with a straight run on one side only has to name
 *                 the tangent of the side that curves.
 *   line        — the segment leaving this anchor is straight. That is the run
 *                 along the edge the shape is welded to, and nothing else.
 *   full        — how full this turn is, 1 being circular. Scales both handles
 *                 before the solver splits them.
 *   a, b        — an explicit handle length, in and out. Escape hatch.
 */

function prepare(anchors) {
  const n = anchors.length;
  const at = (i) => anchors[(i + n) % n];

  return anchors.map((anchor, i) => {
    const prev = at(i - 1);
    const next = at(i + 1);
    const full = anchor.full ?? 1;
    // A handle is struck at 0.38 of its own chord, which is what a quarter of a
    // circle wants (0.5523·r against a chord of 1.414·r). The solver moves it
    // from there; `full` is where it starts.
    const chordIn = len(sub(anchor.p, prev.p));
    const chordOut = len(sub(next.p, anchor.p));
    return {
      p: anchor.p,
      tin: unit(anchor.tin ?? anchor.t),
      tout: unit(anchor.tout ?? anchor.t),
      // A corner is an anchor whose two tangents were declared apart, or one
      // with a straight run on either side. It is left out of the relaxation:
      // curvature is not meant to run on across a weld.
      corner: Boolean(anchor.tin && anchor.tout) || Boolean(anchor.line) || Boolean(prev.line),
      // Smooth, but kept out of the relaxation: a turn tight enough that the
      // author had to set both handles by hand, which is every notch narrower
      // than it is deep. Curvature still runs on either side of it; it just
      // does not get to move.
      fixed: Boolean(anchor.fixed),
      lineOut: Boolean(anchor.line),
      a: anchor.a ?? 0.38 * chordIn * full,
      b: anchor.b ?? 0.38 * chordOut * full
    };
  });
}

/* Equalise curvature across every join that is not a weld.
 *
 * For the segment arriving at anchor i, curvature at its end is
 *   κ_in  = (2/3)·|tin_i × (p_i − p_{i−1} − b_{i−1}·tout_{i−1})| / a_i²
 * and for the segment leaving it, curvature at its start is
 *   κ_out = (2/3)·|tout_i × (p_{i+1} − p_i − a_{i+1}·tin_{i+1})| / b_i².
 * Neither numerator contains a_i or b_i, so κ_in = κ_out is a_i/b_i = √(C/C'),
 * and holding a_i + b_i fixed leaves the author's fullness alone while the
 * solver decides how it is spent. The numerators do move as the neighbours
 * settle, so it is iterated rather than solved once. */
function relax(ring, passes = 400) {
  const n = ring.length;
  const at = (i) => ring[(i + n) % n];

  for (let pass = 0; pass < passes; pass += 1) {
    for (let i = 0; i < n; i += 1) {
      const cur = at(i);
      if (cur.corner || cur.fixed) continue;
      const prev = at(i - 1);
      const next = at(i + 1);

      const cIn = Math.abs(cross(cur.tin, sub(sub(cur.p, prev.p), mul(prev.tout, prev.b))));
      const cOut = Math.abs(cross(cur.tout, sub(sub(next.p, cur.p), mul(next.tin, next.a))));
      if (cIn < 1e-9 || cOut < 1e-9) continue;

      // Clamped so an inflection — where one numerator goes to nothing — cannot
      // pull a handle to zero and put a cusp in a curve that has no corner.
      const ratio = Math.min(4, Math.max(0.25, Math.sqrt(cIn / cOut)));
      const total = cur.a + cur.b;
      const targetA = (total * ratio) / (1 + ratio);
      cur.a += (targetA - cur.a) * 0.5;
      cur.b = total - cur.a;
    }
    guard(ring);
  }
  return ring;
}

/* The one thing curvature matching will not save you from. Two handles struck
 * along tangents that both lean across the chord rather than along it push the
 * control polygon into a zigzag, and the segment folds: the outline leaves the
 * anchor, swings past where it is going and comes back. It is what a notch
 * narrower than it is deep does every time.
 *
 * So each segment's two handles are capped on their component along the chord —
 * together they may not spend more than the chord — and on their component
 * across it, which is what actually folds the curve. Nothing is scaled up here,
 * only down, so the author's fullness is a ceiling and never a floor. */
function guard(ring) {
  const n = ring.length;
  const at = (i) => ring[(i + n) % n];
  for (let i = 0; i < n; i += 1) {
    const cur = at(i);
    const next = at(i + 1);
    if (cur.lineOut) continue;
    const chord = sub(next.p, cur.p);
    const l = len(chord);
    if (l < 1e-9) continue;
    const dir = mul(chord, 1 / l);
    const nrm = [-dir[1], dir[0]];

    const along = cur.b * (cur.tout[0] * dir[0] + cur.tout[1] * dir[1])
      + next.a * (next.tin[0] * dir[0] + next.tin[1] * dir[1]);
    if (along > 0.98 * l) {
      const k = (0.98 * l) / along;
      cur.b *= k;
      next.a *= k;
    }
    const across = Math.abs(cur.b * (cur.tout[0] * nrm[0] + cur.tout[1] * nrm[1]))
      + Math.abs(next.a * (next.tin[0] * nrm[0] + next.tin[1] * nrm[1]));
    if (across > 0.80 * l) {
      const k = (0.80 * l) / across;
      cur.b *= k;
      next.a *= k;
    }
  }
}

const f = (v) => {
  const s = v.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  return s === '-0' ? '0' : s;
};

function toPath(ring) {
  const n = ring.length;
  const at = (i) => ring[(i + n) % n];
  let d = `M${f(ring[0].p[0])},${f(ring[0].p[1])}`;
  for (let i = 0; i < n; i += 1) {
    const cur = at(i);
    const next = at(i + 1);
    if (cur.lineOut) {
      d += ` L${f(next.p[0])},${f(next.p[1])}`;
      continue;
    }
    const c1 = add(cur.p, mul(cur.tout, cur.b));
    const c2 = sub(next.p, mul(next.tin, next.a));
    d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(next.p[0])},${f(next.p[1])}`;
  }
  return `${d} Z`;
}

/* ------------------------------------------------------------------ *
 * Measurement
 * ------------------------------------------------------------------ */

const bez = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  const k0 = u * u * u, k1 = 3 * u * u * t, k2 = 3 * u * t * t, k3 = t * t * t;
  return [
    k0 * p0[0] + k1 * p1[0] + k2 * p2[0] + k3 * p3[0],
    k0 * p0[1] + k1 * p1[1] + k2 * p2[1] + k3 * p3[1]
  ];
};

function polyline(ring, per = 48) {
  const n = ring.length;
  const at = (i) => ring[(i + n) % n];
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const cur = at(i);
    const next = at(i + 1);
    if (cur.lineOut) { pts.push(cur.p); continue; }
    const c1 = add(cur.p, mul(cur.tout, cur.b));
    const c2 = sub(next.p, mul(next.tin, next.a));
    for (let k = 0; k < per; k += 1) pts.push(bez(cur.p, c1, c2, next.p, k / per));
  }
  return pts;
}

const segHit = (a, b, c, d) => {
  const r = sub(b, a), s = sub(d, c), den = cross(r, s);
  if (Math.abs(den) < 1e-12) return false;
  const t = cross(sub(c, a), s) / den;
  const u = cross(sub(c, a), r) / den;
  return t > 1e-6 && t < 1 - 1e-6 && u > 1e-6 && u < 1 - 1e-6;
};

/* Curvature at each end of every segment, so a join can be reported as the
 * ratio between the two. 1.00 is a join the eye cannot find. */
function curvatures(ring) {
  const n = ring.length;
  const at = (i) => ring[(i + n) % n];
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const cur = at(i);
    const next = at(i + 1);
    if (cur.lineOut) { out.push(null); continue; }
    const c1 = add(cur.p, mul(cur.tout, cur.b));
    const c2 = sub(next.p, mul(next.tin, next.a));
    const k0 = (2 / 3) * Math.abs(cross(sub(c1, cur.p), sub(c2, c1))) / Math.pow(len(sub(c1, cur.p)), 3);
    const k1 = (2 / 3) * Math.abs(cross(sub(next.p, c2), sub(c2, c1))) / Math.pow(len(sub(next.p, c2)), 3);
    out.push([k0, k1]);
  }
  return out;
}

/* How far the tangent turns inside one segment, in degrees.
 *
 * This is the measure that separates a silhouette that reads as drawn from one
 * that reads as approximated, and it was found by measuring the shipped ones
 * rather than by eye. `clipDefs()` keeps every segment to about a quarter turn:
 * a median of 80–95 degrees across the fourteen, and a maximum of 106 on the
 * petal — the three that go past 130 are the three with a deliberate corner in
 * them (the dome, the leaf, the ridge). A cubic asked to turn much further than
 * a quarter cannot hold its curvature while doing it: it runs nearly straight
 * through the middle and does the turning at the two ends, and the eye reads
 * the straight part as a flat spot on what was meant to be a curve. Splitting
 * the segment alone would not help — the curve is the same curve — but an
 * anchor at the midpoint gives the relaxation a third point to even the
 * curvature over, and that does. */
function segmentTurn(p0, p1, p2, p3) {
  let prev = null;
  let total = 0;
  for (let k = 0; k <= 48; k += 1) {
    const t = k / 48, u = 1 - t;
    const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
    const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
    const a = Math.atan2(dy, dx);
    if (prev !== null) {
      let d = a - prev;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      total += Math.abs(d);
    }
    prev = a;
  }
  return (total * 180) / Math.PI;
}

/* Put an anchor in the middle of any segment that is turning further than a
 * quarter, then let the relaxation even the curvature out over three points
 * instead of two. The new anchor sits exactly on the curve, with exactly the
 * curve's own tangent, so the first pass changes nothing at all — the shape
 * moves only because the solver now has somewhere to move it. Repeated until
 * no segment is over the limit, or the ring reaches twelve anchors, which is
 * more than any shipped silhouette has. */
const TURN_LIMIT = 96;

function refine(ring) {
  for (let round = 0; round < 8; round += 1) {
    const n = ring.length;
    if (n >= 12) break;

    let worst = TURN_LIMIT;
    let at = -1;
    for (let i = 0; i < n; i += 1) {
      const cur = ring[i];
      if (cur.lineOut) continue;
      const next = ring[(i + 1) % n];
      const c1 = add(cur.p, mul(cur.tout, cur.b));
      const c2 = sub(next.p, mul(next.tin, next.a));
      const t = segmentTurn(cur.p, c1, c2, next.p);
      if (t > worst) { worst = t; at = i; }
    }
    if (at < 0) break;

    const cur = ring[at];
    const next = ring[(at + 1) % n];
    const c1 = add(cur.p, mul(cur.tout, cur.b));
    const c2 = sub(next.p, mul(next.tin, next.a));

    // de Casteljau at the halfway point: the point on the curve and the curve's
    // own tangent there.
    const mid = (p, q) => mul(add(p, q), 0.5);
    const a1 = mid(cur.p, c1), a2 = mid(c1, c2), a3 = mid(c2, next.p);
    const b1 = mid(a1, a2), b2 = mid(a2, a3);
    const point = mid(b1, b2);
    const tangent = unit(sub(b2, b1));

    const inserted = {
      p: point, tin: tangent, tout: tangent,
      corner: false, fixed: false, lineOut: false,
      a: 0.38 * len(sub(point, cur.p)),
      b: 0.38 * len(sub(next.p, point))
    };
    // The two handles that faced across the old segment are re-struck against
    // the two new chords, so the author's fullness stays proportional.
    cur.b = 0.38 * len(sub(point, cur.p));
    next.a = 0.38 * len(sub(next.p, point));

    ring.splice(at + 1, 0, inserted);
    relax(ring, 300);
  }
  return ring;
}

/* A segment folds when its tangent reverses against its own chord: the outline
 * leaves the anchor, overshoots where it is going and comes back. Curvature
 * matching cannot see it and the eye cannot unsee it, so it is counted. */
function folds(ring) {
  const n = ring.length;
  const at = (i) => ring[(i + n) % n];
  let count = 0;
  for (let i = 0; i < n; i += 1) {
    const cur = at(i);
    const next = at(i + 1);
    if (cur.lineOut) continue;
    const c1 = add(cur.p, mul(cur.tout, cur.b));
    const c2 = sub(next.p, mul(next.tin, next.a));
    const dir = unit(sub(next.p, cur.p));
    let sign = 0;
    for (let k = 0; k <= 60; k += 1) {
      const t = k / 60, u = 1 - t;
      const dx = 3 * u * u * (c1[0] - cur.p[0]) + 6 * u * t * (c2[0] - c1[0]) + 3 * t * t * (next.p[0] - c2[0]);
      const dy = 3 * u * u * (c1[1] - cur.p[1]) + 6 * u * t * (c2[1] - c1[1]) + 3 * t * t * (next.p[1] - c2[1]);
      const s = Math.sign(dx * dir[0] + dy * dir[1]);
      if (s !== 0 && sign !== 0 && s !== sign) { count += 1; break; }
      if (s !== 0) sign = s;
    }
  }
  return count;
}

/* How far each segment stands off its own chord, as a share of that chord. A
 * flank is taut at a few per cent and round at ten; a tip is thirty. */
function segmentBows(ring) {
  const n = ring.length;
  const at = (i) => ring[(i + n) % n];
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const cur = at(i);
    if (cur.lineOut) continue;
    const next = at(i + 1);
    const c1 = add(cur.p, mul(cur.tout, cur.b));
    const c2 = sub(next.p, mul(next.tin, next.a));
    const chord = len(sub(next.p, cur.p));
    if (chord < 1e-9) { out.push(0); continue; }
    const dir = mul(sub(next.p, cur.p), 1 / chord);
    let worst = 0;
    for (let k = 0; k <= 40; k += 1) {
      const q = sub(bez(cur.p, c1, c2, next.p, k / 40), cur.p);
      const d = Math.abs(cross(q, dir));
      if (d > worst) worst = d;
    }
    out.push(worst / chord);
  }
  return out;
}

function hull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const half = (list) => {
    const out = [];
    for (const p of list) {
      while (out.length > 1 && cross(sub(out[out.length - 1], out[out.length - 2]), sub(p, out[out.length - 2])) <= 0) out.pop();
      out.push(p);
    }
    return out;
  };
  const lower = half(pts);
  const upper = half([...pts].reverse());
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

function hollow(pts, diag) {
  const h = hull(pts);
  if (h.length < 3 || diag < 1e-9) return 0;
  let worst = 0;
  for (const p of pts) {
    let best = Infinity;
    for (let i = 0; i < h.length; i += 1) {
      const a = h[i], b = h[(i + 1) % h.length];
      const ab = sub(b, a);
      const l2 = ab[0] * ab[0] + ab[1] * ab[1];
      const t = l2 < 1e-12 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / l2));
      const d = len(sub(p, add(a, mul(ab, t))));
      if (d < best) best = d;
    }
    if (best > worst) worst = best;
  }
  return worst / diag;
}

export function measure(ring) {
  const n = ring.length;
  const at = (i) => ring[(i + n) % n];
  const pts = polyline(ring);
  const m = pts.length;

  let crosses = false;
  for (let i = 0; i < m && !crosses; i += 1) {
    for (let j = i + 2; j < m; j += 1) {
      if (i === 0 && j === m - 1) continue;
      if (segHit(pts[i], pts[(i + 1) % m], pts[j], pts[(j + 1) % m])) { crosses = true; break; }
    }
  }

  let area = 0;
  for (let i = 0; i < m; i += 1) {
    const q = pts[(i + 1) % m];
    area += pts[i][0] * q[1] - q[0] * pts[i][1];
  }

  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const k = curvatures(ring);

  // The worst join in the ring: how far the radius of curvature steps across an
  // anchor that is not a weld. Reported as a factor, so 1.00 is no step at all.
  let worst = 1;
  let worstAt = -1;
  for (let i = 0; i < n; i += 1) {
    const cur = at(i);
    if (cur.corner) continue;
    const before = k[(i - 1 + n) % n];
    const after = k[i];
    if (!before || !after) continue;
    const r = Math.max(before[1], after[0]) / Math.max(1e-9, Math.min(before[1], after[0]));
    if (r > worst) { worst = r; worstAt = i; }
  }

  // Which box edges the outline is welded to, and over what run. Only a
  // straight segment lying on an edge counts: that is what a weld is.
  const welds = [];
  for (let i = 0; i < n; i += 1) {
    const cur = at(i);
    if (!cur.lineOut) continue;
    const next = at(i + 1);
    const [x1, y1] = cur.p;
    const [x2, y2] = next.p;
    if (Math.abs(x1) < 1e-6 && Math.abs(x2) < 1e-6) welds.push(['left', Math.min(y1, y2), Math.max(y1, y2)]);
    else if (Math.abs(x1 - 1) < 1e-6 && Math.abs(x2 - 1) < 1e-6) welds.push(['right', Math.min(y1, y2), Math.max(y1, y2)]);
    else if (Math.abs(y1) < 1e-6 && Math.abs(y2) < 1e-6) welds.push(['top', Math.min(x1, x2), Math.max(x1, x2)]);
    else if (Math.abs(y1 - 1) < 1e-6 && Math.abs(y2 - 1) < 1e-6) welds.push(['bottom', Math.min(x1, x2), Math.max(x1, x2)]);
  }

  const turns = [];
  for (let i = 0; i < n; i += 1) {
    const cur = at(i);
    if (cur.lineOut) continue;
    const next = at(i + 1);
    turns.push(segmentTurn(cur.p, add(cur.p, mul(cur.tout, cur.b)), sub(next.p, mul(next.tin, next.a)), next.p));
  }

  // The bow: how far the free run of the outline stands off the straight line
  // between the two points where it leaves the edge it is welded to, as a share
  // of that line. The design README gives the working figure — "struck corner to
  // corner with five points of bow across a 690px box, it read as a black
  // triangle; a fifth of the span is the working figure for the bow" — and it is
  // the one number that says whether a shape hung between two welds is drawn or
  // merely bent. Reported for the longest free run; meaningless, and skipped,
  // for a shape with no weld at all.
  // Which box edge a straight segment lies on, or null.
  const edgeOf = (p, q) => {
    if (Math.abs(p[0]) < 1e-6 && Math.abs(q[0]) < 1e-6) return 'left';
    if (Math.abs(p[0] - 1) < 1e-6 && Math.abs(q[0] - 1) < 1e-6) return 'right';
    if (Math.abs(p[1]) < 1e-6 && Math.abs(q[1]) < 1e-6) return 'top';
    if (Math.abs(p[1] - 1) < 1e-6 && Math.abs(q[1] - 1) < 1e-6) return 'bottom';
    return null;
  };

  let bow = 0;
  let bowSpan = 0;
  // The README's figure — "struck corner to corner ... a fifth of the span is
  // the working figure for the bow" — is about a free run thrown between two
  // *different* edges. For a shape welded along one edge and bulging off it,
  // the same arithmetic measures something else entirely: the chord is the weld
  // itself, and the number is just how far the body stands off it. So the two
  // ends of the free run are checked, and the row is only printed when they sit
  // on different edges.
  let bowCross = false;
  let bowEdges = null;
  if (welds.length) {
    let best = -1;
    let bestLen = 0;
    for (let start = 0; start < n; start += 1) {
      if (!at(start - 1).lineOut) continue;
      let count = 0;
      while (count < n && !at(start + count).lineOut) count += 1;
      if (count > bestLen) { bestLen = count; best = start; }
    }
    if (best >= 0 && bestLen > 0) {
      const from = at(best).p;
      const to = at(best + bestLen).p;
      const span = len(sub(to, from));
      bowSpan = span;
      const before = at(best - 1);
      const after = at(best + bestLen);
      bowEdges = [edgeOf(before.p, at(best).p), edgeOf(after.p, at(best + bestLen + 1).p)];
      bowCross = Boolean(
        edgeOf(before.p, at(best).p) && edgeOf(after.p, at(best + bestLen + 1).p)
          && edgeOf(before.p, at(best).p) !== edgeOf(after.p, at(best + bestLen + 1).p)
      );
      if (span > 1e-6) {
        const dir = mul(sub(to, from), 1 / span);
        const nrm = [-dir[1], dir[0]];
        for (let i = 0; i < bestLen; i += 1) {
          const cur = at(best + i);
          const next = at(best + i + 1);
          const c1 = add(cur.p, mul(cur.tout, cur.b));
          const c2 = sub(next.p, mul(next.tin, next.a));
          for (let k = 0; k <= 40; k += 1) {
            const q = bez(cur.p, c1, c2, next.p, k / 40);
            const d = Math.abs((q[0] - from[0]) * nrm[0] + (q[1] - from[1]) * nrm[1]);
            if (d > bow) bow = d;
          }
        }
        bow /= span;
      }
    }
  }

  return {
    crosses,
    bow,
    bowSpan,
    bowCross,
    bowEdges,
    hollow: hollow(pts, Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))),
    segBows: segmentBows(ring),
    folds: folds(ring),
    segments: turns.length,
    turnMax: Math.max(...turns),
    turnMed: [...turns].sort((a, b) => a - b)[Math.floor(turns.length / 2)],
    fill: Math.abs(area) / 2,
    bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
    worstJoin: worst,
    worstJoinAt: worstAt,
    corners: ring.reduce((sum, a) => sum + (a.corner ? 1 : 0), 0),
    welds
  };
}

export function build(anchors) {
  const ring = refine(relax(prepare(anchors)));
  return { ring, d: toPath(ring), stats: measure(ring) };
}

/* ------------------------------------------------------------------ *
 * The twenty
 *
 * `cat` is what the shape hangs from, which is the only structural distinction
 * between them:
 *   edge   — welded to a page edge, the way the petal and the arch are.
 *   panel  — welded to a block's own rule: its foot, its flank, its top line.
 *   free   — welded to nothing. The site has two of these today (the staffing
 *            pebbles) and they read only because the arch beside them is welded
 *            on three sides.
 *
 * `slot` sizes the box in the mock, and every one of them names **one length
 * and an aspect ratio** rather than two lengths. A clip path in
 * object-bounding-box units is a shape *of its box*: sized by two percentages
 * against a fluid column, the same `d` is a different silhouette at every window
 * width, and the ratio printed under the drawing would be true at 1440px and
 * nowhere else. This is item 11's third lesson from the design README — "a shape
 * needs its box held, not only its silhouette drawn" — applied to twenty boxes
 * instead of one.
 *
 * A note never states a number the page can measure for itself. Weld runs, fill,
 * reach, arc count, turn, bow and the curvature step are all read off `stats` at
 * render time and printed under the drawing, so a shape can be redrawn without
 * its description quietly going out of date. Three drafts of this file had notes
 * describing shapes that no longer existed, which on a page whose whole pitch is
 * that its numbers are measured is the one defect that discredits the rest.
 * ------------------------------------------------------------------ */

export const SHAPES = [
  /* -------------------------------------------------------------- 01 */
  {
    id: 'lobeFall',
    name: 'Val',
    cat: 'edge',
    context: 'hero',
    aspect: 1.02,
    slot: 'inset: 0 0 auto auto; width: 44%; aspect-ratio: 1.02;',
    intent: 'Hero-flank die het onderste deel van de rand loslaat.',
    note: `Komt de rechterrand binnen in de bovenhoek, haalt één keer naar links
      en valt weg, zodat het onderste deel van de rand papier blijft. De petal
      hangt aan twee hoeken en knijpt in het midden; deze hangt aan één stuk rand,
      en de knoppen onder de kop houden papier onder zich. Hij heette eerst
      "Sikkel" en dat was een naam voor een vorm die er niet stond: hij is bol
      over zijn hele omtrek, er zit nergens een holte in. Ook de doos is
      teruggebracht — op de helft van de hero-breedte werd het scherm half
      marineblauw, en dan wil de tegenoverliggende hoek een tweede vorm.`
  },
  /* -------------------------------------------------------------- 02 */
  {
    id: 'flameFoot',
    name: 'Vlam',
    cat: 'edge',
    context: 'rows',
    aspect: 0.47,
    slot: 'inset: auto 9% 0 auto; width: 132px; aspect-ratio: 0.47;',
    intent: 'Smalle staande vorm op de haarlijn onder een lijst.',
    note: `Staat op de onderrand op een korte voet — <b>lassen</b> en
      <b>bereik</b> hieronder zeggen hoe kort tegenover hoe breed hij zelf is —
      en helt naar rechts. Twee verschillen met de steen op de
      trainingspagina: die is gedrongen en ligt, deze staat en is smal, en beide
      randen verlaten de lijn bijna verticaal, zodat de vorm aan de lijn hangt in
      plaats van erop te rusten.`
  },
  /* -------------------------------------------------------------- 03 */
  {
    id: 'baySpine',
    name: 'Baai',
    cat: 'edge',
    context: 'article',
    aspect: 0.79,
    slot: 'inset: 0 0 auto auto; height: 100%; aspect-ratio: 0.79;',
    intent: 'Lange flank voor een sectie die niet in één scherm past.',
    note: `Twee lassen: de hele rechterrand en het laatste stuk van de onderrand.
      Die tweede is er niet voor de sier — de onderste lob reikte eerst ver naar
      links en moest van daaruit terug naar de hoek, en dat is precies de druppel
      die de ontwerpnotitie bij de mislukte kam beschrijft. Een lob die op de
      onderrand staat heeft geen haak nodig.
      <b>Wat deze vorm níét is:</b> het antwoord op de lege flank van de
      privacyverklaring. De ontwerpnotitie wijst dat antwoord expliciet af — twee
      vormen aan de uiteinden van een sectie van 2820px omlijsten een leegte in
      plaats van hem te vullen — en één doorlopende flank is de andere kant van
      diezelfde afweging, geen ontsnapping eraan. Ook de tweede kam-les geldt hier
      en is een echt risico: twee lobben met een rug ertussen lezen als een
      golfrand. Ongelijke lobben verzachten dat, ze heffen het niet op.
      En er is een tweede bezwaar dat drie versies van deze notitie niet hebben
      opgeschreven: op deze verhouding, met twee lobben en een knijp op één
      flank, <b>leest het silhouet als een cijfer 2</b>. De onderste lob is
      daarom gedraaid en staat nu op de onderrand in plaats van naar links terug
      te reiken, wat het verzacht. Wie ernaar kijkt en het cijfer nog ziet, heeft
      gelijk: dit is de vorm in de reeks waar het meest op af te dingen valt, en
      hij staat er omdat de familie een lange flank nodig heeft, niet omdat deze
      tekening af is.`
  },
  /* -------------------------------------------------------------- 04 */
  {
    id: 'drapeCove',
    name: 'Kom',
    cat: 'edge',
    context: 'rows',
    aspect: 3.4,
    slot: 'inset: 0 auto auto 0; width: 100%; aspect-ratio: 3.4;',
    mockStyle: 'padding-top: 300px;',
    intent: 'Uit de bovenrand én de linkerrand, tussen twee secties.',
    note: `Komt van de linkerrand af op ruim de helft van zijn hoogte, ligt op zijn
      diepste punt vlak tegen de bodem van zijn doos, en loopt van daar lang en
      ondiep uit naar rechts, waar hij op de rechterrand landt in plaats van in de
      hoek. Dat laatste is de regel die de dorpel hieronder ook draagt en die voor
      elke liggende vorm geldt: een omtrek die een hoek onder een scherpe hoek
      bereikt, laat daar een spie van een paar pixels achter, en dat leest als een
      splinter.`
  },
  /* -------------------------------------------------------------- 05 */
  {
    id: 'tongueLeft',
    name: 'Richel',
    cat: 'edge',
    context: 'article',
    aspect: 1.45,
    slot: 'inset: 14% auto auto 0; width: 34%; aspect-ratio: 1.45;',
    mockStyle: 'padding-left: 38%;',
    intent: 'Uit de linkerrand, naast een leeskolom.',
    note: `Gelast aan de linkerrand en loopt naar rechts uit tot een punt — de
      smalste bocht in de hele ring, want een tong die eindigt in de ronding van
      een lob is een lob. Het blad in de linkergoot van de staffingpagina knijpt
      drie keer over zijn hele hoogte; deze doet het omgekeerde: één rug, één
      tong, geen ritme. Wat naast een leeskolom komt te staan, moet de kolom niet
      nadoen.`
  },
  /* -------------------------------------------------------------- 06 */
  {
    id: 'cornerSpur',
    name: 'Spoor',
    cat: 'edge',
    context: 'hero',
    aspect: 1.18,
    slot: 'inset: auto 0 0 auto; width: 48%; aspect-ratio: 1.18;',
    intent: 'Hoekvorm die de hoek niet vult.',
    note: `Gelast aan de onderrand en de rechterrand tegelijk. De vrije rand is een
      S: bovenaan loopt hij dicht tegen de rechterrand aan, zodat de hoek een
      spoor krijgt, en halverwege ligt hij ver buiten de rechte lijn tussen begin
      en eind, zodat er een buik in zit. Die buik is het hele punt. De eerste twee
      versies liepen van hoek tot hoek met een flauwe boog en lazen als een zwarte
      driehoek — de ontwerpnotitie noemt een vijfde van de spanwijdte als
      werkgetal voor de boog, en <b>boog</b> onder de tekening zegt wat deze
      haalt. Wat die buik kost staat er ook: de <b>naad</b> ging van 1,00 naar
      1,36. Dat is een sprong die het oog in principe kan vinden, en hij staat
      hier tegenover een silhouet dat anders geen silhouet is; de bestaande
      vormen lopen tot 9,3.`
  },
  /* -------------------------------------------------------------- 07 */
  {
    id: 'tideBottom',
    name: 'Tij',
    cat: 'edge',
    context: 'rows',
    aspect: 4.6,
    slot: 'inset: auto auto 0 0; width: 100%; aspect-ratio: 4.6;',
    mockStyle: 'padding-bottom: 226px;',
    intent: 'Volle breedte onder een blok, zonder streep te worden.',
    note: `Loopt vlak op vanaf de linkerhoek, kruint ruim rechts van het midden en
      landt op de rechterrand. Dit is het antwoord op wat de ontwerpnotitie
      afwijst — "een streep zo breed als de pagina onder een blok tekst las als
      een drukfout" — maar alleen zolang de kruin duidelijk uit het midden ligt.
      Recht gezet is het weer een streep.`
  },
  /* -------------------------------------------------------------- 08 */
  {
    id: 'columnGutter',
    name: 'Zuil',
    cat: 'edge',
    context: 'article',
    aspect: 0.34,
    slot: 'inset: 0 auto auto 0; height: 100%; aspect-ratio: 0.34;',
    mockStyle: 'padding-left: 150px;',
    intent: 'Gelast aan boven- én onderrand, in de goot naast een kolom.',
    note: `De enige vorm in de reeks die aan twee tegenover elkaar liggende randen
      hangt, en de site heeft er geen. De breedte blijft over de hele hoogte
      ongeveer gelijk; wat beweegt is de as, links uit in het bovenste derde en
      rechts uit in het onderste. Dat onderscheid is nodig, want de eerste versie
      was een balk met een taille: in een doos die een derde zo breed is als
      hoog, wordt een deuk van een tiende van de breedte ongeveer 12px, en 12px
      op 370 is geen gedraaide vorm.
      Hij staat hier omdat wat er eerst stond een tweede kom was: dezelfde omtrek
      gespiegeld, met een las erbij, aangeprezen als tegenvorm. De maat die de
      reeks daarvoor aanhoudt geldt overal, ook in de vrije familie hieronder:
      <b>twee vormen zijn twee voorstellen als de bewerking anders is, niet als
      de stand anders is.</b> Spiegelen is geen bewerking.`
  },
  /* -------------------------------------------------------------- 09 */
  {
    id: 'panelSill',
    name: 'Dorpel',
    cat: 'panel',
    context: 'panel',
    aspect: 5.9,
    slot: 'inset: 100% auto auto 0; width: 100%; aspect-ratio: 5.9;',
    intent: 'Hangt onder de voet van een paneel.',
    note: `Vlak aan de voet van het paneel gelast, met een korte aanloop links en
      het gewicht op driekwart. De koepel onder de trainingspagina is het
      spiegelbeeld — daar ligt het gewicht links — dus twee panelen op één pagina
      kunnen deze twee dragen zonder dat het herhaling wordt. Eén ding is hier
      geleerd en geldt voor elke liggende vorm: laat hem niet in een hoek
      eindigen. De eerste versie klom terug naar de rechterbovenhoek, en in een
      doos die zes keer zo breed is als hoog, is die laatste klim een spie van een
      paar pixels breed die als een splinter leest. Deze eindigt vlak op de
      rechterrand, op halve diepte.`
  },
  /* -------------------------------------------------------------- 10 */
  {
    id: 'panelBracket',
    name: 'Beugel',
    cat: 'panel',
    context: 'panel',
    aspect: 0.29,
    slot: 'inset: 0 100% auto auto; height: 100%; aspect-ratio: 0.29;',
    intent: 'Tegen de flank van een paneel, over de volle hoogte.',
    note: `Vlak tegen de linkerflank van het paneel gelast over de volle hoogte,
      met één zwelling onder het midden. Het paneel houdt de rechte kant, de vorm
      de getekende — zo krijgt een blok een rand die leeft zonder dat het blok
      zelf een vorm wordt.`
  },
  /* -------------------------------------------------------------- 11 */
  {
    id: 'panelKnop',
    name: 'Knop',
    cat: 'panel',
    context: 'panel',
    aspect: 0.62,
    slot: 'inset: 26px auto auto 100%; height: 58%; aspect-ratio: 0.62;',
    intent: 'Tegen de flank van een paneel, over een deel van de hoogte.',
    note: `Tegen de rechterflank gelast, maar alleen over het bovenste deel, en
      met 26px speling onder de bovenhoek. Dat getal is de hele les. Hier stond
      een hoekvorm die aan twee randen hing waarvan er één niet bestond: het
      paneel heeft daar een straal van 16px, dus de vlakke kant van de vorm zweefde
      met papier eronder, over precies de bocht die hij zou moeten volgen. Een las
      moet op een rechte rand liggen die de lezer ziet. De flank is er zo een, de
      hoek niet.`
  },
  /* -------------------------------------------------------------- 12 */
  {
    id: 'panelTab',
    name: 'Tab',
    cat: 'panel',
    context: 'panel',
    aspect: 2.44,
    slot: 'inset: auto auto 100% 9%; width: 132px; aspect-ratio: 2.44;',
    intent: 'Kleine vorm op de bovenlijn van een paneel.',
    note: `Klein, breder dan hoog, één ronde kruin links van het midden, en de
      rechterflank is de lange. De helling is het enige wat hem uit de hoek van
      een tabblad houdt: de eerste versie had zijn top precies in het midden en
      twee gelijke voeten, en dat is UI-meubilair, geen merk. De kleinste vorm in
      de reeks, en de enige die naast tekst kan staan zonder ruimte te vragen.`
  },
  /* -------------------------------------------------------------- 13 */
  {
    id: 'panelKeel',
    name: 'Kiel',
    cat: 'panel',
    context: 'panel',
    aspect: 0.7,
    slot: 'inset: 100% 9% auto auto; width: 104px; aspect-ratio: 0.7;',
    intent: 'Hangt onder de verre hoek van een paneel.',
    note: `Gelast aan de onderlijn van het paneel, hangt naar links weg en loopt
      uit in een lange punt. De linkerflank is strak en de rechter zwaait —
      <b>flanken</b> onder de tekening zet de afwijking van elke boog tegenover
      zijn eigen koorde, en het verschil staat daar. Dat is wat hem onderscheidt van de vlam, die dezelfde plaats in de
      tekeningen inneemt maar dan omgekeerd en met twee ronde flanken. De eerste
      versie beweerde datzelfde en had het niet: beide flanken bogen ongeveer even
      veel, en het enige rechte stuk in de hele ring was een korte schouder naast
      de las. De tweede sloeg door naar de andere kant: de flank werd zo recht
      dat de helft van de ring een lijn was die als kromme getekend stond, en de
      site heeft precies één silhouet met een rechte lijn erin, waar
      <code>clipDefs()</code> een hele alinea voor nodig heeft. Deze staat
      ertussenin. Bedoeld als tegengewicht — één vorm in de goot links van een
      paneel en deze onder de rechterhoek zetten het blok op een diagonaal in
      plaats van op een versiering.`
  },
  /* -------------------------------------------------------------- 14 */
  {
    id: 'panelInset',
    name: 'Inzet',
    cat: 'panel',
    context: 'panelNarrow',
    aspect: 1.1,
    slot: 'inset: 1px 1px auto auto; height: calc(100% - 2px); aspect-ratio: 1.1;'
      + ' border-radius: 0 calc(var(--radius-panel) - 1px) calc(var(--radius-panel) - 1px) 0; overflow: hidden;',
    mockStyle: 'padding-right: 320px;',
    
    intent: 'Vult de rechterkant van een paneel, met een getekende binnenrand.',
    note: `De enige in de reeks die tekst zou kunnen dragen, en daarmee de
      riskantste: op de publieke site draagt geen enkele donkere vorm nog tekst.
      Drie randen gelast, de vierde is één zachte S die het paneel in bijt. Als
      dit ergens terugkomt, is het als het laatste woord van een lange pagina — één
      keer, en niets van dezelfde soort in de buurt. Eén ding werkt hier niet, en
      dat is het merk zelf: op de maat waarop hij hier staat draagt hij nauwelijks
      een knooppunt, om dezelfde reden als het zaad hieronder. Een vorm die tekst
      moet dragen, moet groot genoeg zijn om ook het veld te dragen. En kijk naar
      waar de haarlijnen ophouden: de binnenrand is een S, dus geen enkele
      uitlijning laat ze de vorm op meer dan één hoogte raken, en drie regels die
      in het wit eindigen zijn het eerste wat het oog vindt. Dat is geen fout van
      de mock maar een eigenschap van het voorstel: een getekende binnenrand en
      een lijstje met haarlijnen ernaast gaan niet samen.`
  },
  /* -------------------------------------------------------------- 15 */
  {
    id: 'seedFree',
    name: 'Zaad',
    cat: 'free',
    context: 'prose',
    aspect: 1.05,
    slot: 'inset: 13% auto auto 50%; width: 152px; aspect-ratio: 1.05;',
    mockStyle: 'padding-right: 56%;',
    intent: 'Vrij zwevend, met één zachte punt.',
    note: `Rond aan de ene kant, naar een punt getrokken aan de andere, en
      gekanteld. De twee kiezels op de staffingpagina zijn allebei rond; deze
      heeft een richting, en dat is wat hem laat werken naast een vorm die aan een
      rand hangt. Hij is ook groter getekend dan in de eerste opzet, al lost dat
      maar de helft op: het veld zet één knooppunt per 8700px² van het document,
      dus een vorm van deze maat draagt er twee of drie en leest van dichtbij als
      een vlak. Dat is geen fout van de tekening — de kiezels op de
      staffingpagina zijn 100px en doen precies hetzelfde — maar het is wel de
      reden dat een vrije vorm nooit alleen op een pagina kan staan: het netwerk
      dat de grote vormen draagt, draagt deze niet.`
  },
  /* -------------------------------------------------------------- 16 */
  {
    id: 'kidneyFree',
    name: 'Boon',
    cat: 'free',
    context: 'prose',
    aspect: 1,
    slot: 'inset: auto auto 12% 49%; width: 158px; aspect-ratio: 1;',
    mockStyle: 'padding-right: 56%;',
    intent: 'Vrij zwevend, met één holle flank.',
    note: `De enige vorm op de site met een echte holte in een vrij lichaam. Eén
      baai in de linkerflank, de rest bol. De holte moet duidelijk dieper zijn dan
      de rest van de rand ondiep is, anders leest hij als een deuk in een cirkel
      in plaats van als een getekende vorm.`
  },
  /* -------------------------------------------------------------- 17 */
  {
    id: 'driftFree',
    name: 'Drift',
    cat: 'free',
    context: 'prose',
    aspect: 2.56,
    slot: 'inset: auto auto 15% 46%; width: 230px; aspect-ratio: 2.56;',
    mockStyle: 'padding-right: 56%;',
    intent: 'Vrij zwevend, lang en laag.',
    note: `Lang, laag en met twee ongelijke uiteinden: stomp links, getrokken
      rechts. Ligt horizontaal, dus hij concurreert niet met een kolom tekst
      ernaast — waar een ronde vorm dat wel doet. Onder een kop of naast een
      onderschrift, nooit twee naast elkaar.`
  },
  /* -------------------------------------------------------------- 18 */
  {
    id: 'shardFree',
    name: 'Scherf',
    cat: 'free',
    context: 'prose',
    aspect: 1.36,
    slot: 'inset: 16% auto auto 48%; width: 186px; aspect-ratio: 1.36;',
    mockStyle: 'padding-right: 56%;',
    intent: 'Vrij zwevend, met één strakke flank.',
    note: `Eén bijna rechte bovenflank, de rest rond. Verwant aan de wand op de
      procespagina, de enige vorm op de site met een rechte lijn erin — maar hier
      is het geen lijn, het is een kromme met een grote straal. De twee raaklijnen
      aan de uiteinden van die flank staan een kleine 9° uit elkaar; een eerdere
      notitie beweerde 0,6°, wat over een flank van driekwart van de doos geen
      kromme meer zou zijn maar een lijn met twee knikken. Zijn rechterpunt is
      ook teruggehaald: hij stak 2% buiten zijn eigen doos, en wat buiten de doos
      valt wordt er recht afgesneden.`
  },
  /* -------------------------------------------------------------- 19 */
  {
    id: 'spindleFree',
    name: 'Spil',
    cat: 'free',
    context: 'prose',
    aspect: 0.45,
    slot: 'inset: 6% auto auto 52%; width: 92px; aspect-ratio: 0.45;',
    mockStyle: 'padding-right: 56%;',
    intent: 'Vrij zwevend, aan twee kanten gepunt, zonder holte.',
    note: `Aan beide uiteinden naar een punt getrokken, met de breedste doorsnede
      hoog op de ene flank en laag op de andere, zodat de as scheef staat. Bol
      over de hele omtrek, en <b>holte</b> onder de tekening zegt hoe bol: 0,0%,
      het enige silhouet in de reeks dat nergens onder zijn eigen omhullende
      duikt.
      Deze plaats is drie keer verkeerd ingevuld en dat is het opschrijven waard.
      Er stond eerst een kei — een bol lichaam met één lichting aan de onderkant.
      Die lichting verhuisde van de kruin naar de onderkant om hem van de bolster
      weg te halen, en kwam daarmee náást de baai van de boon terecht: gemeten
      als hoek vanuit het zwaartepunt lagen de twee holtes ongeveer 40° uit
      elkaar, dus de hertekening bracht hem dichter bij de vorm waar hij van weg
      moest. Drie vrije vormen met één holte zijn één bewerking, drie keer
      uitgevoerd. Wat ervoor in de plaats kwam was een staand blad met één punt
      — en dat is de vlam, zeventien voorstellen eerder in het contactvel, op 0,45 tegen
      0,47. Een vrije vorm en een gelaste vorm kunnen dezelfde tekening zijn: de
      las is geen bewerking op het silhouet, alleen een plaats om het op te
      hangen, en dat is precies wat de reeks elders van spiegelen zegt.
      Wat de familie miste is daarmee ook scherper: geen staande vorm, maar een
      vorm zonder holte. De vijf andere zijn alle vijf ingedeukt. Twee punten in
      plaats van één, en geen enkele holte, is een andere bewerking dan indeuken
      — en het contactvel is het gereedschap dat dat controleert, want alleen
      daar staan twintig silhouetten naast elkaar op hun eigen verhouding.`
  },
  /* -------------------------------------------------------------- 20 */
  {
    id: 'huskFree',
    name: 'Bolster',
    cat: 'free',
    context: 'prose',
    aspect: 1.1,
    slot: 'inset: auto auto 11% 49%; width: 164px; aspect-ratio: 1.1;',
    mockStyle: 'padding-right: 56%;',
    intent: 'Vrij zwevend, met één hap eruit.',
    note: `Een rond lichaam met één diepe hap uit de bovenkant, duidelijk links
      van het midden. De hap gaat tot voorbij het midden van het lichaam —
      ondieper is het een schulp, en een schulp is de vorm die de reeks juist
      probeert te vermijden. De verschuiving naar links is niet cosmetisch: in de
      vorige versie stond de hap 2% uit het midden, wat op de maat waarop hij hier
      staat een paar pixels is, en een hap midden in de kruin maakt van de vorm
      een mond. Hoort naast een vorm waar hij uit had kunnen komen, zoals de
      kiezels naast de boog.`
  }
];

/* ------------------------------------------------------------------ *
 * The rings
 *
 * One entry per shape. A `t` is the direction the outline travels through the
 * anchor; `tin`/`tout` together declare a corner, which only ever happens where
 * the shape meets the edge it is welded to; `line` marks the straight run along
 * that edge; `full` is how full the turn is, 1 being circular.
 * ------------------------------------------------------------------ */

const RINGS = {
  // 01 — enters the right edge at the top corner, one haul left, a round nose
  // that just touches the floor of its box, a long climb back to the edge.
  lobeFall: [
    { p: [1, 0], tin: [0, -1], tout: [-1, 0.10] },
    { p: [0.18, 0.52], t: [0, 1], full: 0.9 },
    { p: [0.42, 1], t: [1, 0] },
    { p: [1, 0.34], tin: [0.62, -0.78], tout: [0, -1], line: true }
  ],

  // 02 — stands on the bottom edge on a short foot and leans right. Both edges
  // leave the line near vertical, so it hangs off the rule rather than resting.
  flameFoot: [
    { p: [0.30, 1], tin: [-1, 0], tout: [-0.10, -1] },
    { p: [0.12, 0.60], t: [0.10, -1] },
    { p: [0.46, 0.07], t: [1, 0] },
    { p: [0.76, 0.52], t: [0, 1] },
    { p: [0.62, 1], tin: [-0.45, 1], tout: [-1, 0], line: true }
  ],

  // 03 — the full right edge plus the last third of the bottom one. Two lobes
  // and one pinch. The lower lobe stands on the bottom edge because reaching
  // left and hooking back to the corner left a droplet hanging there.
  baySpine: [
    { p: [1, 0], tin: [0, -1], tout: [-1, 0.55] },
    { p: [0.17, 0.40], t: [0, 1], full: 0.95 },
    { p: [0.58, 0.66], t: [0, 1], full: 0.8 },
    { p: [0.36, 0.88], t: [0.7, 1] },
    { p: [0.66, 1], tin: [1, 0.3], tout: [1, 0], line: true },
    { p: [1, 1], tin: [1, 0], tout: [0, -1], line: true }
  ],

  // 04 — off the left page edge at five eighths of its height, on the floor of
  // its box at a third, then long and shallow out to the right edge. It lands on
  // that edge rather than in the top-right corner: a corner reached at a shallow
  // angle leaves a splinter.
  drapeCove: [
    { p: [0, 0.54], tin: [0, 1], tout: [0.6, 1] },
    { p: [0.32, 1], t: [1, 0] },
    { p: [0.74, 0.44], t: [0.85, -1] },
    { p: [1, 0.22], tin: [0.6, -1], tout: [0, -1], line: true },
    { p: [1, 0], tin: [0, -1], tout: [-1, 0], line: true },
    { p: [0, 0], tin: [-1, 0], tout: [0, 1], line: true }
  ],

  // 05 — out of the left edge, one back and one tongue, no rhythm. The tip is
  // the tightest turn in the ring: a tongue ending in a lobe's radius is a lobe.
  tongueLeft: [
    { p: [0, 0.08], tin: [0, -1], tout: [1, 0.06] },
    { p: [0.44, 0.18], t: [1, 0.30] },
    { p: [0.94, 0.50], t: [0, 1], full: 0.55 },
    { p: [0.40, 0.82], t: [-1, 0.10] },
    { p: [0, 0.98], tin: [-1, 0.18], tout: [0, -1], line: true }
  ],

  // 06 — welded to two edges at once, and the free edge is an S: hard against
  // the right edge at the top, then well outside the chord between the two welds
  // through the middle. Struck as a shallow bow it is a black triangle.
  cornerSpur: [
    { p: [1, 0.02], tin: [0, -1], tout: [-0.22, 1] },
    { p: [0.90, 0.28], t: [-0.45, 1] },
    { p: [0.10, 0.56], t: [-1, 1.15] },
    { p: [0.04, 1], tin: [-0.45, 1], tout: [1, 0], line: true },
    { p: [1, 1], tin: [1, 0], tout: [0, -1], line: true }
  ],

  // 07 — full width on the bottom edge. A long shallow rise, a crest well right
  // of centre, and it lands on the right edge rather than pinching into the
  // corner. Centre the crest and it is a stripe again.
  tideBottom: [
    { p: [0, 1], tin: [-1, 0], tout: [0.9, -0.4] },
    { p: [0.34, 0.62], t: [1, -0.5] },
    { p: [0.72, 0.14], t: [1, 0] },
    { p: [1, 0.54], tin: [0.55, 1], tout: [0, 1], line: true },
    { p: [1, 1], tin: [0, 1], tout: [-1, 0], line: true }
  ],

  // 08 — welded to the top edge and the bottom edge, both flanks drawn, the left
  // swell high and the right one low. Nothing on the site hangs from two edges
  // facing each other.
  columnGutter: [
    { p: [0.16, 0], tin: [-1, 0], tout: [-0.2, 1] },
    { p: [0.02, 0.30], t: [0.15, 1] },
    { p: [0.30, 0.62], t: [-0.1, 1] },
    { p: [0.14, 1], tin: [-0.35, 1], tout: [1, 0], line: true },
    { p: [0.66, 1], tin: [1, 0], tout: [0.25, -1] },
    { p: [0.88, 0.62], t: [-0.15, -1] },
    { p: [0.56, 0.30], t: [0.2, -1] },
    { p: [0.68, 0], tin: [0.35, -1], tout: [-1, 0], line: true }
  ],

  // 09 — flat against a panel's foot, a short run-up and the weight at three
  // quarters, ending flat on the right edge at half depth. The mirror of the
  // dome under the training offer.
  panelSill: [
    { p: [0, 0], tin: [-1, 0], tout: [1, 1.15] },
    { p: [0.20, 0.42], t: [1, 0.45] },
    { p: [0.74, 1], t: [1, 0] },
    { p: [1, 0.52], tin: [0.55, -1], tout: [0, -1], line: true },
    { p: [1, 0], tin: [0, -1], tout: [-1, 0], line: true }
  ],

  // 10 — flat against a panel's flank over the full height, one swell below
  // centre. The panel keeps the straight side, the shape the drawn one.
  panelBracket: [
    { p: [1, 0], tin: [0, -1], tout: [-1, 0.2] },
    { p: [0.34, 0.26], t: [-0.3, 1] },
    { p: [0.10, 0.58], t: [0, 1] },
    { p: [0.46, 0.86], t: [1, 0.5] },
    { p: [1, 1], tin: [1, 0.35], tout: [0, -1], line: true }
  ],

  // 11 — flat against a panel's flank over part of its height, one swell high.
  // Its box starts clear of the panel's corner radius: a weld has to lie on a
  // straight run of edge, and a rounded corner is not one.
  panelKnop: [
    { p: [0, 0], tin: [0, -1], tout: [1, 0.28] },
    { p: [0.94, 0.34], t: [0.12, 1] },
    { p: [0.44, 0.76], t: [-0.8, 1] },
    { p: [0, 1], tin: [-1, 0.5], tout: [0, -1], line: true }
  ],

  // 12 — small, wider than tall, one crown left of centre, the long flank on the
  // right. Square it up and it is a browser tab.
  panelTab: [
    { p: [0.06, 1], tin: [-1, 0], tout: [-0.02, -1] },
    { p: [0.13, 0.42], t: [0.55, -1] },
    { p: [0.42, 0.06], t: [1, 0] },
    { p: [0.84, 0.48], t: [0.08, 1] },
    { p: [0.93, 1], tin: [0.06, 1], tout: [-1, 0], line: true }
  ],

  // 13 — welded to the right half of a panel's foot, hangs away left and runs
  // out to a long tip. The left flank is taut and nearly straight; the right one
  // is round. That, and not the direction it hangs, is what keeps it off the
  // flame.
  panelKeel: [
    { p: [0.46, 0], tin: [-1, 0], tout: [-0.22, 1] },
    { p: [0.32, 0.52], t: [-0.06, 1] },
    { p: [0.34, 0.94], t: [1, 0], full: 0.7 },
    { p: [0.86, 0.42], t: [0.4, -1] },
    { p: [1, 0], tin: [0.3, -1], tout: [-1, 0], line: true }
  ],

  // 14 — three edges welded, the fourth one soft S biting into the panel.
  panelInset: [
    { p: [0.38, 0], tin: [-1, 0], tout: [-0.15, 1] },
    { p: [0.20, 0.36], t: [0.2, 1] },
    { p: [0.42, 0.70], t: [-0.1, 1] },
    { p: [0.30, 1], tin: [-0.35, 1], tout: [1, 0], line: true },
    { p: [1, 1], tin: [1, 0], tout: [0, -1], line: true },
    { p: [1, 0], tin: [0, -1], tout: [-1, 0], line: true }
  ],

  // 15 — round at one end, drawn to a point at the other, tilted. The point is a
  // short handle, not a corner: it still has a tangent through it.
  seedFree: [
    { p: [0.06, 0.56], t: [0.1, -1] },
    { p: [0.40, 0.06], t: [1, -0.1] },
    { p: [0.97, 0.40], t: [0.15, 1], full: 0.24 },
    { p: [0.44, 0.94], t: [-1, 0] }
  ],

  // 16 — one bay in the left flank, the rest convex. The bay's inward peak sits
  // well right of the chord it is cut from, which is what keeps it a bay rather
  // than a dent.
  kidneyFree: [
    { p: [0.08, 0.30], t: [0, -1] },
    { p: [0.52, 0.06], t: [1, 0.05] },
    { p: [0.94, 0.44], t: [0.05, 1] },
    { p: [0.56, 0.96], t: [-1, 0] },
    { p: [0.16, 0.78], t: [0, -1] },
    { p: [0.34, 0.54], t: [0.05, -1], full: 0.7 }
  ],

  // 17 — long, low, two unequal ends: blunt left, drawn right.
  driftFree: [
    { p: [0.02, 0.44], t: [0.15, -1] },
    { p: [0.26, 0.06], t: [1, 0] },
    { p: [0.62, 0.26], t: [1, 0.55] },
    { p: [0.97, 0.62], t: [-0.35, 1], full: 0.30 },
    { p: [0.44, 0.92], t: [-1, 0] },
    { p: [0.14, 0.74], t: [-0.85, -1] }
  ],

  // 18 — one near-straight upper flank: the two tangents are a little under 9
  // degrees apart, so it is a curve with a very long radius rather than a line
  // with two knees. Both ends stay inside the unit box; the right one used to
  // overshoot it and was sheared flat by the element's own bounds.
  shardFree: [
    { p: [0.20, 0.07], t: [1, 0.14], full: 0.55 },
    { p: [0.86, 0.34], t: [1, 0.30] },
    { p: [0.96, 0.60], t: [-0.2, 1], full: 0.5 },
    { p: [0.46, 0.97], t: [-1, -0.1] },
    { p: [0.03, 0.48], t: [0, -1] }
  ],

  // 19 — a spindle: drawn to a point at both ends, with the widest section high
  // on one flank and low on the other so the axis skews. Convex the whole way
  // round, which is what `holte` under the drawing is there to show.
  spindleFree: [
    { p: [0.46, 0.04], t: [1, 0.3], full: 0.40 },
    { p: [0.92, 0.46], t: [-0.2, 1] },
    { p: [0.40, 0.96], t: [-1, -0.25], full: 0.34 },
    { p: [0.07, 0.50], t: [0.2, -1] }
  ],

  // 20 — a round body with one bite out of the top, taken past its own middle
  // and set left of centre: a bite in the middle of the crown is a mouth.
  huskFree: [
    { p: [0.04, 0.44], t: [0.25, -1] },
    { p: [0.22, 0.06], t: [1, 0], full: 0.55 },
    { p: [0.42, 0.58], t: [1, 0], full: 0.8 },
    { p: [0.66, 0.16], t: [1, 0.3], full: 0.7 },
    { p: [0.97, 0.52], t: [0, 1] },
    { p: [0.50, 0.97], t: [-1, 0] }
  ]
};

for (const shape of SHAPES) {
  const built = build(RINGS[shape.id]);
  shape.anchors = RINGS[shape.id];
  shape.d = built.d;
  shape.stats = built.stats;
}
