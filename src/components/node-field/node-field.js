// <sa-node-field> — the live cyan node network that fills every dark shape.
//
// The whole page shares one field in document coordinates: each element is a
// window onto it, so the network reads as continuous from the header wedge to
// the last dark shape on the page even though it is painted into separate
// canvases. The footer used to be the bottom of that run; it is paper now, and
// the wedge left in its corner is too small to carry a field — see
// `.footer-mark` in `main.css`.
// `variant="helix"` swaps the drifting network for the rotating double helix
// used in the Ons DNA disc.
//
// See .claude/skills/smartagents-design/README.md ("The dark field is the
// brand") and .claude/skills/webcomponent-mpa-spa/SKILL.md §4.

const CYAN = '0,216,255';
const FPS = 30;
const LINK_RADIUS = 128;
// One node per this many square px of document, so the field keeps the same
// weave whatever the page height. The floor keeps a short page from looking
// empty; the ceiling is what keeps the link pass affordable.
const NODE_AREA = 8700;
const NODE_MIN = 120;
const NODE_MAX = 2200;

const still = matchMedia('(prefers-reduced-motion: reduce)');

/* ------------------------------------------------------------------ *
 * The shared field
 * ------------------------------------------------------------------ */

const windows = new Set();
let nodes = [];
let fieldWidth = 0;
let fieldHeight = 0;
let timer = 0;

function makeNode() {
  return {
    x: Math.random() * fieldWidth,
    y: Math.random() * fieldHeight,
    vx: (Math.random() - 0.5) * 0.16,
    vy: (Math.random() - 0.5) * 0.16,
    r: 1.4 + Math.random() * 1.5
  };
}

function population() {
  return Math.max(
    NODE_MIN,
    Math.min(NODE_MAX, Math.round((fieldWidth * fieldHeight) / NODE_AREA))
  );
}

function seed() {
  nodes = Array.from({ length: population() }, makeNode);
}

/**
 * Match the population to a field that has changed size, without disturbing the
 * nodes already in it. Re-seeding is a whole new network, and a page's height is
 * not a constant: the AI staffing page's accordion moves it every frame for a
 * third of a second, and re-seeding on each of those frames was the network
 * flying apart and reassembling thirty times a second, everywhere on the page at
 * once. A taller document is the same field with more nodes in it.
 */
function refill() {
  const target = population();
  // Hysteresis, so a field that is growing is topped up two or three times on
  // the way rather than on every frame — a node appearing is invisible among a
  // thousand of them, a hundred appearing at once is not.
  if (Math.abs(target - nodes.length) < Math.max(24, Math.round(target * 0.05))) return;
  if (nodes.length > target) nodes.length = target;
  else while (nodes.length < target) nodes.push(makeNode());
}

/** True when the field's document box moved, so every window has to re-measure
    its slice of it — the shapes below a block that just grew have all shifted. */
function measureField() {
  const root = document.documentElement;
  const width = Math.max(root.scrollWidth, innerWidth);
  const height = Math.max(root.scrollHeight, innerHeight);
  if (Math.abs(width - fieldWidth) < 2 && Math.abs(height - fieldHeight) < 2) return false;
  fieldWidth = width;
  fieldHeight = height;
  if (nodes.length) refill();
  else seed();
  return true;
}

function drift() {
  for (const node of nodes) {
    node.x += node.vx;
    node.y += node.vy;
    if (node.x < -20) node.x = fieldWidth + 20;
    else if (node.x > fieldWidth + 20) node.x = -20;
    if (node.y < -20) node.y = fieldHeight + 20;
    else if (node.y > fieldHeight + 20) node.y = -20;
  }
}

function tick() {
  drift();
  // A window whose document position has shifted is looking at the wrong slice
  // until it is told: the field is anchored to the document, not to the shape.
  if (measureField()) for (const view of windows) view.measure();
  for (const view of windows) view.draw();
}

function startClock() {
  if (timer || still.matches || windows.size === 0) return;
  timer = setInterval(() => {
    if (document.hidden) return;
    tick();
  }, 1000 / FPS);
}

function stopClock() {
  clearInterval(timer);
  timer = 0;
}

/* ------------------------------------------------------------------ *
 * The element
 * ------------------------------------------------------------------ */

class NodeField extends HTMLElement {
  connectedCallback() {
    if (this.canvas) return;

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    this.context = this.canvas.getContext('2d');
    this.append(this.canvas);

    this.helix = this.getAttribute('variant') === 'helix';
    this.phase = 0;
    this.floats = [];
    this.visible = true;

    this.observer = new ResizeObserver(() => {
      this.measure();
      this.draw();
    });
    this.observer.observe(this);

    // A window that scrolled far out of sight costs nothing to skip.
    if ('IntersectionObserver' in window) {
      this.inView = new IntersectionObserver(
        ([entry]) => {
          this.visible = entry.isIntersecting;
        },
        { rootMargin: '250px' }
      );
      this.inView.observe(this);
    }

    windows.add(this);
    measureField();
    this.measure();
    this.draw();
    startClock();

    this.onMotionChange = () => {
      stopClock();
      startClock();
      this.draw();
    };
    still.addEventListener('change', this.onMotionChange);
  }

