import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import svgPaths from '../../imports/Index/svg-3bjnx36a2y';

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
      const makeTex = (label: string | null) => {
        const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
        const g = c.getContext('2d')!;
        g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = '#111111';
        for (const cx of [256, 768]) {
          if (!label) { drawLogo(g, cx, 170); continue; }
          let size = 84;
          g.font = `450 ${size}px "CoFo Sans VF", sans-serif`;
          while (g.measureText(label).width > 250 && size > 18) { size -= 2; g.font = `450 ${size}px "CoFo Sans VF", sans-serif`; }
          g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(label, cx, 256);
        }
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
        return t;
      };
      const texSkip = makeTex(null);
      const texFor = new Map<string, import('three').Texture>();
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: texSkip, roughness: 0.95, metalness: 0 });
      const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mat);
      ball.rotation.x = 0.35;
      scene.add(ball);

      // Texture u = 0.25 faces the camera at rotation.y = 0, and its twin at π
      const FACE = 0;
      let handed = false, gone = false;
      let fallen = false, vy = 0, fy = 0, fx = 0, fr = 1, shown = '', raf = 0;
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
        if (!fallen && vis && yScreen < H * 0.3) { fallen = true; vy = 0; fx = x; fy = yScreen; fr = r; window.dispatchEvent(new CustomEvent('skip-ball-fallen')); }
        // Scrolled back up to the ticker: the ball is there again, ready to drop once more
        if (fallen && a && yScreen > H * 0.5) {
          fallen = false; gone = false;
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
          // Which sticker: the hovered client's, else the logo
          const want = hoverRef.current && !fallen ? hoverRef.current : '';
          if (want !== shown) {
            shown = want;
            if (!want) mat.map = texSkip;
            else { if (!texFor.has(want)) texFor.set(want, makeTex(want)); mat.map = texFor.get(want)!; }
            mat.needsUpdate = true;
          }
          ball.scale.setScalar(r);
          ball.position.set(x, H - yScreen, 0);
          // Turns about its vertical axis; a hovered ball eases round to show its sticker face-on
          if (want) {
            const target = Math.round((ball.rotation.y - FACE) / Math.PI) * Math.PI + FACE;
            ball.rotation.y += (target - ball.rotation.y) * 0.08;
          } else ball.rotation.y += 0.011;
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
        texSkip.dispose(); texFor.forEach(t => t.dispose());
        mat.dispose(); ball.geometry.dispose();
        renderer.domElement.remove();
      };
    })();
    return () => { stop = true; cleanup(); };
  }, [anchor]);

  // At body level: inside the page's transformed layers `fixed` would not mean the screen
  return createPortal(<div ref={host} data-client-ball="" aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 4, pointerEvents: 'none' }} />, document.body);
}
