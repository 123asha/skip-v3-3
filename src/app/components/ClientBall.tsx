import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import svgPaths from '../../imports/Index/svg-3bjnx36a2y';
import { sound } from '../sound/Sound';
import { asset } from '../utils/asset';

// The ping-pong ball under the «Нам доверяют» ticker. It turns slowly on its
// spot; its sticker is the Skip Design logo, or — while a client's name is
// hovered — that client's mark. Scrolled on past, it drops out of the screen
// (and the one in the contact form takes over).
// A fixed full-screen canvas (so the ball can really fall off the page); the
// ball follows the anchor box's place on screen.
export default function ClientBall({ anchor, hovered }: { anchor: React.RefObject<HTMLElement | null>; hovered: string | null }) {
  const hoverRef = useRef<string | null>(null);
  hoverRef.current = hovered;
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let stop = false;
    let cleanup = () => {};
    (async () => {
      const THREE = await import('three');
      if (stop || !host.current) return;
      const el = host.current;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
      const scene = new THREE.Scene();
      let W = 0, H = 0;
      const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -2000, 2000);
      // The canvas box in its own (layout) pixels; the page may be CSS-zoomed, so
      // screen rects are brought into these pixels by the zoom factor
      const resize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        if (!w || !h || (w === W && h === H)) return;
        W = w; H = h;
        renderer.setSize(W, H, false);
        camera.left = 0; camera.right = W; camera.top = H; camera.bottom = 0; camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener('resize', resize);
      scene.add(new THREE.AmbientLight(0xffffff, 1.7));
      const sun = new THREE.DirectionalLight(0xffffff, 0.85);
      sun.position.set(-300, 500, 800);
      scene.add(sun);

      // Stickers: the Skip logo, and each client's mark, drawn on a canvas texture, one on each side
      const paths = svgPaths.pb7e9300.match(/M[^M]+/g)!;
      const drawLogo = (g: CanvasRenderingContext2D, cx: number, w: number) => {
        const sc = w / 52.5283;
        g.save(); g.translate(cx - w / 2, 256 - 16 * sc); g.scale(sc, sc);
        g.fill(new Path2D(paths[1])); g.fill(new Path2D(paths[2])); g.fill(new Path2D(paths[4]));
        g.fill(new Path2D(paths[0] + paths[3]), 'evenodd');
        g.restore();
      };
      // The sticker: the favicon — a black ball with its white glint — on each side of the ball
      const fav = new Image();
      const makeTex = (_label: string | null) => {
        const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
        const g = c.getContext('2d')!;
        const paint = () => {
          g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
          if (fav.complete && fav.naturalWidth) for (const cx of [256, 768]) g.drawImage(fav, cx - 85, 256 - 85, 170, 170);
        };
        paint();
        fav.addEventListener('load', () => { paint(); t.needsUpdate = true; });
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
        return t;
      };
      fav.src = asset('/fav-black-nobg.png');
      const texSkip = makeTex(null);
      // The shading of the service balls, exactly: a bright soft base (#fdfdfd → #f4f4f4 → #e9e9e9),
      // a glint at the upper left and a faint shade at the lower right, laid over the sticker
      texSkip.colorSpace = THREE.NoColorSpace;
      const mat = new THREE.ShaderMaterial({
        uniforms: { map: { value: texSkip } },
        vertexShader: `
          varying vec2 vUv; varying vec3 vN;
          void main() { vUv = uv; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          uniform sampler2D map; varying vec2 vUv; varying vec3 vN;
          void main() {
            vec2 p = vN.xy;
            float d = length(p - vec2(-0.15, 0.2)) / 1.3;
            vec3 c0 = vec3(0.992), c1 = vec3(0.957), c2 = vec3(0.914);
            vec3 col = d < 0.6 ? mix(c0, c1, d / 0.6) : mix(c1, c2, clamp((d - 0.6) / 0.4, 0.0, 1.0));
            float s = clamp(1.0 - length(p - vec2(-0.4, 0.48)) / 0.7, 0.0, 1.0) * 0.85;
            col = mix(col, vec3(1.0), s);
            float q = length(p - vec2(0.45, -0.5)) / 0.95;
            float a = q < 0.75 ? mix(0.10, 0.02, q / 0.75) : mix(0.02, 0.0, clamp((q - 0.75) / 0.25, 0.0, 1.0));
            col *= 1.0 - a;
            col *= texture2D(map, vUv).rgb;
            gl_FragColor = vec4(col, 1.0);
          }`,
      });
      const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mat);
      ball.rotation.x = 0.35;
      scene.add(ball);

      // Texture u = 0.25 faces the camera at rotation.y = 0, and its twin at π
      const FACE = 0;
      let handed = false, gone = false;
      // The dotted line to the hovered name, and the ball's lean towards it
      const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const lineMat = new THREE.LineDashedMaterial({ color: 0x111111, dashSize: 3, gapSize: 6, transparent: true, opacity: 0 });
      const cord = new THREE.Line(lineGeo, lineMat);
      cord.position.z = -50;
      scene.add(cord);
      // Appearing: the ball drops in from a little above its place, under the «Нам доверяют»
      // line, and bounces to rest, squashing on each landing
      const ap = { on: false, oy: 0, v: 0, sq: 0, f: 0, wasIn: false };
      const startAppear = (r0: number) => { ap.on = true; ap.oy = -r0 * 1.3; ap.v = 0; ap.sq = 0; ap.f = 0; };
      let hoverT = 0, knocked = false;
      let lx = 0, ly = 0, lineA = 0, lastTarget: { x: number; y: number } | null = null;
      const nameBox = (name: string, bx: number) => {
        // The name's place under the ticker: of the two copies, the one nearest the ball
        let best: DOMRect | null = null, bd = Infinity;
        document.querySelectorAll('p').forEach(pEl => {
          // The ticker's names (the flip effect doubles their text)
          if (pEl.style.cursor !== 'pointer' || !pEl.textContent?.includes(name)) return;
          const rc = pEl.getBoundingClientRect();
          const d = Math.abs((rc.left + rc.right) / 2 - bx);
          if (rc.width > 0 && d < bd) { bd = d; best = rc; }
        });
        return best as DOMRect | null;
      };
      let fallen = false, vy = 0, fy = 0, fx = 0, fr = 1, raf = 0;
      const tick = () => {
        resize();
        const hb = el.getBoundingClientRect();
        const zk = hb.width / (el.clientWidth || 1) || 1;
        const a0 = anchor.current?.getBoundingClientRect();
        // The anchor's rect in the canvas's own pixels
        const a = a0 && { left: (a0.left - hb.left) / zk, top: (a0.top - hb.top) / zk, width: a0.width / zk, height: a0.height / zk };
        let x = fx, yScreen = fy, r = fr, vis = false;
        if (a && a.width > 0) {
          // The anchor is a ball-sized box: the ball sits in it
          r = (a.width / 2) * 0.6;
          x = a.left + a.width / 2; yScreen = a.top + a.height / 2;
          vis = true;
        }
        if (!fallen) {
          const inView = !!a && a.top < H * 0.9 && a.top + a.height > 0;
          if (inView && !ap.wasIn) startAppear(r);
          ap.wasIn = inView;
        }
        if (!fallen && vis && yScreen < H * 0.3) { fallen = true; vy = 0; fx = x; fy = yScreen; fr = r; window.dispatchEvent(new CustomEvent('skip-ball-fallen')); }
        // Scrolled back up to the ticker: the ball is there again, ready to drop once more
        if (fallen && a && yScreen > H * 0.5) {
          fallen = false; gone = false; startAppear(r);
          if (handed) { handed = false; }
          window.dispatchEvent(new CustomEvent('skip-ball-return'));
        }
        if (fallen) {
          vy = Math.min(vy + 0.9, 26); fy += vy; x = fx; yScreen = fy; r = fr;
          vis = fy - fr <= H;
          if (!vis && !handed && !gone) { gone = true; window.dispatchEvent(new CustomEvent('skip-ball-gone')); }
          // Reaching the contact form's table on screen: the game ball takes over from here
          const table = document.querySelector('[data-form-pinball]');
          const tr = table?.getBoundingClientRect();
          if (!handed && tr && tr.height > 0 && tr.top < hb.top + H * zk && (fy + fr) * zk + hb.top >= tr.top + 4) {
            handed = true;
            window.dispatchEvent(new CustomEvent('skip-ball-handoff', {
              detail: { x: hb.left + fx * zk, y: hb.top + fy * zk, vy: vy * zk, vx: (Math.random() - 0.5) * 9 },
            }));
          }
          if (handed) vis = false;
        }
        renderer.domElement.style.visibility = vis ? 'visible' : 'hidden';
        // Under the page-end inversion the ball is drawn inverted too, switching exactly
        // at the layer's mid-grey point so it stays white without a flash
        const ov = document.querySelector<HTMLElement>('[data-invert-overlay]');
        renderer.domElement.style.filter = ov && parseFloat(getComputedStyle(ov).opacity) > 0.5 ? 'invert(1)' : '';
        if (vis) {
          // Always the Skip logo. Over a client's name the ball leans a little towards
          // that name and is joined to it by a dotted line
          const want = hoverRef.current && !fallen ? hoverRef.current : '';
          let tx = x, ty = yScreen, hasT = false;
          if (want) {
            const rc = nameBox(want, hb.left + x * zk);
            if (rc) { lastTarget = { x: ((rc.left + rc.right) / 2 - hb.left) / zk, y: (rc.bottom - hb.top) / zk }; hasT = true; }
          }
          // While a name is hovered the ball keeps lunging at it, knocks against it and
          // drops back — to and fro — until the pointer moves away
          if (hasT && lastTarget) {
            const dx = lastTarget.x - x, dy = lastTarget.y - yScreen, d = Math.hypot(dx, dy) || 1;
            const reach = Math.min(Math.max(d - r * 0.95, 0), 130);
            hoverT += 1 / 60;
            const ph = Math.abs(Math.sin(hoverT * 3.4));
            if (ph > 0.96 && !knocked) { knocked = true; ap.sq = Math.max(ap.sq, 0.7); sound.play('tap', 120); }
            if (ph < 0.7) knocked = false;
            tx = x + (dx / d) * reach * ph; ty = yScreen + (dy / d) * reach * ph;
          } else { hoverT = 0; knocked = false; }
          const k = hasT ? 0.45 : 0.12;
          lx += (tx - x - lx) * k; ly += (ty - yScreen - ly) * k;
          lineA += ((hasT ? 0.9 : 0) - lineA) * 0.15;
          x += lx; yScreen += ly;
          let sx = 1, sy = 1;
          if (ap.on && !fallen) {
            ap.f++;
            ap.v += 0.7; ap.oy += ap.v;
            if (ap.oy >= 0) {
              ap.oy = 0;
              if (ap.v > 2) ap.sq = Math.min(0.5, ap.v / 36);
              ap.v = -ap.v * 0.4;
              if (Math.abs(ap.v) < 1.4) { ap.v = 0; ap.on = false; }
            }
            yScreen += ap.oy;
            const grow = Math.min(1, 0.35 + ap.f / 12);
            sx = sy = grow;
          }
          ap.sq *= 0.84;
          sx *= 1 + 0.12 * ap.sq; sy *= 1 - 0.14 * ap.sq;
          ball.scale.set(r * sx, r * sy, r * sx);
          ball.position.set(x, H - (yScreen + r * (1 - sy)), 0);
          if (lastTarget && lineA > 0.01) {
            const pa = lineGeo.attributes.position as import('three').BufferAttribute;
            pa.setXYZ(0, x, H - yScreen, 0); pa.setXYZ(1, lastTarget.x, H - lastTarget.y, 0); pa.needsUpdate = true;
            cord.computeLineDistances();
            lineMat.opacity = lineA; cord.visible = true;
          } else cord.visible = false;
          ball.rotation.y += 0.011;
          ball.rotation.x += (0.2 - ball.rotation.x) * 0.05;
          renderer.render(scene, camera);
        }
        raf = requestAnimationFrame(tick);
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        renderer.dispose();
        texSkip.dispose(); lineGeo.dispose(); lineMat.dispose();
        mat.dispose(); ball.geometry.dispose();
        renderer.domElement.remove();
      };
    })();
    return () => { stop = true; cleanup(); };
  }, [anchor]);

  // At body level: inside the page's transformed layers `fixed` would not mean the screen
  return createPortal(<div ref={host} data-client-ball="" aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 4, pointerEvents: 'none' }} />, document.body);
}
