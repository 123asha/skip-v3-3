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
  const grain = useRef<HTMLDivElement>(null);
  // The grain: one tile of soft noise, made once
  useEffect(() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d')!, img = g.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (Math.random() + Math.random() + Math.random() - 1.5) * 120;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    if (grain.current) grain.current.style.backgroundImage = `url(${c.toDataURL()})`;
  }, []);

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
      // A filmic grade, as in a studio render: soft highlights, gentle contrast
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      el.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';

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

      // Warm key light from above, cool fill from the sky and a warm bounce from the floor
      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      scene.add(new THREE.HemisphereLight(0xeef2ff, 0xf3e6d6, 0.9));
      const sun = new THREE.DirectionalLight(0xfff1e2, 1.9);
      sun.position.set(-0.8, 6, 1.2);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.left = -X - 1; sun.shadow.camera.right = X + 1;
      sun.shadow.camera.top = 5; sun.shadow.camera.bottom = -5;
      sun.shadow.camera.near = 1; sun.shadow.camera.far = 14;
      sun.shadow.radius = 9; sun.shadow.bias = -0.0004;
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

      // «404», pressed into the back wall: a shade along the upper inner edges (the light
      // comes from above), a light catch along the lower ones, the floor of the letters a touch darker
      await document.fonts.ready;
      if (stop) { renderer.dispose(); renderer.domElement.remove(); return; }
      const wallTex = (() => {
        const W = 2048, H = Math.round(2048 * Y / X);
        const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return [c, c.getContext('2d')!] as const; };
        const cs = getComputedStyle(document.documentElement);
        const family = cs.getPropertyValue('--font-display').trim() || 'sans-serif';
        const weight = cs.getPropertyValue('--heading-weight').trim() || '450';
        const fs = Math.round(H * 0.46);
        // the letters as a mask
        const [mask, gm] = mk();
        gm.fillStyle = '#000'; gm.textAlign = 'center'; gm.textBaseline = 'middle';
        gm.font = `${weight} ${fs}px ${family}`;
        if ('letterSpacing' in gm) (gm as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${-Math.round(fs * 0.03)}px`;
        gm.fillText('404', W / 2, H * 0.42);
        // the wall around them (a sheet with letter-shaped holes)
        const [rim, gr] = mk();
        gr.fillStyle = '#000'; gr.fillRect(0, 0, W, H);
        gr.globalCompositeOperation = 'destination-out'; gr.drawImage(mask, 0, 0);
        // the rim's shadow (or light) thrown into the holes, kept inside the letters
        const inner = (color: string, dx: number, dy: number, blur: number) => {
          const [c, g] = mk();
          g.shadowColor = color; g.shadowBlur = blur; g.shadowOffsetX = dx + W; g.shadowOffsetY = dy;
          g.drawImage(rim, -W, 0);
          g.shadowColor = 'transparent';
          g.globalCompositeOperation = 'destination-in'; g.drawImage(mask, 0, 0);
          return c;
        };
        const [out, g] = mk();
        g.globalAlpha = 0.07; g.drawImage(mask, 0, 0); g.globalAlpha = 1;
        g.drawImage(inner('rgba(0,0,0,0.55)', 3, 14, 18), 0, 0);
        g.drawImage(inner('rgba(255,255,255,0.9)', -2, -7, 6), 0, 0);
        const t = new THREE.CanvasTexture(out); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
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

      // An Apple Magic Keyboard, lying flat, keys up: a thin rounded aluminium slab
      // with white keys in the real layout — the ball is batted with it
      const racket = new THREE.Group();
      const U = 0.138, GAP = 0.013, MARGIN = 0.055;         // key pitch, gap between keys, rim
      type K = { label: string; w: number; h?: number; dz?: number; small?: boolean };
      const k = (label: string, w = 1, small = false): K => ({ label, w, small });
      const ROWS: K[][] = [
        [k('esc', 1, true), ...Array.from({ length: 12 }, (_, i) => k(`F${i + 1}`, 1, true)), k('', 1)].map(x => ({ ...x, w: 14.5 / 14, h: 0.5 })),
        [k('`'), ...'1234567890-='.split('').map(c => k(c)), k('delete', 1.5, true)],
        [k('tab', 1.5, true), ...'QWERTYUIOP[]\\'.split('').map(c => k(c))],
        [k('caps lock', 1.75, true), ...'ASDFGHJKL;\''.split('').map(c => k(c)), k('return', 1.75, true)],
        [k('shift', 2.25, true), ...'ZXCVBNM,./'.split('').map(c => k(c)), k('shift', 2.25, true)],
        [k('fn', 1, true), k('control', 1, true), k('option', 1, true), k('command', 1.25, true), k('', 5), k('command', 1.25, true), k('option', 1, true),
          k('◀', 1), { label: '▲', w: 1, h: 0.5, dz: -0.25 }, k('▶', 1)],
      ];
      const KW = 14.5 * U + 2 * MARGIN, KD = 5.5 * U + 2 * MARGIN;
      const BASE_H = 0.045, KEY_H = 0.016, TOP_H = BASE_H + KEY_H;   // the key tops are where the ball is hit
      // The base: a rounded slab, extruded upwards
      const baseShape = new THREE.Shape();
      const cr = 0.07;
      baseShape.moveTo(-KW / 2 + cr, -KD / 2);
      baseShape.lineTo(KW / 2 - cr, -KD / 2); baseShape.quadraticCurveTo(KW / 2, -KD / 2, KW / 2, -KD / 2 + cr);
      baseShape.lineTo(KW / 2, KD / 2 - cr); baseShape.quadraticCurveTo(KW / 2, KD / 2, KW / 2 - cr, KD / 2);
      baseShape.lineTo(-KW / 2 + cr, KD / 2); baseShape.quadraticCurveTo(-KW / 2, KD / 2, -KW / 2, KD / 2 - cr);
      baseShape.lineTo(-KW / 2, -KD / 2 + cr); baseShape.quadraticCurveTo(-KW / 2, -KD / 2, -KW / 2 + cr, -KD / 2);
      const baseGeo = new THREE.ExtrudeGeometry(baseShape, { depth: BASE_H - 0.01, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.006, bevelSegments: 3, curveSegments: 12 });
      baseGeo.rotateX(-Math.PI / 2); baseGeo.translate(0, 0.005, 0);
      const alu = new THREE.MeshStandardMaterial({ color: 0xd9dadd, roughness: 0.42, metalness: 0.25 });
      const base = new THREE.Mesh(baseGeo, alu);
      racket.add(base);
      // Keys: their tops share one picture of the whole layout with the legends
      const keyTex = (() => {
        const PX = 140;                                  // canvas px per key unit
        const c = document.createElement('canvas'); c.width = Math.round(14.5 * PX); c.height = Math.round(5.5 * PX);
        const g = c.getContext('2d')!;
        g.fillStyle = '#f7f7f8'; g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = '#4a4a4c'; g.textBaseline = 'middle';
        let zy = 0;
        ROWS.forEach((row, ri) => {
          const rh = ri === 0 ? 0.5 : 1;
          let x = 0;
          row.forEach(key => {
            const kh = key.h ?? rh, ky = zy + (key.dz ?? 0) + (rh - kh) / 2 + (key.dz ? 0 : 0);
            if (key.label) {
              const small = key.small || key.label.length > 1;
              g.font = `${small ? 400 : 400} ${Math.round(PX * (small ? 0.17 : 0.3))}px -apple-system, "Helvetica Neue", Arial, sans-serif`;
              if (small) { g.textAlign = 'left'; g.fillText(key.label, x * PX + PX * 0.14, (ky + kh) * PX - PX * 0.18 * Math.min(1, kh * 1.6)); }
              else { g.textAlign = 'center'; g.fillText(key.label, (x + key.w / 2) * PX, (ky + kh / 2) * PX); }
              if (key.label === '▲') { g.textAlign = 'center'; g.fillText('▼', (x + key.w / 2) * PX, (ky + kh + 0.25) * PX); }
            }
            x += key.w;
          });
          zy += rh;
        });
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
        return t;
      })();
      const keyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: keyTex, roughness: 0.55 });
      const keySide = new THREE.MeshStandardMaterial({ color: 0xf1f1f3, roughness: 0.6 });
      type KeyMesh = { mesh: import('three').Mesh; x0: number; x1: number; z0: number; z1: number; press: number };
      const keys: KeyMesh[] = [];
      const ox = -14.5 * U / 2, oz = -5.5 * U / 2;
      const addKey = (x: number, z: number, w: number, d: number) => {
        // x, z, w, d in key units, from the back-left corner of the key area
        const geo = new THREE.BoxGeometry(w * U - GAP, KEY_H, d * U - GAP);
        // the top face (+y: vertices 8–11) shows its own patch of the layout picture
        const uv = geo.attributes.uv;
        const u0 = x / 14.5, u1 = (x + w) / 14.5, v0 = 1 - z / 5.5, v1 = 1 - (z + d) / 5.5;
        uv.setXY(8, u0, v1); uv.setXY(9, u1, v1); uv.setXY(10, u0, v0); uv.setXY(11, u1, v0);
        const mesh = new THREE.Mesh(geo, [keySide, keySide, keyMat, keySide, keySide, keySide]);
        const cx = ox + (x + w / 2) * U, cz = oz + (z + d / 2) * U;
        mesh.position.set(cx, BASE_H + KEY_H / 2, cz);
        racket.add(mesh);
        keys.push({ mesh, x0: cx - (w * U) / 2, x1: cx + (w * U) / 2, z0: cz - (d * U) / 2, z1: cz + (d * U) / 2, press: 0 });
      };
      {
        let zy = 0;
        ROWS.forEach((row, ri) => {
          const rh = ri === 0 ? 0.5 : 1;
          let x = 0;
          row.forEach(key => {
            const kh = key.h ?? rh;
            if (key.label === '▲') { addKey(x, zy, key.w, 0.5); addKey(x, zy + 0.5, key.w, 0.5); }
            else addKey(x, zy + (rh - kh) / 2, key.w, kh);
            x += key.w;
          });
          zy += rh;
        });
      }
      racket.traverse(o => { const m = o as import('three').Mesh; m.castShadow = true; m.receiveShadow = true; });
      // A key pressed where the ball lands
      const pressAt = (lx: number, lz: number) => {
        const key = keys.find(q => lx >= q.x0 && lx <= q.x1 && lz >= q.z0 && lz <= q.z1);
        if (key) key.press = 1;
      };
      scene.add(racket);
      // The string: from the middle of the keyboard to the ball
      const cord = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
        new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.7 }),
      );
      scene.add(cord);
      const LEN = 2.1;

      // Juggling: the keyboard lies flat, keys up, at the bottom of the room;
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
          st.tx = Math.max(-X + KW / 2 + 0.05, Math.min(X - KW / 2 - 0.05, hit.x));
          st.tz = Math.max(Z_BACK + KD / 2 + 0.1, Math.min(Z_RACKET, hit.z));
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
        racket.position.set(st.x, PY + st.lift - TOP_H, st.z);
        racket.rotation.set(st.vz * 2.5, 0, -st.vx * 2.5);
        keys.forEach(q => { q.press *= 0.82; q.mesh.position.y = BASE_H + KEY_H / 2 - q.press * 0.011; });

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
        const top = PY + st.lift;
        dx = b.x - st.x; dz = b.z - st.z;
        if (b.vy < 0 && b.y - BALL_R < top && b.y - BALL_R > top - 0.3) {
          b.y = top + BALL_R;
          b.vy = 0.105 + st.swing * 0.06 + Math.min(0.02, Math.hypot(st.vx, st.vz) * 0.2);
          b.vx = b.vx * 0.3 + dx * 0.05 + st.vx * 0.9;
          b.vz = b.vz * 0.3 + dz * 0.05 + st.vz * 0.9;
          hitKick = 1; squash = 1;
          pressAt(b.x - st.x, b.z - st.z);
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
        gp.setXYZ(0, st.x, PY + st.lift, st.z); gp.setXYZ(1, b.x, b.y, b.z); gp.needsUpdate = true;

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
      {/* Film grain and a soft vignette over the render */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 55%, rgba(40,30,20,0.16) 100%)',
      }} />
      <div aria-hidden="true" ref={grain} style={{
        position: 'absolute', inset: '-50%', pointerEvents: 'none', opacity: 0.32, mixBlendMode: 'overlay',
        animation: 'grain404 0.5s steps(5) infinite',
      }} />
      <style>{`@keyframes grain404{0%{transform:translate(0,0)}20%{transform:translate(-7%,4%)}40%{transform:translate(5%,-6%)}60%{transform:translate(-4%,-3%)}80%{transform:translate(6%,5%)}100%{transform:translate(0,0)}}`}</style>
    </div>
  );
}
