import { useEffect, useRef } from 'react';
import { sound } from '../sound/Sound';
import svgPaths from '../../imports/Index/svg-3bjnx36a2y';

// 404 alternative (localhost only): a minimalist table-tennis paddle in real 3D (three.js)
// and a ball in a bare room. The racket follows the pointer on its own plane,
// tilting with its motion; the ball flies back and forth between the racket,
// the walls, the floor and the ceiling.
const BG = 0xeaeaea;
const X = 2.6, Y = 1.5, Z_BACK = -4, Z_RACKET = 2.2;
const BALL_R = 0.17, RACKET_R = 0.62;

export default function Racket3D(_: { onGoHome?: () => void }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let stop = false;
    let cleanup = () => {};
    (async () => {
      const THREE = await import('../utils/three-lite');
      if (stop || !host.current) return;
      const el = host.current;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(BG);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      el.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;cursor:none';

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
      camera.position.set(0, 1.5, 6.8);
      camera.lookAt(0, -0.45, -0.4);
      const resize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener('resize', resize);

      scene.add(new THREE.AmbientLight(0xffffff, 1.15));
      const sun = new THREE.DirectionalLight(0xffffff, 1.5);
      sun.position.set(-0.8, 6, 1.2);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.left = -X - 1; sun.shadow.camera.right = X + 1;
      sun.shadow.camera.top = 5; sun.shadow.camera.bottom = -5;
      sun.shadow.camera.near = 1; sun.shadow.camera.far = 14;
      sun.shadow.radius = 5; sun.shadow.bias = -0.0004;
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
      const floorShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(X * 2, Z_RACKET - Z_BACK),
        new THREE.ShadowMaterial({ opacity: 0.22 }),
      );
      floorShadow.rotation.x = -Math.PI / 2; floorShadow.position.set(0, -Y + 0.002, (Z_RACKET + Z_BACK) / 2);
      floorShadow.receiveShadow = true;
      scene.add(floorShadow);

      // «404», written on the back wall in the site's display type
      await document.fonts.ready;
      if (stop) { renderer.dispose(); renderer.domElement.remove(); return; }
      const wallTex = (() => {
        const c = document.createElement('canvas'); c.width = 2048; c.height = Math.round(2048 * Y / X);
        const g = c.getContext('2d')!;
        const cs = getComputedStyle(document.documentElement);
        const family = cs.getPropertyValue('--font-display').trim() || 'sans-serif';
        const weight = cs.getPropertyValue('--heading-weight').trim() || '450';
        g.fillStyle = getComputedStyle(document.body).color || '#111';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `${weight} ${Math.round(c.height * 0.5)}px ${family}`;
        if ('letterSpacing' in g) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${-Math.round(c.height * 0.015)}px`;
        g.fillText('404', c.width / 2, c.height * 0.5);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
        return t;
      })();
      const wall404 = new THREE.Mesh(
        new THREE.PlaneGeometry(X * 2, Y * 2),
        new THREE.MeshBasicMaterial({ map: wallTex, transparent: true, depthWrite: false }),
      );
      wall404.position.set(0, 0, Z_BACK + 0.002);
      scene.add(wall404);

      // The ball: matte white
      const tex = (() => {
        const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
        const g = c.getContext('2d')!;
        g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = '#111111';
        // The logo's own paths (viewBox 52.53 × 32), one on each side of the ball
        const paths = svgPaths.pb7e9300.match(/M[^M]+/g)!;
        const w = 150, sc = w / 52.5283;
        for (const cx of [256, 768]) {
          g.save(); g.translate(cx - w / 2, 256 - 16 * sc); g.scale(sc, sc);
          g.fill(new Path2D(paths[1]));
          g.fill(new Path2D(paths[2]));
          g.fill(new Path2D(paths[4]));
          g.fill(new Path2D(paths[0] + paths[3]), 'evenodd');
          g.restore();
        }
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
        return t;
      })();
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(BALL_R, 64, 48),
        new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex, roughness: 0.95, metalness: 0 }),
      );
      ball.castShadow = true;
      // A holder takes the squash and stretch, so they stay vertical while the ball itself rolls
      const ballHolder = new THREE.Group();
      ballHolder.add(ball);
      scene.add(ballHolder);

      // A table-tennis paddle after the render: a slightly egg-shaped red blade
      // with a thin edge, and a long slim flat handle of layered light wood
      const racket = new THREE.Group();
      const R0 = RACKET_R;
      const bladeWood = new THREE.Shape();
      bladeWood.moveTo(-0.5 * R0, -0.86 * R0);
      bladeWood.absarc(0, 0, R0, (240 * Math.PI) / 180, (-60 * Math.PI) / 180, true);
      bladeWood.quadraticCurveTo(0.2 * R0, -0.98 * R0, 0.17 * R0, -1.15 * R0);
      bladeWood.lineTo(-0.17 * R0, -1.15 * R0);
      bladeWood.quadraticCurveTo(-0.2 * R0, -0.98 * R0, -0.5 * R0, -0.86 * R0);
      const edge = new THREE.Shape();
      edge.absarc(0, 0, R0 * 1.004, 0, Math.PI * 2, false);
      const rubber = new THREE.Shape();
      const rr = R0 * 0.968, cy = -0.55 * R0, a0 = Math.asin(cy / rr);
      rubber.moveTo(-rr * Math.cos(a0), cy);
      rubber.absarc(0, 0, rr, Math.PI - a0, a0, true);
      rubber.quadraticCurveTo(0, cy + 0.12 * R0, -rr * Math.cos(a0), cy);
      // The handle: straight, slim, widening a little towards a rounded-square end
      const grip = new THREE.Shape();
      grip.moveTo(-0.17 * R0, -1.1 * R0);
      grip.lineTo(0.17 * R0, -1.1 * R0);
      grip.quadraticCurveTo(0.2 * R0, -1.8 * R0, 0.27 * R0, -2.3 * R0);
      grip.quadraticCurveTo(0.29 * R0, -2.46 * R0, 0.14 * R0, -2.46 * R0);
      grip.lineTo(-0.14 * R0, -2.46 * R0);
      grip.quadraticCurveTo(-0.29 * R0, -2.46 * R0, -0.27 * R0, -2.3 * R0);
      grip.quadraticCurveTo(-0.2 * R0, -1.8 * R0, -0.17 * R0, -1.1 * R0);
      const slab = (shape: import('three').Shape, depth: number, z: number, mat: import('three').Material) => {
        const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 64 });
        g.translate(0, 0, z);
        return new THREE.Mesh(g, mat);
      };
      const rubberTex = (() => {
        const c = document.createElement('canvas'); c.width = c.height = 64;
        const g = c.getContext('2d')!;
        g.fillStyle = '#d4483d'; g.fillRect(0, 0, 64, 64);
        g.fillStyle = '#dd5a4e';
        for (const [x, y] of [[16, 16], [48, 16], [32, 48], [0, 48], [64, 48]]) { g.beginPath(); g.arc(x, y, 8, 0, Math.PI * 2); g.fill(); }
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(7, 7); t.anisotropy = 4;
        return t;
      })();
      // Plywood layers: fine darker lines running along the handle
      const woodTex = (() => {
        const c = document.createElement('canvas'); c.width = 128; c.height = 8;
        const g = c.getContext('2d')!;
        g.fillStyle = '#dcc7a2'; g.fillRect(0, 0, 128, 8);
        g.fillStyle = '#b99a6c';
        for (const x of [20, 56, 92]) g.fillRect(x, 0, 3, 8);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 1);
        return t;
      })();
      const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.7 });
      const redMat = new THREE.MeshStandardMaterial({ map: rubberTex, roughness: 0.85 });
      const edgeMat = new THREE.MeshStandardMaterial({ color: 0x8c231c, roughness: 0.8 });
      const blackMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.8 });
      const T = 0.045, RB = 0.02, TH = 0.075;
      racket.add(
        slab(grip, TH, -TH / 2, woodMat),
        slab(bladeWood, T, -T / 2, woodMat),
        slab(edge, T + 2 * RB, -T / 2 - RB, edgeMat),
        slab(rubber, RB + 0.004, T / 2 + 0.0, redMat),
        slab(rubber, RB + 0.004, -T / 2 - RB - 0.004, blackMat),
      );
      racket.traverse(o => { (o as import('three').Mesh).castShadow = true; });
      scene.add(racket);
      // The string: from the middle of the paddle's face to the ball
      const cord = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
        new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.7 }),
      );
      scene.add(cord);
      const LEN = 2.1;

      // Juggling: the paddle lies flat, black side up, at the bottom of the room;
      // the ball falls onto it and is knocked back up from below. The pointer
      // slides the paddle across the floor (left–right, near–far); a press
      // swings it up for a harder hit.
      const PY = -Y + 0.55;
      const st = { x: 0, z: 0.6, tx: 0, tz: 0.6, vx: 0, vz: 0, lift: 0, swing: 0 };
      const b = { x: 0.3, y: 0.9, z: 0.4, vx: 0, vy: 0, vz: 0 };
      let hitKick = 0, squash = 0;
      b.x = st.x; b.z = st.z; b.y = PY + 1.6;

      // The pointer, taken onto the paddle's plane
      const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -PY), hit = new THREE.Vector3();
      const onMove = (e: PointerEvent) => {
        const r = renderer.domElement.getBoundingClientRect();
        ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
        if (ray.ray.intersectPlane(plane, hit)) {
          st.tx = Math.max(-X + 0.5, Math.min(X - 0.5, hit.x));
          st.tz = Math.max(Z_BACK + 0.6, Math.min(Z_RACKET + 0.2, hit.z));
        }
      };
      const onDown = () => { st.swing = 1; };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerdown', onDown);

      let raf = 0;
      const tick = () => {
        // Paddle
        const px = st.x, pz = st.z;
        st.x += (st.tx - st.x) * 0.2; st.z += (st.tz - st.z) * 0.2;
        st.vx = st.x - px; st.vz = st.z - pz;
        st.swing *= 0.82;
        st.lift = st.swing * 0.35;
        racket.position.set(st.x, PY + st.lift, st.z);
        racket.rotation.set(-Math.PI / 2 - st.vz * 3.5, 0, -st.vx * 3.5 + 0.12);
        racket.rotation.order = 'YXZ';

        // Ball, tied to the middle of the paddle by its string
        b.vy -= 0.0034;
        // Falling, it is steered back over the paddle, so it always comes down on it
        b.vx += (st.x - b.x) * 0.0016; b.vz += (st.z - b.z) * 0.0016;
        b.vx *= 0.995; b.vz *= 0.995;
        b.x += b.vx; b.y += b.vy; b.z += b.vz;
        // The string: once taut it stops the ball and pulls it back
        const cx = st.x, cy = PY + st.lift, cz = st.z;
        let dx = b.x - cx, dy = b.y - cy, dz = b.z - cz;
        const dist = Math.hypot(dx, dy, dz);
        if (dist > LEN) {
          const nx = dx / dist, ny = dy / dist, nz = dz / dist;
          b.x = cx + nx * LEN; b.y = cy + ny * LEN; b.z = cz + nz * LEN;
          const out = b.vx * nx + b.vy * ny + b.vz * nz;
          if (out > 0) { b.vx -= 1.5 * out * nx; b.vy -= 1.5 * out * ny; b.vz -= 1.5 * out * nz; }
        }
        if (b.y > Y - BALL_R) { b.y = Y - BALL_R; b.vy = -Math.abs(b.vy) * 0.6; }
        // The floor, the walls: a ball that misses the paddle bounces off them, with a knock
        if (b.y < -Y + BALL_R) {
          b.y = -Y + BALL_R;
          if (b.vy < -0.02) { sound.play('hover', 60); squash = Math.max(squash, 0.7); }
          b.vy = Math.abs(b.vy) * 0.72; b.vx *= 0.92; b.vz *= 0.92;
        }
        if (b.x > X - BALL_R) { b.x = X - BALL_R; if (b.vx > 0.02) sound.play('hover', 90); b.vx = -Math.abs(b.vx) * 0.8; }
        if (b.x < -X + BALL_R) { b.x = -X + BALL_R; if (b.vx < -0.02) sound.play('hover', 90); b.vx = Math.abs(b.vx) * 0.8; }
        if (b.z < Z_BACK + BALL_R) { b.z = Z_BACK + BALL_R; b.vz = Math.abs(b.vz) * 0.8; }
        if (b.z > Z_RACKET + 0.4) { b.z = Z_RACKET + 0.4; b.vz = -Math.abs(b.vz) * 0.8; }
        // The paddle's face
        const top = PY + st.lift + 0.04;
        dx = b.x - st.x; dz = b.z - st.z;
        if (b.vy < 0 && b.y - BALL_R < top && b.y - BALL_R > top - 0.3) {
          b.y = top + BALL_R;
          b.vy = 0.105 + st.swing * 0.06 + Math.min(0.02, Math.hypot(st.vx, st.vz) * 0.2);
          b.vx = b.vx * 0.3 + dx * 0.05 + st.vx * 0.9;
          b.vz = b.vz * 0.3 + dz * 0.05 + st.vz * 0.9;
          hitKick = 1; squash = 1;
          sound.play('tap', 40);
        }
        hitKick *= 0.9;
        // Squash on a hit (flat and wide), then stretched along its flight (tall and narrow)
        squash *= 0.86;
        const stretch = Math.min(0.28, Math.abs(b.vy) * 1.9);
        const sy = (1 + stretch) * (1 - 0.42 * squash), sxz = 1 / Math.sqrt(1 + stretch) * (1 + 0.3 * squash);
        ballHolder.scale.set(sxz, sy, sxz);
        ballHolder.position.set(b.x, b.y - BALL_R * (1 - sy) * 0.9, b.z);
        ball.rotation.x += b.vz * 2 + b.vy * 0.3; ball.rotation.z -= b.vx * 2;
        const gp = cord.geometry.attributes.position as import('three').BufferAttribute;
        gp.setXYZ(0, st.x, PY + st.lift + 0.04, st.z); gp.setXYZ(1, b.x, b.y, b.z); gp.needsUpdate = true;

        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerdown', onDown);
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
    </div>
  );
}