  disconnectedCallback() {
    windows.delete(this);
    this.observer?.disconnect();
    this.inView?.disconnect();
    still.removeEventListener('change', this.onMotionChange);
    if (windows.size === 0) stopClock();
  }

  measure() {
    const rect = this.getBoundingClientRect();
    // A clip path can scale the box; divide it back out so the shared field
    // stays in untransformed document coordinates.
    const scale = this.offsetWidth ? rect.width / this.offsetWidth : 1;
    this.w = this.offsetWidth;
    this.h = this.offsetHeight;
    this.ox = (rect.left + scrollX) / (scale || 1);
    this.oy = (rect.top + scrollY) / (scale || 1);

    const dpr = Math.min(devicePixelRatio || 1, 2);
    const width = Math.round(this.w * dpr);
    const height = Math.round(this.h * dpr);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      if (this.helix) this.seedFloats();
    }
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  draw() {
    if (!this.w || !this.h || !this.visible) return;
    this.context.clearRect(0, 0, this.w, this.h);
    if (this.helix) this.drawHelix();
    else this.drawNetwork();
  }

  /** The drifting network: this element's slice of the shared field. */
  drawNetwork() {
    const ctx = this.context;
    const x0 = this.ox - LINK_RADIUS;
    const x1 = this.ox + this.w + LINK_RADIUS;
    const y0 = this.oy - LINK_RADIUS;
    const y1 = this.oy + this.h + LINK_RADIUS;

    // Sorted by x so the link pass can stop at the first node too far right to
    // reach: without it the pass is quadratic in the window's node count, which
    // at this density is what would cost the frame.
    const local = nodes.filter((n) => n.x > x0 && n.x < x1 && n.y > y0 && n.y < y1);
    local.sort((a, b) => a.x - b.x);

    ctx.save();
    ctx.translate(-this.ox, -this.oy);
    ctx.lineWidth = 1;

    for (let i = 0; i < local.length; i++) {
      const a = local[i];
      for (let j = i + 1; j < local.length; j++) {
        const b = local[j];
        if (b.x - a.x > LINK_RADIUS) break;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > LINK_RADIUS) continue;
        ctx.strokeStyle = `rgba(${CYAN},${(0.22 * (1 - d / LINK_RADIUS)).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    ctx.fillStyle = `rgba(${CYAN},0.62)`;
    for (const node of local) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---------------------------------------------------------------- *
   * The helix variant
   * ---------------------------------------------------------------- */

  seedFloats() {
    this.floats = Array.from({ length: 6 }, () => ({
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: 1.1 + Math.random() * 1.4
    }));
  }

  strand(offset, k) {
    const N = 40;
    const points = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const envelope = 0.5 + 0.5 * Math.sin(Math.PI * t);
      const angle = t * Math.PI * 3.6 + this.phase + offset;
      const wobble = Math.sin(i * 2.3 + k * 5.1) * 2.6 + Math.sin(i * 0.7 + k * 1.9) * 3.4;
      points.push({
        x: this.w * (0.665 - 0.335 * t) + Math.sin(angle) * this.w * 0.175 * envelope + wobble * 0.5,
        y: 18 + t * (this.h - 36) + Math.sin(i * 1.7 + k * 3.3) * 2.2
      });
    }
    return points;
  }

  drawHelix() {
    const ctx = this.context;
    if (!this.floats.length) this.seedFloats();
    if (!still.matches) {
      this.phase += 0.016;
      for (const node of this.floats) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < -16) node.x = this.w + 16;
        else if (node.x > this.w + 16) node.x = -16;
        if (node.y < -16) node.y = this.h + 16;
        else if (node.y > this.h + 16) node.y = -16;
      }
    }

    const a = this.strand(0, 0);
    const b = this.strand(Math.PI, 1);

    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${CYAN},0.18)`;
    for (let i = 0; i < a.length; i += 8) {
      ctx.beginPath();
      ctx.moveTo(a[i].x, a[i].y);
      ctx.lineTo(b[i].x, b[i].y);
      ctx.stroke();
    }

    const rungs = [a, b].map((strand) => strand.filter((_, i) => !(i % 4)));
    ctx.strokeStyle = `rgba(${CYAN},0.28)`;
    ctx.lineWidth = 1.1;
    for (const strand of rungs) {
      ctx.beginPath();
      strand.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
    }

    const all = rungs[0].concat(rungs[1]);
    ctx.lineWidth = 1;
    for (const node of this.floats) {
      let nearest = null;
      let best = Infinity;
      for (const point of all) {
        const d = Math.hypot(point.x - node.x, point.y - node.y);
        if (d < best) {
          best = d;
          nearest = point;
        }
      }
      if (nearest && best < 132) {
        ctx.strokeStyle = `rgba(${CYAN},${(0.3 * (1 - best / 132)).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(nearest.x, nearest.y);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(${CYAN},0.55)`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = `rgba(${CYAN},0.62)`;
    for (const point of all) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

customElements.define('sa-node-field', NodeField);

// The field is anchored in document coordinates, so a reflow moves every window.
addEventListener(
  'resize',
  () => {
    measureField();
    for (const view of windows) {
      view.measure();
      view.draw();
    }
  },
  { passive: true }
);
