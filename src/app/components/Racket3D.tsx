import { useEffect, useRef } from 'react';
import { sound } from '../sound/Sound';
import PillButton from './PillButton';

// 404 alternative (localhost only): a minimalist racket in real 3D (three.js)
// and a ball in a bare room. The racket follows the pointer on its own plane,
// tilting with its motion; the ball flies back and forth between the racket,
// the walls, the floor and the ceiling.
const BG = 0xeaeaea;
const X = 2.6, Y = 1.5, Z_BACK = -4, Z_RACKET = 2.2;
const BALL_R = 0.17, RACKET_R = 0.62;

export default function Racket3D({ onGoHome }: { onGoHome: () => void }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let stop = false;
    let cleanup = () => {};
    (async () => {
      const THREE = await import('three');
      if (stop || !host.current) return;
      const el = host.current;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(BG);
      el.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;cursor:none';

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
      camera.position.set(0, 0.35, 6.4);
      camera.lookAt(0, 0, -0.8);
      const resize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener('resize', resize);

      scene.add(new THREE.AmbientLight(0xffffff, 1.15));
      const sun = new THREE.DirectionalLight(0xffffff, 1.5);
      sun.position.set(-2.5, 4, 5);
      scene.add(sun);

      // The room: only its edges, very faint
      const box = new THREE.BoxGeometry(X * 2, Y * 2, Z_RACKET - Z_BACK);
      const room = new THREE.LineSegments(
        new THREE.EdgesGeometry(box),
        new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16 }),
      );
      room.position.set(0, 0, (Z_RACKET + Z_BACK) / 2);
      scene.add(room);
      // A pale floor so the ball's shadow has somewhere to fall
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(X * 2, Z_RACKET - Z_BACK),
        new THREE.MeshBasicMaterial({ color: 0xdcdcdc, transparent: true, opacity: 0.5 }),
      );
      floor.rotation.x = -Math.PI / 2; floor.position.set(0, -Y, (Z_RACKET + Z_BACK) / 2);
      scene.add(floor);

      // The ball: matte white
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(BALL_R, 48, 32),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 }),
      );
      scene.add(ball);
      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(BALL_R * 1.2, 32),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16 }),
      );
      shadow.rotation.x = -Math.PI / 2;
      scene.add(shadow);

      // The racket: a thin black ring, a pale translucent face, a handle with a grip
      const racket = new THREE.Group();
      const ink = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.55, metalness: 0.1 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(RACKET_R, 0.035, 20, 96), ink);
      const face = new THREE.Mesh(
        new THREE.CircleGeometry(RACKET_R, 64),
        new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, side: THREE.DoubleSide, roughness: 0.4 }),
      );
      // Strings: a fine grid across the face, cut to the ring
      const pts: number[] = [];
      for (let i = -5; i <= 5; i++) {
        const o = (i / 6) * RACKET_R, c = Math.sqrt(Math.max(0, RACKET_R * RACKET_R - o * o)) * 0.97;
        pts.push(-c, o, 0, c, o, 0, o, -c, 0, o, c, 0);
      }
      const sg = new THREE.BufferGeometry();
      sg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const strings = new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.35 }));
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.55, 20), ink);
      neck.position.set(0, -RACKET_R - 0.22, 0);
      const grip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.075, 0.5, 24),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 }),
      );
      grip.position.set(0, -RACKET_R - 0.7, 0);
      racket.add(ring, face, strings, neck, grip);
      racket.rotation.z = 0.35;           // held at a slight angle
      scene.add(racket);

      // Game state
      const st = { x: 0, y: -0.2, tx: 0, ty: -0.2, vx: 0, vy: 0 };
      const b = { x: 0.6, y: 0.5, z: Z_BACK + 0.4, vx: 0, vy: 0.01, vz: 0.05 };
      let missed = 0, hitKick = 0;
      const serve = () => {
        b.x = (Math.random() - 0.5) * 3; b.y = 0.6; b.z = Z_BACK + 0.4;
        b.vx = (Math.random() - 0.5) * 0.05; b.vy = 0.012; b.vz = 0.05;
      };
      serve();

      // The pointer, taken onto the racket's plane
      const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -Z_RACKET), hit = new THREE.Vector3();
      const onMove = (e: PointerEvent) => {
        const r = renderer.domElement.getBoundingClientRect();
        ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
        if (ray.ray.intersectPlane(plane, hit)) {
          st.tx = Math.max(-X + 0.5, Math.min(X - 0.5, hit.x));
          st.ty = Math.max(-Y + 0.5, Math.min(Y - 0.3, hit.y));
        }
      };
      window.addEventListener('pointermove', onMove);

      let raf = 0;
      const tick = () => {
        // Racket
        const px = st.x, py = st.y;
        st.x += (st.tx - st.x) * 0.2; st.y += (st.ty - st.y) * 0.2;
        st.vx = st.x - px; st.vy = st.y - py;
        racket.position.set(st.x, st.y, Z_RACKET);
        racket.rotation.y = THREE.MathUtils.lerp(racket.rotation.y, -st.vx * 7, 0.2);
        racket.rotation.x = THREE.MathUtils.lerp(racket.rotation.x, st.vy * 7 - hitKick * 0.25, 0.2);
        racket.rotation.z = 0.35 - st.vx * 2.4;
        hitKick *= 0.88;

        // Ball
        b.vy -= 0.0008;
        b.x += b.vx; b.y += b.vy; b.z += b.vz;
        if (b.x > X - BALL_R) { b.x = X - BALL_R; b.vx = -Math.abs(b.vx) * 0.95; }
        if (b.x < -X + BALL_R) { b.x = -X + BALL_R; b.vx = Math.abs(b.vx) * 0.95; }
        if (b.y < -Y + BALL_R) { b.y = -Y + BALL_R; b.vy = Math.abs(b.vy) * 0.88; }
        if (b.y > Y - BALL_R) { b.y = Y - BALL_R; b.vy = -Math.abs(b.vy) * 0.9; }
        if (b.z < Z_BACK + BALL_R) { b.z = Z_BACK + BALL_R; b.vz = Math.abs(b.vz); sound.play('hover', 90); }
        if (b.vz > 0 && b.z > Z_RACKET - BALL_R - 0.05 && b.z < Z_RACKET + 0.25) {
          const dx = b.x - st.x, dy = b.y - st.y;
          if (Math.hypot(dx, dy) < RACKET_R + BALL_R * 0.6) {
            b.z = Z_RACKET - BALL_R - 0.05;
            b.vz = -Math.min(0.12, Math.abs(b.vz) * 1.05 + 0.006);
            b.vx = b.vx * 0.4 + dx * 0.06 + st.vx * 0.9;
            b.vy = Math.max(0.008, b.vy * 0.3 + dy * 0.05 + st.vy * 0.9 + 0.014);
            hitKick = 1;
            sound.play('tap', 40);
          }
        }
        // Missed: the ball drifts on past the racket, then a new one is served
        if (b.z > Z_RACKET + 1.2) { b.vz *= 0.9; if (++missed > 60) { missed = 0; serve(); } }
        ball.position.set(b.x, b.y, b.z);
        ball.rotation.x += b.vz * 2; ball.rotation.y += b.vx * 2;
        shadow.position.set(b.x, -Y + 0.01, b.z);
        shadow.scale.setScalar(Math.max(0.5, 1.3 - (b.y + Y) * 0.25));

        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        window.removeEventListener('pointermove', onMove);
        renderer.dispose();
        scene.traverse(o => {
          const m = o as import('three').Mesh;
          m.geometry?.dispose?.();
          const mat = m.material as import('three').Material | import('three').Material[] | undefined;
          (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach(x => x.dispose());
        });
        renderer.domElement.remove();
      };
    })();
    return () => { stop = true; cleanup(); };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 160, background: '#eaeaea', animation: 'pageIn 0.35s 0.05s ease both' }}>
      <div ref={host} style={{ position: 'absolute', inset: 0 }} />
      <div style={{
        position: 'absolute', top: 'var(--pad)', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--hero-fs, min(var(--hero-size), 7.2vw))',
        fontWeight: 'var(--heading-weight)' as React.CSSProperties['fontWeight'],
        lineHeight: 'var(--hero-lh, 0.8755)', letterSpacing: '-0.03em', color: 'var(--c-text)',
      }}>404</div>
      <div style={{ position: 'absolute', left: '50%', bottom: 'calc(var(--pad) + 60px)', transform: 'translateX(-50%)' }}>
        <PillButton variant="primary" onClick={onGoHome}>На главную</PillButton>
      </div>
    </div>
  );
}
