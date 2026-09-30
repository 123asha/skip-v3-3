import { useEffect, useId, useRef, useState } from 'react';
import { knock } from '../utils/knock';
import { sharedAudio } from '../sound/Sound';

/**
 * Draggable letter constellation — the SKP DSGN balls hanging on dotted
 * springs. Grab one and throw it: the springs pull and the balls knock against
 * each other and the walls (synthesised bamboo knock, no audio files).
 *
 * The graph is fixed: the prototype's clone-spawning is gone, because it cut
 * an edge to attach the new ball and the constellation fell apart into pieces.
 *
 * Ported from the standalone prototype; the physics constants are unchanged.
 * The coordinate space is the box the component is given, in CSS pixels, so a
 * ball keeps its size whatever proportions the layout hands over.
 */

// The physics runs in CSS pixels: the viewBox is set to the box the component
// is given, so a radius here is the radius on screen whatever the proportions.
// The balls size themselves to the field: ten of them have to sit in one line
// when they drop, so on a narrow screen they shrink rather than pile into each
// other. R_MAX is the size they reach on a wide screen.
const R_MAX = 86.5;
const R_MIN = 26;
const NS = 'http://www.w3.org/2000/svg';

// Physics — damped on purpose: the motion stays brisk, but the balls settle
// instead of bouncing and swinging for a second after every move.
const FRICTION = 0.88;
const BOUNCE_DAMPING = 0.1;
const BALL_BOUNCE = 0.25;
const SPRING_K = 0.006;
const STOP_THRESHOLD = 0.03;


const HIT_COOLDOWN = 90;
const GRAB_GRACE = 150;

// Ten balls — one per letter of SKIP DESIGN. Positions are fractions of the
// box, so the same constellation fits any proportions it is given.
// Deliberately shuffled — the constellation gives no hint of the word, the
// letters only line up once they drop. Balls slip past each other on the way
// down (see the settling check in resolveBallCollisions), so any starting
// order works.
const INITIAL_POSITIONS: Record<string, { x: number; y: number }> = {
  S1: { x: 0.62, y: 0.22 },
  K:  { x: 0.18, y: 0.74 },
  I1: { x: 0.85, y: 0.57 },
  P:  { x: 0.34, y: 0.15 },
  D:  { x: 0.71, y: 0.84 },
  E:  { x: 0.09, y: 0.33 },
  S2: { x: 0.47, y: 0.61 },
  I2: { x: 0.91, y: 0.20 },
  G:  { x: 0.26, y: 0.46 },
  N:  { x: 0.55, y: 0.88 },
};
const LETTER_OVERRIDE: Record<string, string> = { S1: 'S', S2: 'S', I1: 'I', I2: 'I' };
// One closed ring through all ten, so nothing ever hangs loose
const INITIAL_EDGES: [string, string][] = [
  ['S1', 'K'], ['K', 'I1'], ['I1', 'P'], ['P', 'D'], ['D', 'E'],
  ['E', 'S2'], ['S2', 'I2'], ['I2', 'G'], ['G', 'N'], ['N', 'S1'],
];

interface Node {
  id: string; letter: string;
  x: number; y: number; vx: number; vy: number;
  /** Column this ball drops into, so the row on the floor spells the word */
  slotX: number;
  /** Where the ball sits in the resting constellation — scrolling back to the
   *  top pulls it home, so the graph reassembles in the middle of the screen */
  homeX: number; homeY: number;
  dispVx: number; dispVy: number;
  /** Squeeze from a top/bottom press (flattens the ball into a wide, horizontal
   *  shape) and from a side press (flattens it into a tall, vertical shape).
   *  Both 0…1, decay each frame, topped up by contacts in resolveBallCollisions. */
  squeezeV: number; squeezeH: number;
  /** Roll of the sphere, radians about each screen axis — the letter rides
   *  round the surface as the ball moves, and rights itself at rest */
  rollX: number; rollY: number; lastX: number; lastY: number;
  letterEl: SVGTextElement;
  shadeEl: SVGRadialGradientElement;
  /** Circle + letter together — squash and stretch deform both as one */
  bodyEl: SVGGElement;
  r: number; fontSize: number;
  el: SVGGElement; circleEl: SVGCircleElement;
  /** Resting detection for the landed heap: where the ball has been sitting
   *  and for how many frames it has barely moved from there */
  anchorX: number; anchorY: number; restFrames: number;
}
interface Edge { a: string; b: string; restLength: number; el: SVGLineElement }

// How hard the balls fall once the page starts scrolling, px per frame².
// Strong on purpose: the first screen scrolls away fast, so the graph has to
// visibly drop within the first flick of the wheel.
const GRAVITY = 3.2;
// Pull back to the resting layout, applied as the page returns to the top
const HOME_K = 0.032;
// Sideways pull into the word while falling, so the balls land in reading order
const SETTLE_K = 0.07;
// Where each ball belongs in the line: S K I P  D E S I G N
const WORD_ORDER = ['S1', 'K', 'I1', 'P', 'D', 'E', 'S2', 'I2', 'G', 'N'];
// Which word each ball belongs to — the landed row gets a wider gap at the
// boundary between these two groups, so it reads as "SKIP" · "DESIGN" instead
// of one solid run of ten letters.
const WORD_GROUP: Record<string, number> = { S1: 0, K: 0, I1: 0, P: 0, D: 1, E: 1, S2: 1, I2: 1, G: 1, N: 1 };

export default function Constellation({
  sound = true, gravityOnScroll = false, intro = false, ballColor = '#ffffff', lineColor = '#ffffff', letterColor = 'var(--c-surface)', scrollSource,
}: {
  sound?: boolean;
  /** First mount only: the system assembles itself — balls pop in letter
   *  by letter, then the links close the ring */
  intro?: boolean;
  /** Scrolling the page pulls the vertices down until they rest on the floor */
  gravityOnScroll?: boolean;
  /** Ball fill, dashed link colour, and the knocked-out letter colour — the
   *  hero uses white balls on its own background; a decorative copy
   *  elsewhere (e.g. a grey wash behind a page's content) passes its own. */
  ballColor?: string;
  lineColor?: string;
  letterColor?: string;
  /** Where the fall/return scroll is read from. Omit for the page itself
   *  (window.scrollY); pass a getter for a page that scrolls its own
   *  container instead (e.g. the fixed-position sub-pages on this site). */
  scrollSource?: () => HTMLElement | null;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const edgesRef = useRef<SVGGElement>(null);
  const nodesRef = useRef<SVGGElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const introPlayed = useRef(false);
  const sphereId = 'sphere' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const sphereRef = useRef<SVGFilterElement>(null);
  // Size of the box we were handed, in CSS pixels — also the coordinate space
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // Ignore sub-pixel jitter: every change rebuilds the constellation
      setSize(prev => (Math.abs(prev.w - width) < 2 && Math.abs(prev.h - height) < 2
        ? prev
        : { w: Math.round(width), h: Math.round(height) }));
    });
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const svg = svgRef.current, edgesLayer = edgesRef.current, nodesLayer = nodesRef.current;
    if (!svg || !edgesLayer || !nodesLayer) return;
    const WIDTH = size.w, HEIGHT = size.h;
    if (WIDTH < 10 || HEIGHT < 10) return;

    // One fixed size throughout — resting up top or landed in a row, the
    // balls never change scale, only their layout does.
    // …but never so big that the landed row stops fitting between the side
    // margins: ten touching balls (20R) plus the word break (1.4R) and some
    // slack. Too big and the row jams, balls get squeezed out of line and
    // never come to rest.
    const SIDE_PAD = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad')) || 0;
    // Balls at ~1.5x the size that fits the full word on one row — they
    // land as a heap rather than a line
    // Phones (≤768px): 1.2× bigger — at the minimum radius they read as
    // dots on a narrow screen; any bigger and fewer than five fit on the
    // floor, so the heap jams against the walls and the balls squash together
    const BALL_SCALE = 1.125 * (WIDTH <= 768 ? 1.2 : 1); // -15% from 1.47, then -10% more
    const R = BALL_SCALE * Math.max(R_MIN, Math.min(R_MAX, (WIDTH / WORD_ORDER.length) * 0.484, (WIDTH - 2 * SIDE_PAD) / 21.84));
    // The sphere filter magnifies the middle of a ball by π/2, so the letter
    // is set smaller to keep its apparent size where the eye lands
    // The word doesn't fit on one row (phones, with the bigger balls): the
    // landed balls form a heap, so they must stay solid against each other
    // while falling — no slipping past one another to reach a slot
    const HEAP = WORD_ORDER.length * 2 * R > WIDTH - 2 * SIDE_PAD;
    const FONT = R * 1.4875; // -15% from the look-see size (was R * 1.17 * 0.72)

    // ── Letters printed on a sphere ───────────────────────────────────────────
    // A static displacement map for a ball of radius R: a point seen at
    // distance ρ from the centre shows the flat letter at arc length
    // asin(ρ)/(π/2) — middle swells, rim wraps away. Applied to each letter.
    {
      const f = sphereRef.current, feImg = f?.querySelector('feImage'), feMap = f?.querySelector('feDisplacementMap');
      if (f && feImg && feMap) {
        // One map pixel per device pixel of the ball (a fixed 128px map,
        // stretched over a big ball on a Retina screen, bent the letters'
        // edges into visible steps)
        const N = Math.min(1024, Math.max(128, Math.ceil(2 * R * (window.devicePixelRatio || 1))));
        const c = document.createElement('canvas'); c.width = N; c.height = N;
        const ctx = c.getContext('2d')!;
        const img = ctx.createImageData(N, N);
        const offs = new Float32Array(N * N * 2);
        let max = 0.001;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const u = (x + 0.5) / N * 2 - 1, v = (y + 0.5) / N * 2 - 1;
          const rho = Math.hypot(u, v);
          let k = 0;
          if (rho > 0 && rho < 1) k = (Math.asin(rho) / (Math.PI / 2)) / rho - 1;
          const j = (y * N + x) * 2;
          offs[j] = u * k * R; offs[j + 1] = v * k * R;
          max = Math.max(max, Math.abs(offs[j]), Math.abs(offs[j + 1]));
        }
        for (let n = 0; n < N * N; n++) {
          img.data[n * 4] = 128 + Math.round(offs[n * 2] / max * 127);
          img.data[n * 4 + 1] = 128 + Math.round(offs[n * 2 + 1] / max * 127);
          img.data[n * 4 + 2] = 128; img.data[n * 4 + 3] = 255;
        }
        ctx.putImageData(img, 0, 0);
        for (const el of [f, feImg]) {
          el.setAttribute('x', String(-R)); el.setAttribute('y', String(-R));
          el.setAttribute('width', String(2 * R)); el.setAttribute('height', String(2 * R));
        }
        feImg.setAttribute('href', c.toDataURL());
        feMap.setAttribute('scale', String(max * 255 / 127));
      }
    }

    const nodes: Record<string, Node> = {};
    const edges: Edge[] = [];
    let raf = 0;
    // Once every ball has settled (no drag, no residual velocity) the loop
    // stops entirely instead of continuing to recompute physics every frame —
    // otherwise sub-pixel drift and the squash/stretch smoothing never quite
    // reach zero, which reads as a constant faint jitter even though nothing
    // is actually being interacted with. wake() restarts it on the next real
    // input: a grab, a scroll, or a merge/respawn.
    let sleeping = false;
    const wake = () => {
      if (!sleeping) return;
      sleeping = false;
      lastStepAt = 0;
      raf = requestAnimationFrame(step);
    };

    // Scroll position drives the whole thing: away from the top the balls are
    // pulled down (full strength within a tenth of a screen, so the drop reads
    // while the hero is still visible), back at the top they are pulled home
    // and the constellation reassembles in the middle.
    let scrolled = 0;   // 0 at the top … 1 once scrolled away
    let homePull = 1;   // 1 at the very top … 0 as soon as the page moves
    let gravity = 0;
    // Phone: tilting the phone tilts the tray — the balls roll that way and
    // bounce off the edges, as if held on a racket; a flick throws them up.
    // Level again, they drift back home. (tiltX/Y in px/frame², 0 at rest)
    let tiltX = 0, tiltY = 0, tiltAmt = 0;
    let baseBeta: number | null = null;
    const TILT_G = GRAVITY * 2.2, TILT_DEAD = 2, TILT_FULL = 10; // degrees — a small tilt already rolls them
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      // Whatever angle the phone is first held at counts as level
      if (baseBeta === null) baseBeta = e.beta;
      const gx = e.gamma, gy = e.beta - baseBeta;
      const mag = Math.hypot(gx, gy);
      tiltAmt = Math.min(1, Math.max(0, (mag - TILT_DEAD) / (TILT_FULL - TILT_DEAD)));
      tiltX = Math.sin((Math.max(-60, Math.min(60, gx)) * Math.PI) / 180) * TILT_G * tiltAmt;
      tiltY = Math.sin((Math.max(-60, Math.min(60, gy)) * Math.PI) / 180) * TILT_G * tiltAmt;
      if (tiltAmt > 0) wake();
    };
    // A ball tossed towards the viewer is drawn over the others while it flies
    const toFront = (n: any) => { const el = n.el as Element | undefined; el?.parentNode?.appendChild(el); };
    // Some phones only report acceleration with gravity in it: take the
    // gravity out with a quick low-pass, so a swing still reads instantly
    let gAvg: { x: number; y: number; z: number } | null = null;
    const onMotion = (e: DeviceMotionEvent) => {
      let a: { x: number | null; y: number | null; z: number | null } | null = e.acceleration;
      if (!a || a.x == null || a.y == null) {
        const g = e.accelerationIncludingGravity;
        if (!g || g.x == null || g.y == null || g.z == null) return;
        gAvg = gAvg ? { x: gAvg.x * 0.9 + g.x * 0.1, y: gAvg.y * 0.9 + g.y * 0.1, z: gAvg.z * 0.9 + g.z * 0.1 } : { x: g.x, y: g.y, z: g.z };
        a = { x: g.x - gAvg.x, y: g.y - gAvg.y, z: g.z - gAvg.z };
      }
      // Swung sharply like a racket (up out of the screen): the balls fly up
      // at the viewer — big — and knock back down on it, each a bit differently
      const az = Math.abs(a.z ?? 0);
      if (az > 3) {
        Object.values(nodes).forEach((n: any) => {
          // One toss at a time — a ball already in the air isn't thrown again
          if (!n.hop && !n.hopV) { n.hopV = Math.min(0.3, 0.14 + az * 0.02) * (0.8 + Math.random() * 0.4); toFront(n); }
        });
        wake();
      }
      // A sharp move of the phone kicks the balls the other way (inertia)
      const jx = -(a.x ?? 0), jy = (a.y ?? 0);
      if (Math.hypot(jx, jy) < 6) return;
      Object.values(nodes).forEach(n => { n.vx += jx * 0.6; n.vy += jy * 0.6 - 4; });
      wake();
    };
    const tiltOn = window.matchMedia('(max-width: 768px)').matches && 'DeviceOrientationEvent' in window;
    // Once the phone's motion is on, the balls stay on the "racket": scrolling
    // no longer drops them, and a tap throws a ball up at the viewer
    let racket = false;
    const startTilt = () => {
      racket = true;
      scrolled = 0; homePull = 1; gravity = 0;
      window.addEventListener('deviceorientation', onOrient);
      window.addEventListener('devicemotion', onMotion);
    };
    let askTilt: (() => void) | null = null;
    if (tiltOn) {
      const DOE = (window as any).DeviceOrientationEvent;
      if (typeof DOE?.requestPermission === 'function') {
        // iOS: the sensors need the visitor's say-so, asked on a first tap
        askTilt = () => {
          document.removeEventListener('touchend', askTilt!);
          Promise.all([
            DOE.requestPermission(),
            (window as any).DeviceMotionEvent?.requestPermission?.() ?? 'granted',
          ]).then(([o]: string[]) => { if (o === 'granted') startTilt(); }).catch(() => {});
        };
        document.addEventListener('touchend', askTilt, { once: true });
      } else startTilt();
    }
    let wasHome = true; // starts at the top, where the page loads
    // When the drop began — balls may slip past each other only while it lasts
    let fallStart = 0;
    const CROSS_WINDOW = 700;   // ms
    // How long balls are steered toward their columns after the drop starts
    const SETTLE_WINDOW = 1100; // ms
    let lastScrollY = 0;
    let travelUp = 0, travelDown = 0;
    let returning = false;
    const readScroll = () => {
      // An inner page's own scroll isn't the hero's business
      if (coveredByPage()) return;
      wake();
      const el = scrollSource?.();
      const y = el ? el.scrollTop : (window.scrollY || document.documentElement.scrollTop || 0);
      // Full weight within a few per cent of a screen — a slow scroll used to
      // leave the balls hanging half-way while the two forces cancelled out.
      // Heading back up with the hero coming into view: go home right away,
      // so the graph rises as the page returns instead of waiting until the
      // very top and then scrambling to catch up. Heading down clears it.
      const dy = y - lastScrollY;
      lastScrollY = y;
      // Direction only counts once the page has really moved that way — a
      // trackpad settling the scroll nudges it a pixel up and down, and each
      // flip used to lift the landed balls and drop them again (a tremble)
      if (dy < 0) { travelUp -= dy; travelDown = 0; } else if (dy > 0) { travelDown += dy; travelUp = 0; }
      if (travelUp > 24 && y < window.innerHeight * 0.5) returning = true;   // hero more than half on screen
      else if (travelDown > 24) returning = false;
      if (y <= 0) returning = false;
      scrolled = racket || returning ? 0 : Math.min(1, y / (window.innerHeight * 0.03));
      homePull = racket || returning ? 1 : Math.max(0, 1 - y / (window.innerHeight * 0.02));
      const wasFalling = gravity > 0;
      gravity = scrolled * GRAVITY;
      // Any merged pair splits back apart the moment the graph starts moving
      // again — either falling on the way down, or landing back home on the
      // way up. The word only ever reads whole; merging is just a toy for the
      // moment the graph sits still. Ball size stays fixed throughout — only
      // the layout (slots) changes between the two states.
      if (gravity > 0 && !wasFalling) {
        fallStart = performance.now();
        WORD_ORDER.forEach(id => { slotJitter[id] = (Math.random() - 0.5) * R * 0.8; });
        respawnMerged();
        recomputeSlots();
      }
      const isHome = homePull >= 1;
      if (isHome && !wasHome) { respawnMerged(); randomizeHomeTargets(); }
      wasHome = isHome;
    };
    // Scroll listeners are wired up at the very end of setup (see below) —
    // readScroll reaches into recomputeSlots/wordOrder, both declared
    // further down, and calling it before they exist would throw.
    var detachScroll: (() => void) | undefined;

    function createNode(id: string, letter: string, x: number, y: number, vx = 0, vy = 0) {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'constellation-node');
      g.setAttribute('data-id', id);
      g.style.cursor = 'grab';

      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('cx', '0');
      circle.setAttribute('cy', '0');
      circle.setAttribute('r', String(R));
      // Barely-there shading, lit from above: its own gradient per ball,
      // counter-rotated each frame so the light stays overhead while the
      // circle turns with its squash
      const shade = document.createElementNS(NS, 'radialGradient');
      const shadeId = `${sphereId}-shade-${id}`;
      shade.setAttribute('id', shadeId);
      shade.setAttribute('gradientUnits', 'userSpaceOnUse');
      shade.setAttribute('cx', '0'); shade.setAttribute('cy', String(-R * 0.35));
      shade.setAttribute('r', String(R * 1.45));
      for (const [o, c] of [['0', ballColor], ['0.52', ballColor], ['1', `color-mix(in srgb, ${ballColor} 95%, #000)`]]) {
        const st = document.createElementNS(NS, 'stop');
        st.setAttribute('offset', o); st.setAttribute('stop-color', c);
        shade.appendChild(st);
      }
      svg!.querySelector(`#${shadeId}`)?.remove();   // a respawned ball replaces its old one
      svg!.querySelector('defs')!.appendChild(shade);
      circle.setAttribute('fill', `url(#${shadeId})`);

      const text = document.createElementNS(NS, 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', '0');
      text.setAttribute('dy', '0.35em');
      text.setAttribute('font-size', String(FONT));
      text.setAttribute('text-anchor', 'middle');
      // Knocked out of the ball in the page background colour
      text.setAttribute('fill', letterColor);
      text.style.fontFamily = 'var(--font)';
      text.style.fontWeight = '500';
      text.style.userSelect = 'none';
      text.style.pointerEvents = 'none';
      text.textContent = letter;

      // The sphere filter sits on a wrapper so its region stays on the ball
      // while the letter itself slides round underneath it
      const face = document.createElementNS(NS, 'g');
      face.setAttribute('filter', `url(#${sphereId})`);
      face.appendChild(text);
      const body = document.createElementNS(NS, 'g');
      body.append(circle, face);
      g.appendChild(body);
      nodesLayer!.appendChild(g);
      nodes[id] = { id, letter, x, y, vx, vy, slotX: x, homeX: x, homeY: y, dispVx: 0, dispVy: 0, squeezeV: 0, squeezeH: 0, rollX: 0, rollY: 0, lastX: x, lastY: y, letterEl: text, shadeEl: shade, bodyEl: body, r: R, fontSize: FONT, el: g, circleEl: circle, anchorX: x, anchorY: y, restFrames: 0 };
      return nodes[id];
    }

    function createEdge(aId: string, bId: string, restLength: number) {
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('stroke', lineColor);
      line.setAttribute('stroke-width', '2');
      line.setAttribute('stroke-linecap', 'round');
      // Short dashes rather than dots — just enough length to read as a stroke
      line.setAttribute('stroke-dasharray', '2 11');
      edgesLayer!.appendChild(line);
      const e: Edge = { a: aId, b: bId, restLength, el: line };
      edges.push(e);
      return e;
    }

    // Each mount (page load, or a resize rebuild) and every time the graph
    // returns home after scrolling away, every ball wobbles a little off its
    // usual spot — same rough shape, never quite the same constellation twice.
    const HOME_JITTER = 0.07;
    const jitteredFraction = (v: number) => Math.min(1, Math.max(0, v + (Math.random() - 0.5) * HOME_JITTER * 2));
    // The fall relies on each word's letters already sitting left-to-right in
    // the right order at "home" — the physics only has a short window to let
    // two balls slip past each other mid-fall, and jittering x freely can
    // reverse two letters (K landing right of I) more often than that window
    // can fix. So x is jittered per word-group, then handed back out in the
    // group's fixed order — same wobble, but S·K·I·P and D·E·S·I·G·N can never
    // start (or come home to) the wrong order relative to each other.
    const SKIP_IDS = WORD_ORDER.filter(id => WORD_GROUP[id] === 0);
    const DESIGN_IDS = WORD_ORDER.filter(id => WORD_GROUP[id] === 1);
    const orderedJitteredX = (ids: string[]) => {
      const xs = ids.map(id => jitteredFraction(INITIAL_POSITIONS[id].x)).sort((a, b) => a - b);
      const out: Record<string, number> = {};
      ids.forEach((id, i) => { out[id] = xs[i]; });
      return out;
    };

    const initialJitteredX = { ...orderedJitteredX(SKIP_IDS), ...orderedJitteredX(DESIGN_IDS) };
    Object.keys(INITIAL_POSITIONS).forEach(id => {
      const p = INITIAL_POSITIONS[id];
      // Fractions → pixels, kept a ball's width away from the walls
      const x = R + initialJitteredX[id] * (WIDTH - 2 * R);
      const y = R + jitteredFraction(p.y) * (HEIGHT - 2 * R);
      createNode(id, LETTER_OVERRIDE[id] || id, x, y);
    });

    // Re-rolls where "home" is for every ball still on the board — called each
    // time the graph settles back at the top, so it reassembles slightly
    // differently from before rather than snapping back to the exact same
    // resting shape every time.
    function randomizeHomeTargets() {
      const liveIds = new Set(Object.keys(nodes));
      const jitteredX = {
        ...orderedJitteredX(SKIP_IDS.filter(id => liveIds.has(id))),
        ...orderedJitteredX(DESIGN_IDS.filter(id => liveIds.has(id))),
      };
      Object.keys(INITIAL_POSITIONS).forEach(id => {
        const n = nodes[id];
        if (!n) return;
        const p = INITIAL_POSITIONS[id];
        n.homeX = R + jitteredX[id] * (WIDTH - 2 * R);
        n.homeY = R + jitteredFraction(p.y) * (HEIGHT - 2 * R);
      });
      separateHomes();
    }

    // Jitter can drop two homes on top of each other — then the home spring
    // and the collision fight forever and both balls sit squashed. Spread any
    // overlapping pair apart vertically only, so the left-to-right order of
    // the letters (which the fall depends on) is untouched.
    function separateHomes() {
      const list = Object.values(nodes);
      const MIN = 2 * R + 12;
      // No ball rests in the top band, where the menu line runs
      const TOP_CLEAR = 120;
      // A clear patch in the middle for the headline — a ball whose home
      // lands inside it is moved straight up or down to the nearer edge.
      // Matches the hero headline, a touch above centre (45%)
      const cx = WIDTH / 2, cy = HEIGHT * 0.45;
      const halfW = Math.min(WIDTH * 0.36, 430) + R, halfH = HEIGHT * 0.13 + R;
      const clearCenter = () => list.forEach(n => {
        if (Math.abs(n.homeX - cx) >= halfW || Math.abs(n.homeY - cy) >= halfH) return;
        n.homeY = n.homeY < cy ? cy - halfH : cy + halfH;
      });
      for (let iter = 0; iter < 40; iter++) {
        clearCenter();
        let moved = false;
        for (let a = 0; a < list.length; a++) {
          for (let b = a + 1; b < list.length; b++) {
            const i = list[a], j = list[b];
            const dx = j.homeX - i.homeX, dy = j.homeY - i.homeY;
            if (Math.abs(dx) >= MIN || Math.hypot(dx, dy) >= MIN) continue;
            const need = Math.sqrt(MIN * MIN - dx * dx) - Math.abs(dy);
            const dir = dy === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(dy);
            i.homeY -= dir * need / 2;
            j.homeY += dir * need / 2;
            moved = true;
          }
        }
        list.forEach(n => { n.homeY = Math.min(Math.max(n.homeY, TOP_CLEAR + R), HEIGHT - R); });
        if (!moved) break;
      }
      clearCenter();
      list.forEach(n => { n.homeY = Math.max(n.homeY, TOP_CLEAR + R); });
    }
    separateHomes();
    Object.values(nodes).forEach(n => { n.x = n.homeX; n.y = n.homeY; });

    // Rest lengths of the original ring, kept so the graph can be rebuilt
    // exactly after merges have rewired it
    const INITIAL_REST: Record<string, number> = {};
    INITIAL_EDGES.forEach(([a, b]) => {
      const rest = Math.hypot(nodes[b].x - nodes[a].x, nodes[b].y - nodes[a].y);
      INITIAL_REST[a + '|' + b] = rest;
      createEdge(a, b, rest);
    });

    // Landing slots — balls sit flush against their neighbours (no filler gap
    // between letters) and the whole row is centred in the field, rather than
    // stretched edge to edge. Kept as a mutable copy: merging two balls drops
    // one slot, and the remaining balls close ranks instead of leaving a gap.
    let wordOrder = [...WORD_ORDER];
    let slotGap = 0;
    // Extra room at the SKIP·DESIGN boundary, on top of the regular pitch —
    // proportional to the ball size so it still reads as a clear word break
    // whatever the field's width.
    const WORD_BREAK_GAP = R * 1.4;
    // Where each ball's column sits is nudged a little at random every fall,
    // so the heap lands differently each time
    const slotJitter: Record<string, number> = {};
    const recomputeSlots = () => {
      const n = Math.max(1, wordOrder.length);
      // How many consecutive pairs actually straddle the two words — normally
      // exactly one, but a merge can erase every ball on one side of it
      // (S · K · P are the protected floor, all in "SKIP"), in which case
      // there is no boundary left to widen.
      let breaks = 0;
      for (let i = 1; i < n; i++) {
        if (WORD_GROUP[wordOrder[i]] !== WORD_GROUP[wordOrder[i - 1]]) breaks++;
      }
      const numGaps = n - 1;
      // Same side margin as the header and text columns
      const PAD = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad')) || 0;
      const edgeL = PAD + R, edgeR = WIDTH - PAD - R;
      const maxSpan = edgeR - edgeL;
      // Letters touch inside each word. With both words present, SKIP is
      // pinned to the left edge and DESIGN to the right edge, and whatever
      // room is left becomes the space between them. Only on a field too
      // narrow for touching balls does the pitch compress.
      const innerGaps = numGaps - breaks;
      const minBreak = breaks ? WORD_BREAK_GAP : 0;
      const fits = innerGaps * 2 * R + minBreak <= maxSpan;
      slotGap = numGaps > 0 ? (fits ? 2 * R : Math.max(0, (maxSpan - minBreak) / Math.max(1, innerGaps))) : 0;
      if (breaks) {
        const left = wordOrder.filter(id => WORD_GROUP[id] === WORD_GROUP[wordOrder[0]]);
        const right = wordOrder.slice(left.length);
        left.forEach((id, i) => { if (nodes[id]) nodes[id].slotX = edgeL + i * slotGap; });
        right.forEach((id, i) => {
          if (nodes[id]) nodes[id].slotX = edgeR - (right.length - 1 - i) * slotGap;
        });
      } else {
        const rowSpan = numGaps * slotGap;
        const rowLeft = n > 1 ? edgeL + (maxSpan - rowSpan) / 2 : WIDTH / 2;
        wordOrder.forEach((id, i) => { if (nodes[id]) nodes[id].slotX = rowLeft + i * slotGap; });
      }
    };
    recomputeSlots();

    // ── Sound: dull bamboo knock, synthesised ────────────────────────────────
    let audioCtx: AudioContext | null = null;
    function ensureAudio() {
      if (!sound) return;
      // The site's one context (sound/Sound.ts), woken by any tap
      if (!audioCtx) audioCtx = sharedAudio();
      if (audioCtx && audioCtx.state !== 'running') audioCtx.resume().catch(() => {});
    }

    // The home page stays mounted under the inner pages (they open over it):
    // while one is open, the hero is out of sight — silent and unmoved
    // (read from the address: the home page is "/" or "/en", with the base)
    const coveredByPage = () => {
      const base = import.meta.env.BASE_URL.replace(/\/$/, '');
      const p = location.pathname.slice(location.pathname.startsWith(base) ? base.length : 0).replace(/^\/en(?=\/|$)/, '').replace(/\/$/, '');
      return p !== '';
    };
    function playKnock(strength: number) {
      if (coveredByPage()) return;
      if (!audioCtx && sound) audioCtx = sharedAudio();
      if (audioCtx && audioCtx.state === 'running') knock(audioCtx, strength);
    }

    // Under gravity a resting ball is re-pressed into the floor every frame and
    // bounces back just hard enough to clear the knock threshold — which made
    // the stack rattle forever while scrolling. Anything slower than the pull
    // itself counts as resting: no knock, and the bounce is dropped.
    const restSpeed = () => (gravity > 0 ? gravity * 2.5 : 0.6);
    // Only the jitter gravity itself causes is zeroed — a real shove from a
    // dragged neighbour is far faster than this and survives, so the landed
    // row still reacts to being pushed. Has to clear a full frame's worth of
    // gravity (not a fraction of it) — at gravity*0.5 a resting ball bounced
    // back up just past the bar every frame and never actually stopped,
    // reading as a permanent low rattle once the graph was scrolled down.
    const settleSpeed = () => (gravity > 0 ? GRAVITY * 1.2 : 0.6);

    // A knock is a contact EVENT: it sounds when two balls (or a ball and a
    // wall) first meet, and stays silent for as long as they rest against each
    // other. Otherwise a ball held against its neighbour rattles forever.
    const touchingPairs = new Set<string>();
    const touchingWall: Record<string, boolean> = {};
    const lastBallHit: Record<string, number> = {};
    const lastWallHit: Record<string, number> = {};
    const grabbedUntil: Record<string, number> = {};

    function triggerBallHit(key: string, speed: number, idA: string, idB: string) {
      if (speed < restSpeed()) return;
      const now = performance.now();
      if (grabbedUntil[idA] > now || grabbedUntil[idB] > now) return;
      if (lastBallHit[key] && now - lastBallHit[key] < HIT_COOLDOWN) return;
      lastBallHit[key] = now;
      playKnock(Math.min(speed / 18, 1));
    }

    function triggerWallHit(id: string, speed: number) {
      if (speed < restSpeed()) return;
      const now = performance.now();
      if (grabbedUntil[id] > now) return;
      if (lastWallHit[id] && now - lastWallHit[id] < HIT_COOLDOWN) return;
      lastWallHit[id] = now;
      playKnock(Math.min(speed / 18, 1));
    }

    function render() {
      const STRETCH_SMOOTHING = 0.15;
      Object.keys(nodes).forEach(id => {
        const n = nodes[id];
        // A hop towards the viewer (phone swung up and down) — a touch bigger
        const hop = (n as any).hop ?? 0;
        n.el.setAttribute('transform', hop > 0.001 ? `translate(${n.x},${n.y}) scale(${1 + hop * 0.25})` : `translate(${n.x},${n.y})`);

        n.dispVx += (n.vx - n.dispVx) * STRETCH_SMOOTHING;
        n.dispVy += (n.vy - n.dispVy) * STRETCH_SMOOTHING;

        // Squash and stretch along the direction of travel
        const speed = Math.hypot(n.dispVx, n.dispVy);
        const stretch = 1 + Math.min(speed / 86, 0.064);
        const squash = 1 / stretch;
        const angleDeg = speed > 0.05 ? Math.atan2(n.dispVy, n.dispVx) * 180 / Math.PI : 0;

        // A top/bottom press flattens the ball into a wide horizontal shape;
        // a side press flattens it into a tall vertical one — independent of
        // the ball's own travel direction, so a pinned ball being leaned on
        // still visibly gives.
        const sqV = Math.min(n.squeezeV, 0.4);
        const sqH = Math.min(n.squeezeH, 0.4);
        const squeezeScaleY = 1 - sqV * 0.224 + sqH * 0.224;
        const squeezeScaleX = 1 + sqV * 0.224 - sqH * 0.224;

        n.bodyEl.setAttribute('transform', `scale(${squeezeScaleX},${squeezeScaleY}) rotate(${angleDeg}) scale(${stretch},${squash}) rotate(${-angleDeg})`);

        // The sphere tips toward where it's going — the letter slides a little
        // round the surface with the motion, never past about a third of the
        // way to the rim, and settles straight back to the front once the
        // ball slows. Driven by the distance actually covered this frame.
        const TILT = 0.55;                 // max lean, radians
        const mx = (n.x - n.lastX) / n.r, my = (n.y - n.lastY) / n.r;
        n.lastX = n.x; n.lastY = n.y;
        // Lean tracks the current speed directly — no build-up, no lag
        const tx = Math.max(-TILT, Math.min(TILT, mx * 4));
        const ty = Math.max(-TILT, Math.min(TILT, my * 4));
        n.rollX += (tx - n.rollX) * 0.35; n.rollY += (ty - n.rollY) * 0.35;
        if (Math.abs(n.rollX) < 0.002) n.rollX = 0;
        if (Math.abs(n.rollY) < 0.002) n.rollY = 0;
        // Flat offset in the filter's arc-length space: a quarter turn = R
        n.letterEl.setAttribute('transform', `translate(${n.rollX / (Math.PI / 2) * n.r},${n.rollY / (Math.PI / 2) * n.r})`);
      });
      edges.forEach(e => {
        const a = nodes[e.a], b = nodes[e.b];
        e.el.setAttribute('x1', String(a.x));
        e.el.setAttribute('y1', String(a.y));
        e.el.setAttribute('x2', String(b.x));
        e.el.setAttribute('y2', String(b.y));
      });
    }

    // ── Drag with inertia ────────────────────────────────────────────────────
    let dragId: string | null = null;
    let lastPoint: DOMPoint | null = null;
    let lastTime = 0;

    const getSVGPoint = (evt: PointerEvent) => {
      const pt = svg.createSVGPoint();
      pt.x = evt.clientX;
      pt.y = evt.clientY;
      return pt.matrixTransform(svg.getScreenCTM()!.inverse());
    };

    // Touch: a ball is caught only by a long press, so a swipe across the
    // balls still scrolls the page. Until then nothing is held.
    const TOUCH = window.matchMedia('(pointer: coarse)').matches;
    const HOLD_MS = 380, HOLD_SLOP = 8;
    let hold: { timer: number; x: number; y: number } | null = null;
    const cancelHold = () => { if (hold) { clearTimeout(hold.timer); hold = null; } };

    const onPointerDown = (evt: PointerEvent) => {
      ensureAudio();
      const g = (evt.target as Element).closest('.constellation-node');
      if (!g) return;
      if (TOUCH && evt.pointerType !== 'mouse') {
        cancelHold();
        const x0 = evt.clientX, y0 = evt.clientY, pid = evt.pointerId;
        hold = {
          x: x0, y: y0,
          timer: window.setTimeout(() => {
            hold = null;
            const id = g.getAttribute('data-id')!;
            if (!nodes[id]) return;
            dragId = id;
            wake();
            lastPoint = getSVGPoint({ clientX: x0, clientY: y0 } as PointerEvent);
            lastTime = performance.now();
            grabbedUntil[id] = lastTime + GRAB_GRACE;
            nodes[id].vx = 0; nodes[id].vy = 0;
            try { (g as SVGGElement).setPointerCapture(pid); } catch { /* window listeners carry it */ }
            playKnock(0.4);
          }, HOLD_MS),
        };
        return;
      }
      // The hero behind this reacts to clicks — a grab is not one. preventDefault
      // also stops the browser starting its own text/image drag.
      evt.stopPropagation();
      evt.preventDefault();
      const id = g.getAttribute('data-id')!;
      dragId = id;
      wake();
      lastPoint = getSVGPoint(evt);
      lastTime = performance.now();
      grabbedUntil[id] = lastTime + GRAB_GRACE;
      nodes[id].vx = 0;
      nodes[id].vy = 0;
      // Nice-to-have, not load-bearing: WebKit can throw on capture for SVG
      // elements, and the move/up listeners live on the window anyway.
      try { (g as SVGGElement).setPointerCapture(evt.pointerId); } catch { /* no capture, window listeners carry the drag */ }
      playKnock(0.4);
    };

    const onPointerMove = (evt: PointerEvent) => {
      // A finger that moves before the hold completes is scrolling — let it
      if (hold && Math.hypot(evt.clientX - hold.x, evt.clientY - hold.y) > HOLD_SLOP) cancelHold();
      if (!dragId) return;
      const n = nodes[dragId];
      if (!n || !lastPoint) return;
      // Keep the page from selecting text or scrolling under the drag
      if (evt.cancelable) evt.preventDefault();
      const p = getSVGPoint(evt);
      const now = performance.now();
      const dt = Math.max(now - lastTime, 1);

      const dx = p.x - lastPoint.x;
      const dy = p.y - lastPoint.y;

      n.x = Math.min(Math.max(n.x + dx, n.r), WIDTH - n.r);
      n.y = Math.min(Math.max(n.y + dy, n.r), HEIGHT - n.r);

      n.vx = (dx / dt) * 13.28;
      n.vy = (dy / dt) * 13.28;

      lastPoint = p;
      lastTime = now;

      checkMerge(dragId);
    };

    // Letting go of a ball in the landed heap replays the settle that ran
    // when it fell: columns pull again and balls may slip past each other,
    // so the word sorts itself back into the heap it landed as
    const endDrag = () => {
      cancelHold();
      if (dragId !== null && gravity > 0) { fallStart = performance.now(); wake(); }
      dragId = null;
    };

    // ── Merging balls ────────────────────────────────────────────────────────
    // Drag any ball onto any other, close enough, and they become one: edges
    // redirect to the survivor, the dragged one is removed, and the falling
    // row closes the gap instead of leaving an empty slot. Stops once only
    // MIN_NODES are left — "SKP" is the floor, three letters minimum on screen.
    const MERGE_FACTOR = 0.55; // how deep the overlap must get, vs combined radii
    const MIN_NODES = 3;
    // These three never get swallowed — whichever way a merge is dragged, one
    // of them survives it. Absorb everything else and exactly S · K · P are
    // left standing.
    const PROTECTED_IDS = new Set(['S1', 'K', 'P']);

    // Merging is a toy for the resting graph, not a real change to the word:
    // every ball a merge swallows is logged here and comes back the instant
    // the page starts falling, so the floor always spells the whole thing.
    const mergedLog: { removedId: string; keepId: string; letter: string }[] = [];

    // Plays the merge as a quiet, quick fade: the absorbed ball simply shrinks
    // and slides into the survivor. No swelling on the survivor's side — a
    // ball disappearing into its neighbour reads as the merge on its own.
    // Runs on its own rAF loop, independent of the physics — by the time this
    // starts, `removed` is already out of `nodes` and the simulation has
    // forgotten it.
    // A gooey blend filter, cell-merge style: blur two shapes together then
    // sharpen the alpha back to a hard edge, so overlapping circles fuse into
    // one blob instead of just crossfading. Built once, reused by every merge.
    let gooId: string | null = null;
    function ensureGooFilter(): string {
      if (gooId) return gooId;
      gooId = `${sphereId}-goo`;
      const filter = document.createElementNS(NS, 'filter');
      filter.setAttribute('id', gooId);
      filter.setAttribute('x', '-60%'); filter.setAttribute('y', '-60%');
      filter.setAttribute('width', '220%'); filter.setAttribute('height', '220%');
      const blur = document.createElementNS(NS, 'feGaussianBlur');
      blur.setAttribute('in', 'SourceGraphic'); blur.setAttribute('stdDeviation', '7'); blur.setAttribute('result', 'b');
      const cm = document.createElementNS(NS, 'feColorMatrix');
      cm.setAttribute('in', 'b'); cm.setAttribute('mode', 'matrix');
      cm.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10');
      filter.append(blur, cm);
      svg!.querySelector('defs')!.appendChild(filter);
      return gooId;
    }

    function animateAbsorb(removed: Node, keep: Node) {
      // Two cells fusing: while the real (lettered) circles hide, a pair of
      // plain ghost circles blend under the goo filter and melt into one
      // shape as the swallowed one is pulled in and shrinks. The survivor's
      // crisp circle fades back in once they've become a single blob. Its
      // letter goes first so two letters never overlap; the survivor itself
      // stretches briefly toward it (the render's own squash & stretch).
      const DUR = 320;
      const start = performance.now();
      const fromX = removed.x, fromY = removed.y;
      const removedText = removed.el.querySelector('text') as SVGTextElement | null;
      keep.el.parentNode?.insertBefore(removed.el, keep.el);
      const dx = fromX - keep.x, dy = fromY - keep.y, d = Math.hypot(dx, dy) || 1;
      keep.dispVx += (dx / d) * 5;
      keep.dispVy += (dy / d) * 5;

      const blob = document.createElementNS(NS, 'g');
      blob.setAttribute('filter', `url(#${ensureGooFilter()})`);
      const gRemoved = document.createElementNS(NS, 'circle');
      gRemoved.setAttribute('fill', ballColor);
      const gKeep = document.createElementNS(NS, 'circle');
      gKeep.setAttribute('fill', ballColor);
      gKeep.setAttribute('r', String(keep.r));
      blob.append(gRemoved, gKeep);
      nodesLayer!.insertBefore(blob, nodesLayer!.firstChild);
      keep.circleEl.style.opacity = '0';
      removed.circleEl.style.opacity = '0';

      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DUR);
        const pull = t * t * t;                    // ease-in — gets sucked in
        const x = fromX + (keep.x - fromX) * pull;
        const y = fromY + (keep.y - fromY) * pull;
        const sc = 1 - t * t;                       // shrinks, faster at the end
        removed.el.setAttribute('transform', `translate(${x},${y}) scale(${sc})`);
        gRemoved.setAttribute('cx', String(x));
        gRemoved.setAttribute('cy', String(y));
        gRemoved.setAttribute('r', String(removed.r * sc));
        gKeep.setAttribute('cx', String(keep.x));
        gKeep.setAttribute('cy', String(keep.y));
        if (removedText) removedText.style.opacity = String(Math.max(0, 1 - t * 3));
        if (t < 1) requestAnimationFrame(tick);
        else {
          removed.el.remove();
          blob.remove();
          keep.circleEl.style.opacity = '';
        }
      };
      requestAnimationFrame(tick);
    }

    function mergeInto(keepId: string, removeId: string) {
      if (keepId === removeId || !nodes[keepId] || !nodes[removeId]) return;
      if (Object.keys(nodes).length <= MIN_NODES) return;
      // A protected ball is never the one that disappears — flip which side
      // survives if it would be. Two protected balls never merge with each
      // other, or S · K · P couldn't all still be standing at the end.
      if (PROTECTED_IDS.has(removeId)) {
        if (PROTECTED_IDS.has(keepId)) return;
        [keepId, removeId] = [removeId, keepId];
      }
      const removed = nodes[removeId];

      edges.forEach(e => {
        if (e.a === removeId) e.a = keepId;
        if (e.b === removeId) e.b = keepId;
      });
      // Drop self-loops and duplicate edges the redirect just created
      const seen = new Set<string>();
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        const key = [e.a, e.b].sort().join('|');
        if (e.a === e.b || seen.has(key)) { e.el.remove(); edges.splice(i, 1); }
        else seen.add(key);
      }

      // Physics forgets about it immediately; the DOM element lingers a
      // moment longer to play the absorb animation below.
      delete nodes[removeId];
      delete grabbedUntil[removeId];
      touchingWall[removeId] && delete touchingWall[removeId];
      animateAbsorb(removed, nodes[keepId]);

      mergedLog.push({ removedId: removeId, keepId, letter: removed.letter });

      const idx = wordOrder.indexOf(removeId);
      if (idx !== -1) wordOrder.splice(idx, 1);
      recomputeSlots();

      playKnock(0.7);
    }

    function respawnMerged() {
      if (!mergedLog.length) return;
      // Newest merge first: in a chain (I2 → I1, then I1 → K) I1 has to be
      // back before I2 can pop out of it, or I2 is lost for good.
      [...mergedLog].reverse().forEach(({ removedId, keepId, letter }) => {
        const keep = nodes[keepId];
        if (!keep) return;
        // Pop back out right next to the ball that swallowed it, with a small
        // kick so the two don't just sit stacked on top of each other
        const angle = Math.random() * Math.PI * 2;
        const kick = 6;
        createNode(
          removedId, letter,
          keep.x + Math.cos(angle) * keep.r * 0.4,
          keep.y + Math.sin(angle) * keep.r * 0.4,
          Math.cos(angle) * kick, Math.sin(angle) * kick,
        );
      });
      mergedLog.length = 0;
      rebuildEdges();
      // Whatever order they came back in, the row must read left to right
      // exactly as the word does
      wordOrder = WORD_ORDER.filter(id => nodes[id]);
      recomputeSlots();
    }

    // A merge hands the swallowed ball's links to the survivor; left like
    // that, the survivor is tied by foreign springs across the field and
    // keeps getting tugged out of its slot. Restore the original ring,
    // minus whichever balls are currently gone.
    function rebuildEdges() {
      edges.forEach(e => e.el.remove());
      edges.length = 0;
      INITIAL_EDGES.forEach(([a, b]) => {
        if (nodes[a] && nodes[b]) createEdge(a, b, INITIAL_REST[a + '|' + b]);
      });
    }

    function checkMerge(id: string) {
      // Merging is only a toy for the resting constellation up top — once the
      // page has pulled the graph down into its row, the balls behave exactly
      // like before: they push each other apart, never absorb one another.
      if (gravity > 0) return;
      const n = nodes[id];
      if (!n) return;
      if (Object.keys(nodes).length <= MIN_NODES) return;
      for (const otherId of Object.keys(nodes)) {
        if (otherId === id) continue;
        const other = nodes[otherId];
        const dist = Math.hypot(other.x - n.x, other.y - n.y);
        if (dist < (n.r + other.r) * MERGE_FACTOR) {
          mergeInto(otherId, id);
          dragId = null; // the dragged ball no longer exists
          return;
        }
      }
    }

    // Grab starts on a ball, but the rest of the drag is tracked on the window:
    // the cursor routinely leaves the ball mid-throw, and pointer capture is
    // not reliable on SVG elements across engines.
    nodesLayer.addEventListener('pointerdown', onPointerDown);
    // Touch on a ball: keep the page from scrolling so the ball can be dragged
    // Touch: the page scrolls freely; only a caught ball (long press) stops it
    const onBallTouch = (e: TouchEvent) => { if (!TOUCH && e.cancelable) e.preventDefault(); };
    const onTouchMove = (e: TouchEvent) => { if (dragId !== null && e.cancelable) e.preventDefault(); };
    nodesLayer.addEventListener('touchstart', onBallTouch, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    // Browsers only let audio play after a real user gesture (a click, tap or
    // key press — a scroll or wheel event never counts). Without grabbing a
    // ball first there was never such a gesture, so the falling/landing
    // knocks stayed silent. Unlock on the page's very first gesture of any
    // kind, so sound is armed by the time the balls actually land.
    const onFirstGesture = () => ensureAudio();
    window.addEventListener('pointerdown', onFirstGesture, { once: true, capture: true });
    window.addEventListener('keydown', onFirstGesture, { once: true, capture: true });

    function applySprings() {
      // Once the heap has landed the threads are only drawn, not pulled — a
      // ball moved to a new spot stays there instead of being reeled back
      if (gravity > 0 && performance.now() - fallStart > SETTLE_WINDOW) return;
      edges.forEach(e => {
        const a = nodes[e.a], b = nodes[e.b];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.001) dist = 0.001;

        const nx = dx / dist, ny = dy / dist;
        // The dotted links behave like threads: they pull when stretched and go
        // slack when the balls come closer. A pushing spring could prop a ball
        // up on its neighbours and leave it hanging in mid-air instead of
        // dropping — which is exactly what P and I were doing.
        const stretch = dist - e.restLength;
        if (stretch <= 0) return;
        const forceMag = stretch * SPRING_K;

        if (e.a !== dragId) { a.vx += nx * forceMag; a.vy += ny * forceMag; }
        if (e.b !== dragId) { b.vx -= nx * forceMag; b.vy -= ny * forceMag; }
      });
    }

    function resolveBallCollisions() {
      const idsNow = Object.keys(nodes);
      for (let a = 0; a < idsNow.length; a++) {
        for (let b = a + 1; b < idsNow.length; b++) {
          const i = nodes[idsNow[a]], j = nodes[idsNow[b]];
          const dx = j.x - i.x, dy = j.y - i.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = i.r + j.r;
          const pairKey = idsNow[a] + '-' + idsNow[b];
          if (dist === 0) dist = 0.01;
          if (dist >= minDist) {
            // A little hysteresis, so resting neighbours don't chatter in and
            // out of contact and re-trigger the knock
            if (dist > minDist + 4) touchingPairs.delete(pairKey);
            continue;
          }

          // Only while the drop is actually happening may a ball slip past its
          // neighbours — that is how letters starting on the wrong side swap
          // places. The window closes right after, so the landed row is solid
          // and the balls push each other apart instead of overlapping.
          const crossing = gravity > 0
            && performance.now() - fallStart < CROSS_WINDOW
            && (Math.abs(i.slotX - i.x) > 8 || Math.abs(j.slotX - j.x) > 8);
          // Two letters standing in the wrong order (swapped by a drag) pass
          // through each other so each can get back to its own slot; otherwise
          // they wedge against each other forever, both squashed. The ball
          // being dragged still collides, so pushing it into the row works.
          // Only once the drag is over — while pushing, every ball must stay
          // solid or the row collapses through itself against the wall.
          // Time-boxed the same way as `crossing`: without a limit, a pair
          // whose spring force is too weak to actually swap them back could
          // phase through each other forever, leaving one parked overlapping
          // (visually perched above) the other with collision never
          // re-engaging to push them apart.
          const swapped = gravity > 0 && dragId === null
            && performance.now() - fallStart < CROSS_WINDOW * 3
            && (i.slotX - j.slotX) * (i.x - j.x) < 0;
          if (!HEAP && (crossing || swapped)) continue;

          // Pushes go along the true line between the two centres — a ball
          // resting on another rolls off into the valley instead of being
          // propped up on its crown, which real balls can't do.
          const rawNx = dx / dist, rawNy = dy / dist;
          let nx = rawNx, ny = rawNy;
          // Two balls wedged side by side at the same height (both on the
          // floor, say) only ever get pushed sideways, so a row too wide for
          // the field would just stay squashed into itself. Once they're
          // pressed well together, one climbs onto the other instead: the one
          // already a touch higher, or failing that the one further from its
          // column. That's how the landed heap gets its second layer.
          if (gravity > 0 && Math.abs(rawNy) < 0.35 && minDist - dist > minDist * 0.08) {
            const jRises = Math.abs(dy) > 1 ? dy < 0 : Math.abs(j.slotX - j.x) > Math.abs(i.slotX - i.x);
            ny = jRises ? -0.7 : 0.7;
            nx = rawNx * 0.7;
            const l = Math.hypot(nx, ny); nx /= l; ny /= l;
          }

          const overlap = minDist - dist;
          const iDragged = idsNow[a] === dragId;
          const jDragged = idsNow[b] === dragId;

          // A ball shoved by the dragged one and pinned against a wall can't
          // go sideways any more — it gets squeezed up out of the row instead
          // of being pushed through the wall (or through its neighbours).
          const shove = (n: Node, sx: number, sy: number) => {
            const nx2 = n.x + sx;
            const clamped = Math.min(Math.max(nx2, n.r), WIDTH - n.r);
            n.x = clamped;
            n.y += sy - Math.abs(nx2 - clamped);
          };
          if (iDragged && !jDragged) {
            shove(j, rawNx * overlap, rawNy * overlap);
          } else if (jDragged && !iDragged) {
            shove(i, -rawNx * overlap, -rawNy * overlap);
          } else {
            i.x -= rawNx * overlap * 0.5; i.y -= rawNy * overlap * 0.5;
            j.x += rawNx * overlap * 0.5; j.y += rawNy * overlap * 0.5;
          }

          // Feed the true contact geometry into the squeeze read above: a
          // mostly-vertical contact normal (rawNy dominant) is a top/bottom
          // press, a mostly-horizontal one (rawNx dominant) is a side press.
          // Gated to an actual push — a dragged ball, or real closing speed —
          // so balls merely resting against each other in the landed row (zero
          // relative velocity, but still geometrically touching every frame)
          // don't flicker in and out of a "squeeze" that was never applied.
          // Only a deliberate push by the dragged ball squashes — resting
          // contacts (at home or in the row) always stay perfectly round.
          const isPress = iDragged || jDragged;
          const squeezeAdd = isPress ? Math.min(0.5, (overlap / minDist) * 2.2) : 0;
          if (squeezeAdd > 0) {
            const vFrac = rawNy * rawNy, hFrac = rawNx * rawNx;
            i.squeezeV = Math.min(1, i.squeezeV + squeezeAdd * vFrac);
            i.squeezeH = Math.min(1, i.squeezeH + squeezeAdd * hFrac);
            j.squeezeV = Math.min(1, j.squeezeV + squeezeAdd * vFrac);
            j.squeezeH = Math.min(1, j.squeezeH + squeezeAdd * hFrac);
          }

          const relDot = (j.vx - i.vx) * nx + (j.vy - i.vy) * ny;
          if (relDot < 0) {
            // A bounce this gentle never had anywhere to go: two neighbours
            // pressed together by gravity/settle drift kept re-triggering it
            // on each other every frame, which read as a permanent rattle —
            // most visible at the ends of the row, with only one neighbour to
            // brace against. Below the settle bar the closing motion is just
            // cancelled, no reflection.
            const gentle = Math.abs(relDot) < settleSpeed();
            // Each ball takes half: together that cancels the closing speed
            // exactly. (A full share each reflected it — an elastic bounce on
            // every resting contact, so a landed heap never stopped shivering.)
            const impulse = relDot * (gentle ? 0.5 : BALL_BOUNCE);
            if (!iDragged) { i.vx += impulse * nx; i.vy += impulse * ny; }
            if (!jDragged) { j.vx -= impulse * nx; j.vy -= impulse * ny; }
            if (!gentle) {
              const key = idsNow[a] + '-' + idsNow[b];
              if (!touchingPairs.has(key)) triggerBallHit(key, Math.abs(relDot), idsNow[a], idsNow[b]);
            }
          }
          touchingPairs.add(pairKey);
        }
      }
    }

    function simulate() {
      applySprings();

      // Squeeze fades on its own once nothing presses anymore; contacts top
      // it back up each frame in resolveBallCollisions below.
      Object.values(nodes).forEach(n => { n.squeezeV *= 0.75; n.squeezeH *= 0.75; });

      Object.keys(nodes).forEach(id => {
        if (id === dragId) return;
        const n = nodes[id];

        if (gravity) {
          n.vy += gravity;
          // Slide into this ball's column on the way down. Close enough is
          // close enough — otherwise the row keeps pressing itself together.
          // Once inside that dead zone, the pull is cut off outright instead
          // of fading through friction — a ball sitting right at the edge of
          // the zone (the end of the row, with only one neighbour to brace
          // against, in practice) otherwise never quite lands on an exact
          // zero: the nudge keeps topping the velocity back up just as
          // friction decays it, so the whole ball never fully sleeps and the
          // squash/stretch reads as a permanent faint shimmer.
          // Only while the drop is under way: after that the heap settles by
          // plain physics, so a ball resting on others rolls into the valley
          // between them rather than being held up on a slope by its column.
          const dxSlot = n.slotX + (slotJitter[id] ?? 0) - n.x;
          if (performance.now() - fallStart < SETTLE_WINDOW) {
            if (Math.abs(dxSlot) > 2) n.vx += dxSlot * SETTLE_K * scrolled;
            else if (Math.abs(n.vx) < settleSpeed()) n.vx = 0;
          }
        }
        // Phone tilt: roll with it; the pull home lets go while tilted
        if (tiltAmt > 0 && !gravity) { n.vx += tiltX; n.vy += tiltY; }
        const pull = homePull * (1 - tiltAmt);
        if (pull > 0) {
          // Spring home — takes over as gravity fades on the way back up.
          // Extra damping keeps it near-critical: the balls glide in and
          // settle instead of overshooting and swinging round their spot.
          const k = HOME_K * pull;
          n.vx += (n.homeX - n.x) * k;
          n.vy += (n.homeY - n.y) * k;
          const damp = 1 - 0.18 * pull;
          n.vx *= damp; n.vy *= damp;
        }

        {
          const h = n as any;
          if (h.hopV || h.hop) {
            h.hopV = (h.hopV ?? 0) - 0.03;
            h.hop = (h.hop ?? 0) + h.hopV;
            if (h.hop <= 0) {
              h.hop = 0;
              // Lands with a knock and a smaller rebound, then rests
              if (h.hopV < -0.06) { playKnock(Math.min(1, -h.hopV * 3)); h.hopV = -h.hopV * 0.3; } else h.hopV = 0;
            }
          }
        }
        n.x += n.vx;
        n.y += n.vy;
        n.vx *= FRICTION;
        n.vy *= FRICTION;

        if (Math.abs(n.vx) < STOP_THRESHOLD) n.vx = 0;
        if (Math.abs(n.vy) < STOP_THRESHOLD) n.vy = 0;

        const wasOnWall = touchingWall[id];
        const hitWall = (speed: number) => { if (!wasOnWall) triggerWallHit(id, speed); };
        let onWall = false;

        if (n.x - n.r < 0) {
          onWall = true;
          hitWall(Math.abs(n.vx));
          n.x = n.r;
          n.vx = Math.abs(n.vx) < settleSpeed() ? 0 : Math.abs(n.vx) * BOUNCE_DAMPING;
        } else if (n.x + n.r > WIDTH) {
          onWall = true;
          hitWall(Math.abs(n.vx));
          n.x = WIDTH - n.r;
          n.vx = Math.abs(n.vx) < settleSpeed() ? 0 : -Math.abs(n.vx) * BOUNCE_DAMPING;
        }
        if (n.y - n.r < 0) {
          onWall = true;
          hitWall(Math.abs(n.vy));
          n.y = n.r;
          n.vy = Math.abs(n.vy) < settleSpeed() ? 0 : Math.abs(n.vy) * BOUNCE_DAMPING;
        } else if (n.y + n.r > HEIGHT) {
          onWall = true;
          hitWall(Math.abs(n.vy));
          n.y = HEIGHT - n.r;
          // Settle instead of bouncing once the impact is no stronger than the
          // pull itself — otherwise gravity keeps the stack jittering (and
          // knocking) for as long as the page is scrolled.
          n.vy = Math.abs(n.vy) < settleSpeed() ? 0 : -Math.abs(n.vy) * BOUNCE_DAMPING;
        }
        touchingWall[id] = onWall;
      });

      // A few passes: with ten balls packed into one line a single pass leaves
      // the middle of the row still overlapping.
      resolveBallCollisions();
      resolveBallCollisions();
      resolveBallCollisions();
      resolveBallCollisions();
      // Collisions can shove a ball past the edge — keep everyone in the field
      Object.values(nodes).forEach(n => {
        n.x = Math.min(Math.max(n.x, n.r), WIDTH - n.r);
        n.y = Math.min(Math.max(n.y, n.r), HEIGHT - n.r);
      });

      // A landed heap passes its weight back and forth between neighbours by
      // fractions of a pixel forever, which reads as a constant shiver. A ball
      // that has hardly moved for ~0.6s is put to rest right where it sits;
      // any real knock (it gets shoved several pixels in a frame) wakes it.
      Object.keys(nodes).forEach(id => {
        const n = nodes[id];
        if (!gravity || id === dragId) { n.restFrames = 0; n.anchorX = n.x; n.anchorY = n.y; return; }
        if (Math.hypot(n.x - n.anchorX, n.y - n.anchorY) > 3) {
          n.restFrames = 0; n.anchorX = n.x; n.anchorY = n.y;
        } else if (++n.restFrames > 36) {
          n.x = n.anchorX; n.y = n.anchorY; n.vx = 0; n.vy = 0;
        }
      });
    }

    // The physics is tuned per 60Hz frame. When a frame runs long (a busy
    // page, a slow GPU drawing the big lettered balls), extra ticks catch up,
    // so the balls move at the same speed instead of slowing down with it.
    let lastStepAt = 0;
    function step() {
      const now = performance.now();
      const ticks = lastStepAt ? Math.min(3, Math.max(1, Math.round((now - lastStepAt) / 16.667))) : 1;
      lastStepAt = now;
      for (let t = 0; t < ticks; t++) simulate();

      const allSettled = dragId === null
        && Object.keys(nodes).every(id => nodes[id].vx === 0 && nodes[id].vy === 0
          && nodes[id].rollX === 0 && nodes[id].rollY === 0
          && !(nodes[id] as any).hop && !(nodes[id] as any).hopV);
      if (allSettled) {
        // Snap the squash/stretch back to neutral before freezing — otherwise
        // the last frame's smoothing lag could lock in a faint, permanent
        // squash instead of the ball's true resting shape.
        Object.values(nodes).forEach(n => { n.dispVx = 0; n.dispVy = 0; n.squeezeV = 0; n.squeezeH = 0; });
        render();
        sleeping = true;
        return;
      }

      render();
      raf = requestAnimationFrame(step);
    }

    // Wired up last: everything readScroll touches (recomputeSlots,
    // wordOrder, respawnMerged) is already declared by now.
    if (gravityOnScroll) {
      readScroll();
      window.addEventListener('scroll', readScroll, { passive: true, capture: true });
      const lenis = (window as any).__lenis;
      lenis?.on?.('scroll', readScroll);
      detachScroll = () => {
        window.removeEventListener('scroll', readScroll, true);
        lenis?.off?.('scroll', readScroll);
      };
    }

    render();
    raf = requestAnimationFrame(step);

    // ── Intro: the graph rises into place ─────────────────────────────────────
    // Once, on first load: the balls start in the landed SKIP · DESIGN row at
    // the bottom and float up to their resting spots — the same move as
    // scrolling back to the top. A resize rebuild skips it.
    if (intro && !introPlayed.current
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      introPlayed.current = true;
      Object.values(nodes).forEach(n => { n.x = n.slotX; n.y = HEIGHT - n.r; n.vx = 0; n.vy = 0; });
      render();
    }

    return () => {
      cancelAnimationFrame(raf);
      detachScroll?.();
      window.removeEventListener('deviceorientation', onOrient);
      window.removeEventListener('devicemotion', onMotion);
      if (askTilt) document.removeEventListener('touchend', askTilt);
      nodesLayer.removeEventListener('pointerdown', onPointerDown);
      nodesLayer.removeEventListener('touchstart', onBallTouch);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('touchmove', onTouchMove);
      cancelHold();
      window.removeEventListener('pointercancel', endDrag);
      window.removeEventListener('pointerdown', onFirstGesture, true);
      window.removeEventListener('keydown', onFirstGesture, true);
      nodesLayer.replaceChildren();
      svg.querySelectorAll(`[id^="${sphereId}-shade-"]`).forEach(el => el.remove());
      edgesLayer.replaceChildren();
      // The audio context is the whole site's (sound/Sound.ts) — never closed here
    };
    // A resize rebuilds the constellation, so the box always holds it whole
  }, [sound, size.w, size.h]);

  return (
    <div ref={boxRef} style={{ width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size.w} ${size.h}`}
        xmlns={NS}
        // pan-y: a finger on the empty field scrolls the page (the hero is a
        // full screen — `none` here trapped scrolling on phones). A touch that
        // starts on a ball is kept for the drag instead (see onBallTouch).
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'pan-y' }}
        // The hero underneath navigates on click — grabbing a ball must not
        onClick={e => e.stopPropagation()}
      >
        <defs>
          <filter ref={sphereRef} id={sphereId} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feImage preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g ref={edgesRef} />
        <g ref={nodesRef} />
      </svg>
    </div>
  );
}
