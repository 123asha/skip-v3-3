import { useEffect, useRef } from 'react';
import { sound } from '../sound/Sound';
import svgPaths from '../../imports/Index/svg-3bjnx36a2y';

// 404 alternative (localhost only): a minimalist table-tennis paddle in real 3D (three.js)
// and a ball in a bare room. The racket follows the pointer on its own plane,
// tilting with its motion; the ball flies back and forth between the racket,
// the walls, the floor and the ceiling.
const BG = 0xd6edf6;   // the sky at the horizon
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
      // A filmic grade, as in a studio render: soft highlights, gentle contrast
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      el.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 220);
      camera.position.set(0, 1.5, 6.8);
      camera.lookAt(0, -0.45, -0.4);
      const resize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener('resize', resize);

      // A desk by a window (after the reference photo): a white desktop, a pale fabric
      // wall, a window with blinds the sun comes through in stripes, and a few things
      // on the desk. The game is played on the desktop.
      scene.background = new THREE.Color(0xe9e7e3);
      scene.add(new THREE.AmbientLight(0xffffff, 0.45));
      scene.add(new THREE.HemisphereLight(0xffffff, 0xe8e2d8, 0.55));
      const sun = new THREE.DirectionalLight(0xfff6ec, 1.1);
      // Almost straight overhead: shadows lie right under what casts them
      sun.position.set(-0.25, 8, 0.35);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.left = -7; sun.shadow.camera.right = 7;
      sun.shadow.camera.top = 7; sun.shadow.camera.bottom = -7;
      sun.shadow.camera.near = 1; sun.shadow.camera.far = 16;
      sun.shadow.radius = 9; sun.shadow.bias = -0.0004;
      scene.add(sun);
      // Sunlight through the blinds: a warm spot from the window side carrying a striped picture
      const blindsCookie = (() => {
        const c = document.createElement('canvas'); c.width = c.height = 512;
        const g = c.getContext('2d')!;
        g.fillStyle = '#000'; g.fillRect(0, 0, 512, 512);
        g.filter = 'blur(3px)';
        g.fillStyle = '#fff';
        for (let y = 0; y < 512; y += 26) g.fillRect(0, y + 2, 512, 22);   // open blinds: wide bands of sun, thin slat shadows
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
        return t;
      })();
      const stripes = new THREE.SpotLight(0xfff0d8, 11, 0, 0.42, 0.35, 0);
      stripes.position.set(7.5, 5.5, -6.5);
      stripes.target.position.set(-1.2, -Y, 0.6);
      stripes.map = blindsCookie;
      stripes.castShadow = true;
      stripes.shadow.mapSize.set(1024, 1024);
      stripes.shadow.bias = -0.0008;
      stripes.shadow.radius = 4;
      scene.add(stripes, stripes.target);

      const shade = (m: import('three').Object3D) => { m.traverse(o => { const q = o as import('three').Mesh; if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); return m; };
      const mat = (color: number, roughness = 0.6, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
      const fy = -Y;                                            // the desktop's surface
      // The desk
      const desk = new THREE.Mesh(new THREE.BoxGeometry(18, 0.1, 12), mat(0xf4f3f0, 0.5));
      desk.position.set(0, fy - 0.05, 0.6);
      desk.receiveShadow = true;
      scene.add(desk);
      // The wall: a pale, finely textured fabric
      const fabric = (() => {
        const c = document.createElement('canvas'); c.width = c.height = 128;
        const g = c.getContext('2d')!;
        g.fillStyle = '#dcdad5'; g.fillRect(0, 0, 128, 128);
        for (let y = 0; y < 128; y += 4) for (let x = 0; x < 128; x += 4) {
          const v = 205 + Math.floor(Math.random() * 30);
          g.fillStyle = `rgb(${v},${v - 2},${v - 6})`; g.fillRect(x + ((y / 4) % 2) * 2, y, 3, 3);
        }
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60, 30);
        return t;
      })();
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, map: fabric, roughness: 0.95 }));
      wall.position.set(0, fy + 5, Z_BACK - 0.02);
      wall.receiveShadow = true;
      scene.add(wall);
      // The window on the right: bright daylight behind white blinds
      {
        const wx0 = 1.9, wx1 = 9, wy0 = fy + 0.35, wy1 = fy + 9;
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(wx1 - wx0, wy1 - wy0), new THREE.MeshBasicMaterial({ color: 0xfbfaf6 }));
        glow.position.set((wx0 + wx1) / 2, (wy0 + wy1) / 2, Z_BACK - 0.01);
        scene.add(glow);
        const slatMat = mat(0xeeeeec, 0.45);
        const slatGeo = new THREE.BoxGeometry(wx1 - wx0, 0.012, 0.07);
        for (let y = wy0 + 0.04; y < wy1; y += 0.105) {
          const sl = new THREE.Mesh(slatGeo, slatMat);
          sl.position.set((wx0 + wx1) / 2, y, Z_BACK + 0.05);
          sl.rotation.x = -1.35;   // open: the slats turned almost edge-on
          sl.receiveShadow = true;
          scene.add(sl);
        }
        // the window frame's inner edge
        const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.05, wy1 - wy0, 0.16), mat(0xe2e0dc, 0.6));
        jamb.position.set(wx0 - 0.025, (wy0 + wy1) / 2, Z_BACK + 0.06);
        scene.add(shade(jamb));
      }
      // Things on the desk, after the reference photos
      const V2 = (x: number, y: number) => new THREE.Vector2(x, y);
      // a thin rod between two points
      const rod = (a: import('three').Vector3, b: import('three').Vector3, r: number, m: import('three').Material) => {
        const d = b.clone().sub(a), len = d.length();
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), m);
        mesh.position.copy(a).addScaledVector(d, 0.5);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
        return mesh;
      };
      const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        draw(c.getContext('2d')!);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
        return t;
      };
      const V3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
      // — a felt desk mat under the keyboard
      {
        const sh = new THREE.Shape(); const w = 6.4, d = 3.4, r = 0.18;
        sh.moveTo(-w / 2 + r, -d / 2); sh.lineTo(w / 2 - r, -d / 2); sh.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
        sh.lineTo(w / 2, d / 2 - r); sh.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2); sh.lineTo(-w / 2 + r, d / 2);
        sh.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r); sh.lineTo(-w / 2, -d / 2 + r); sh.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
        const g = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: false, curveSegments: 12 });
        g.rotateX(-Math.PI / 2);
        const felt = canvasTex(128, 128, g2 => { g2.fillStyle = '#cfcecb'; g2.fillRect(0, 0, 128, 128); for (let i = 0; i < 2500; i++) { const v = 190 + Math.random() * 30; g2.fillStyle = `rgba(${v},${v},${v - 3},0.5)`; g2.fillRect(Math.random() * 128, Math.random() * 128, 1, 1); } });
        felt.wrapS = felt.wrapT = THREE.RepeatWrapping; felt.repeat.set(2, 2);
        const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xffffff, map: felt, roughness: 1 }));
        mesh.position.set(0.3, fy + 0.001, -0.9);
        mesh.receiveShadow = true;
        scene.add(mesh);
      }
      // — an Artemide Tolomeo: heavy round base, polished arms with tension wires, black knobs, a truncated-cone shade
      {
        const alu = mat(0xd9dbde, 0.16, 1.0), black = mat(0x151515, 0.45), wire = mat(0x2a2a2a, 0.4);
        const lamp = new THREE.Group();
        lamp.add(new THREE.Mesh(new THREE.LatheGeometry([V2(0, 0), V2(0.42, 0), V2(0.44, 0.012), V2(0.43, 0.03), V2(0.12, 0.045), V2(0.05, 0.08), V2(0.035, 0.16), V2(0, 0.16)], 64), alu));
        const p0 = V3(0, 0.16, 0), p1 = V3(0.18, 2.25, 0), p2 = V3(2.35, 2.95, 0.25);
        lamp.add(rod(p0, p1, 0.016, alu), rod(p1, p2, 0.014, alu));
        // tension wires and springs alongside the arms
        lamp.add(rod(V3(-0.045, 0.5, 0), V3(0.12, 2.1, 0), 0.004, wire), rod(V3(0.25, 2.33, 0), V3(2.2, 2.98, 0.24), 0.004, wire));
        lamp.add(rod(V3(-0.04, 0.55, 0), V3(-0.02, 0.95, 0), 0.018, alu));
        const knob = (p: import('three').Vector3) => { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 24), black); k.rotation.x = Math.PI / 2; k.position.copy(p).add(V3(0, 0, 0.05)); return k; };
        lamp.add(knob(p1), knob(V3(0.02, 0.35, 0)));
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 24), alu); hub.rotation.x = Math.PI / 2; hub.position.copy(p1); lamp.add(hub);
        // the head: a short cylinder housing on the arm's end, the shade hanging from it
        const head = new THREE.Group();
        const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 32), alu);
        housing.rotation.z = Math.PI / 2 - 0.3;
        const hk = knob(V3(0, 0, 0)); hk.position.set(0.02, 0.04, 0.12);
        const shadeG = new THREE.LatheGeometry([V2(0.09, 0.2), V2(0.11, 0.18), V2(0.13, 0.1), V2(0.3, -0.18), V2(0.33, -0.21), V2(0.325, -0.215)], 64);
        const shadeM = new THREE.Mesh(shadeG, new THREE.MeshStandardMaterial({ color: 0xcfd1d4, roughness: 0.28, metalness: 0.9, side: THREE.DoubleSide }));
        shadeM.position.set(0.22, -0.18, 0); shadeM.rotation.z = 0.42;
        const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 32), alu); capTop.position.set(0.14, 0.02, 0); capTop.rotation.z = 0.42;
        // a white Artemide tag hanging off it
        const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.34), new THREE.MeshStandardMaterial({ roughness: 0.7, side: THREE.DoubleSide, map: canvasTex(64, 220, g => {
          g.fillStyle = '#f7f7f5'; g.beginPath(); g.roundRect(0, 0, 64, 220, 30); g.fill();
          g.save(); g.translate(40, 110); g.rotate(-Math.PI / 2); g.fillStyle = '#222'; g.font = 'italic 600 26px Georgia, serif'; g.textAlign = 'center'; g.fillText('Artemide', 0, 0); g.restore();
        }), transparent: true }));
        tag.position.set(-0.02, -0.32, 0.1); tag.rotation.y = -0.4;
        head.add(housing, hk, shadeM, capTop, tag);
        head.position.copy(p2);
        lamp.add(head);
        lamp.position.set(-4.5, fy, -3.35);
        scene.add(shade(lamp));
      }
      // — a small orange leather mushroom lamp with stitched seams
      {
        const leather = new THREE.MeshStandardMaterial({ color: 0xd9542c, roughness: 0.82, map: canvasTex(128, 128, g => { g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128); for (let i = 0; i < 3000; i++) { const v = 225 + Math.random() * 30; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * 128, Math.random() * 128, 1.5, 1.5); } }) });
        const g = new THREE.Group();
        g.add(new THREE.Mesh(new THREE.LatheGeometry([V2(0, 0), V2(0.12, 0), V2(0.125, 0.01), V2(0.115, 0.6), V2(0, 0.6)], 48), leather));
        g.add(new THREE.Mesh(new THREE.LatheGeometry([V2(0, 0.58), V2(0.3, 0.58), V2(0.335, 0.6), V2(0.345, 0.64), V2(0.345, 0.82), V2(0.335, 0.86), V2(0.29, 0.885), V2(0.15, 0.9), V2(0, 0.9)], 64), leather));
        const seam = mat(0xb5401f, 0.8);
        for (const y of [0.625, 0.835]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.347, 0.0035, 6, 96), seam); t.rotation.x = Math.PI / 2; t.position.y = y; g.add(t); }
        const screw = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), mat(0xcfcfcf, 0.2, 1)); screw.position.set(0, 0.32, 0.118); g.add(screw);
        g.position.set(2.15, fy, -3.0);
        scene.add(shade(g));
      }
      // — a Vitra toolbox in orange with pencils, a ball vase, a notes cube, a mug and a closed laptop
      {
        const orange = mat(0xe8541f, 0.42);
        const box = new THREE.Group();
        const L = 1.3, Wd = 0.55, Hh = 0.36, t = 0.02;
        const part = (w: number, h: number, d: number, x: number, y: number, z: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), orange); m.position.set(x, y, z); box.add(m); };
        part(L, t, Wd, 0, t / 2, 0); part(L, Hh, t, 0, Hh / 2, Wd / 2); part(L, Hh, t, 0, Hh / 2, -Wd / 2); part(t, Hh, Wd, L / 2, Hh / 2, 0); part(t, Hh, Wd, -L / 2, Hh / 2, 0);
        // the middle wall with its handle hole
        const mid = new THREE.Shape(); mid.moveTo(-L / 2, 0); mid.lineTo(L / 2, 0); mid.lineTo(L / 2, Hh); mid.lineTo(0.28, Hh); mid.quadraticCurveTo(0.22, Hh + 0.2, 0, Hh + 0.2); mid.quadraticCurveTo(-0.22, Hh + 0.2, -0.28, Hh); mid.lineTo(-L / 2, Hh); mid.lineTo(-L / 2, 0);
        const hole = new THREE.Path(); hole.moveTo(-0.16, Hh + 0.02); hole.lineTo(0.16, Hh + 0.02); hole.quadraticCurveTo(0.18, Hh + 0.13, 0, Hh + 0.13); hole.quadraticCurveTo(-0.18, Hh + 0.13, -0.16, Hh + 0.02);
        mid.holes.push(hole);
        const midG = new THREE.ExtrudeGeometry(mid, { depth: t, bevelEnabled: false, curveSegments: 16 }); midG.translate(0, 0, -t / 2);
        box.add(new THREE.Mesh(midG, orange));
        [[-0.45, 0.12, 0x1a1a1a, 0.1], [-0.38, 0.08, 0xf2f2f0, -0.08], [-0.3, 0.14, 0x333333, 0.15], [-0.42, -0.12, 0x2b2b2b, -0.05]].forEach(([x, z, c, tl]) => {
          box.add(rod(V3(x, 0.02, z), V3(x + tl, 0.62, z), 0.014, mat(c, 0.5)));
        });
        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 20), mat(0xf4f4f2, 0.4)); bottle.position.set(0.4, 0.21, -0.12); box.add(bottle);
        box.position.set(-3.1, fy, -2.85); box.rotation.y = 0.18;
        scene.add(shade(box));

        const vase = new THREE.Mesh(new THREE.SphereGeometry(0.42, 48, 32), mat(0xbaad9d, 0.92));
        vase.position.set(-5.3, fy + 0.4, -1.7);
        scene.add(shade(vase));
        [[0.05, 0.12, 0xf4f4f2], [-0.08, -0.05, 0x1f1f1f], [0.1, -0.1, 0x3a3a3a]].forEach(([dx, tl, c]) => {
          scene.add(shade(rod(V3(-5.3 + dx, fy + 0.5, -1.7), V3(-5.3 + dx + tl, fy + 1.45, -1.7), 0.018, mat(c, 0.5))));
          const tip = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.08, 12), mat(0xd9b98a, 0.7));
          tip.position.set(-5.3 + dx + tl * 1.04, fy + 1.49, -1.7); tip.rotation.z = -Math.atan2(tl, 0.95);
          scene.add(tip);
        });

        const cube = new THREE.Group();
        const label = canvasTex(512, 300, g => {
          g.fillStyle = '#5e6064'; g.fillRect(0, 0, 512, 300);
          g.fillStyle = '#f2f2f2'; g.font = 'italic 64px "Snell Roundhand", "Brush Script MT", cursive'; g.textAlign = 'center'; g.fillText('Posting Notes', 256, 170);
        });
        const grey = mat(0x5e6064, 0.6);
        const cb = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 0.62), [grey, grey, grey, grey, new THREE.MeshStandardMaterial({ map: label, roughness: 0.6 }), grey]);
        cb.position.y = 0.21;
        const paper = new THREE.Mesh(new THREE.BoxGeometry(0.69, 0.07, 0.56), mat(0xfbfbfb, 0.9)); paper.position.y = 0.45;
        cube.add(cb, paper);
        cube.position.set(-4.75, fy, -2.25); cube.rotation.y = 0.3;
        scene.add(shade(cube));

        const mug = new THREE.Group();
        const porcelain = mat(0xf6f6f4, 0.35);
        mug.add(new THREE.Mesh(new THREE.LatheGeometry([V2(0, 0), V2(0.17, 0), V2(0.18, 0.02), V2(0.18, 0.4), V2(0.165, 0.4), V2(0.165, 0.05), V2(0, 0.05)], 48), porcelain));
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 16), porcelain); stick.rotation.z = Math.PI / 2; stick.position.set(0.27, 0.22, 0);
        const ballH = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 16), porcelain); ballH.position.set(0.39, 0.22, 0);
        mug.add(stick, ballH);
        mug.position.set(3.3, fy, -0.4); mug.rotation.y = 0.5;
        scene.add(shade(mug));


        const laptop = new THREE.Mesh(new THREE.RoundedBoxGeometry(2.6, 0.1, 1.8, 4, 0.04), mat(0xc8cacd, 0.3, 0.85));
        laptop.position.set(-4.6, fy + 0.05, 1.1); laptop.rotation.y = 0.12;
        scene.add(shade(laptop));
      }
      // An iMac (24", silver) at the back of the desk, «404» on its screen
      await document.fonts.ready;
      if (stop) { renderer.dispose(); renderer.domElement.remove(); return; }
      {
        const W = 2.6, H = 1.95, D = 0.05, BEZ_H = 1.52;
        const silver = new THREE.MeshStandardMaterial({ color: 0xc8cbcf, roughness: 0.3, metalness: 0.75 });
        const mac = new THREE.Group();
        const shell = new THREE.Mesh(new THREE.RoundedBoxGeometry(W, H, D, 4, 0.045), silver);
        mac.add(shell);
        // the white bezel and the screen over the upper part of the front; the silver chin shows below
        const bezel = new THREE.Mesh(new THREE.RoundedBoxGeometry(W - 0.004, BEZ_H, 0.006, 3, 0.04), new THREE.MeshStandardMaterial({ color: 0xf3f3f1, roughness: 0.4 }));
        bezel.position.set(0, H / 2 - BEZ_H / 2 - 0.002, D / 2);
        mac.add(bezel);
        const screenTex = (() => {
          const c = document.createElement('canvas'); c.width = 1600; c.height = 900;
          const g = c.getContext('2d')!;
          const bg = g.createLinearGradient(0, 0, 1600, 900);
          bg.addColorStop(0, '#fbf1ea'); bg.addColorStop(1, '#f6e4d9');
          g.fillStyle = bg; g.fillRect(0, 0, 1600, 900);
          const cs = getComputedStyle(document.documentElement);
          const family = cs.getPropertyValue('--font-display').trim() || 'sans-serif';
          const weight = cs.getPropertyValue('--heading-weight').trim() || '450';
          g.fillStyle = '#1b1b1b'; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.font = `${weight} 300px ${family}`;
          if ('letterSpacing' in g) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '-9px';
          g.fillText('404', 800, 430);
          g.font = `400 34px ${family}`;
          if ('letterSpacing' in g) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px';
          g.fillStyle = '#7a7470';
          g.fillText('Страница не найдена', 800, 640);
          // the camera dot in the bezel is drawn by its own mesh
          const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
          return t;
        })();
        const SW = W - 0.16, SH = SW * 9 / 16;
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
        screen.position.set(0, H / 2 - BEZ_H / 2 - 0.002 + 0.01, D / 2 + 0.0045);
        mac.add(screen);
        const cam = new THREE.Mesh(new THREE.CircleGeometry(0.008, 16), new THREE.MeshBasicMaterial({ color: 0x222222 }));
        cam.position.set(0, H / 2 - 0.035, D / 2 + 0.0045);
        mac.add(cam);
        // the stand: one bent aluminium plate — a leaning upright and a flat foot
        const up = new THREE.Mesh(new THREE.RoundedBoxGeometry(0.5, 0.95, 0.025, 2, 0.01), silver);
        up.position.set(0, -H / 2 + 0.25, -0.2); up.rotation.x = -0.32;
        const foot = new THREE.Mesh(new THREE.RoundedBoxGeometry(0.5, 0.025, 0.62, 2, 0.01), silver);
        foot.position.set(0, -H / 2 - 0.62, -0.33);
        mac.add(up, foot);
        mac.position.set(0, fy + 0.635 + H / 2, -3.15);
        mac.traverse(o => { const m = o as import('three').Mesh; if (m.isMesh && m !== screen && m !== cam) { m.castShadow = true; m.receiveShadow = true; } });
        scene.add(mac);
      }

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
      // A contact shadow on the ground right under the ball: small and dark as it lands, wide and faint as it rises
      const blob = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          transparent: true, depthWrite: false, toneMapped: false, color: 0x000000,
          alphaMap: (() => {
            const c = document.createElement('canvas'); c.width = c.height = 128;
            const g = c.getContext('2d')!, gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
            gr.addColorStop(0, '#fff'); gr.addColorStop(0.45, '#888'); gr.addColorStop(1, '#000');
            g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
            return new THREE.CanvasTexture(c);
          })(),
        }),
      );
      blob.rotation.x = -Math.PI / 2;
      scene.add(blob);

      // A low-profile mechanical keyboard (after the reference), lying flat, keys up —
      // the ball is batted with it. A light grey case with a thin rim around a dark
      // plate; two-tier keycaps (a wide skirt, a smaller soft top) in pale grey with
      // grey legends, and an orange esc. A soft studio environment for reflections.
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.5;
      const racket = new THREE.Group();
      const COLS = 15, ROWN = 6;
      const U = 0.136, GAP = 0.008, MARGIN = 0.05;
      type K = { a?: string; b?: string; w: number; accent?: boolean; big?: boolean };
      const key = (a: string, w = 1, b?: string, big = false): K => ({ a, b, w, big });
      const ROWS: K[][] = [
        [{ a: 'esc', w: 1.5, accent: true }, ...Array.from({ length: 12 }, (_, i) => key(`F${i + 1}`)), key('del', 1.5)],
        [key('`', 1, '~'), ...['1!', '2@', '3#', '4$', '5%', '6^', '7&', '8*', '9(', '0)', '-_', '=+'].map(p => key(p[0], 1, p[1])), key('delete', 2)],
        [key('tab', 1.5), ...'QWERTYUIOP'.split('').map(c => key(c, 1, undefined, true)), key('[', 1, '{'), key(']', 1, '}'), key('\\', 1.5, '|')],
        [key('caps', 1.75), ...'ASDFGHJKL'.split('').map(c => key(c, 1, undefined, true)), key(';', 1, ':'), key('\'', 1, '"'), key('enter', 2.25)],
        [key('shift', 2.25), ...'ZXCVBNM'.split('').map(c => key(c, 1, undefined, true)), key(',', 1, '<'), key('.', 1, '>'), key('/', 1, '?'), key('shift', 1.75), key('↑')],
        [key('ctrl', 1.25), key('cmd', 1.25, 'win'), key('alt', 1.25), key('', 6.25), key('alt'), key('fn'), key('←'), key('↓'), key('→')],
      ];
      const KW = COLS * U + 2 * MARGIN, KD = ROWN * U + 2 * MARGIN;
      const CASE_H = 0.07, PLATE_Y = 0.05, SKIRT_H = 0.03, CAP_H = 0.012;
      const TOP_H = PLATE_Y + SKIRT_H + CAP_H;               // the key tops, where the ball is hit
      const roundRect = (w: number, d: number, r: number) => {
        const sh = new THREE.Shape();
        sh.moveTo(-w / 2 + r, -d / 2);
        sh.lineTo(w / 2 - r, -d / 2); sh.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
        sh.lineTo(w / 2, d / 2 - r); sh.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
        sh.lineTo(-w / 2 + r, d / 2); sh.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
        sh.lineTo(-w / 2, -d / 2 + r); sh.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
        return sh;
      };
      // The case: a rounded slab with the key well cut out of its top
      const caseShape = roundRect(KW, KD, 0.06);
      const well = roundRect(KW - 2 * MARGIN + 0.01, KD - 2 * MARGIN + 0.01, 0.012);
      const rim = roundRect(KW, KD, 0.06); rim.holes.push(well);
      const caseMat = new THREE.MeshStandardMaterial({ color: 0xdadad7, roughness: 0.55, metalness: 0.15 });
      const slab = (sh: import('three').Shape, depth: number, y: number, mat: import('three').Material) => {
        const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 3, curveSegments: 16 });
        g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
        return new THREE.Mesh(g, mat);
      };
      racket.add(slab(caseShape, PLATE_Y - 0.008, 0.004, caseMat));        // body up to the plate
      racket.add(slab(rim, CASE_H - PLATE_Y, PLATE_Y - 0.004, caseMat));   // the rim around the well
      const plate = new THREE.Mesh(new THREE.ShapeGeometry(well), new THREE.MeshStandardMaterial({ color: 0x2a2a2b, roughness: 0.8 }));
      plate.rotation.x = -Math.PI / 2; plate.position.y = PLATE_Y + 0.001;
      racket.add(plate);
      // A tiny orange switch on the back edge, as in the reference
      const sw = new THREE.Mesh(new THREE.RoundedBoxGeometry(0.06, 0.018, 0.025, 2, 0.006), new THREE.MeshStandardMaterial({ color: 0xd9481f, roughness: 0.5 }));
      sw.position.set(-KW / 2 + 0.3, CASE_H - 0.004, -KD / 2 - 0.004);
      racket.add(sw);
      // Legends: one transparent picture of the layout; each key top shows its own patch
      const PX = 160;
      const legendTex = (() => {
        const c = document.createElement('canvas'); c.width = COLS * PX; c.height = ROWN * PX;
        const g = c.getContext('2d')!;
        const font = (sz: number) => `400 ${Math.round(PX * sz)}px -apple-system, "SF Pro Text", "Helvetica Neue", Arial, sans-serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        ROWS.forEach((row, ri) => {
          let x = 0;
          row.forEach(k => {
            const cx = (x + k.w / 2) * PX, cy = (ri + 0.5) * PX;
            g.fillStyle = k.accent ? '#ffffff' : '#68686a';
            if (k.b !== undefined && k.a) {
              const two = k.a.length > 1 || k.b.length > 1;
              g.font = font(two ? 0.13 : 0.15);
              g.fillText(k.a, cx, cy - PX * 0.11); g.fillText(k.b, cx, cy + PX * 0.12);
            } else if (k.a) {
              g.font = font(k.big ? 0.17 : 0.14);
              g.fillText(k.a, cx, cy - PX * 0.02);
            }
            x += k.w;
          });
        });
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
        return t;
      })();
      const skirtMat = new THREE.MeshStandardMaterial({ color: 0xe2e2e0, roughness: 0.62 });
      const topMat = new THREE.MeshStandardMaterial({ color: 0xebebe9, roughness: 0.58 });
      const skirtAccent = new THREE.MeshStandardMaterial({ color: 0xc8401c, roughness: 0.55 });
      const topAccent = new THREE.MeshStandardMaterial({ color: 0xd9481f, roughness: 0.5 });
      const legendMat = new THREE.MeshBasicMaterial({ map: legendTex, transparent: true, depthWrite: false });
      type KeyMesh = {
        body: import('three').Object3D; x0: number; x1: number; z0: number; z1: number; press: number; y0: number;
        // knocked off: flying, lying on the desk, or flying home
        state: 'on' | 'fly' | 'rest' | 'back'; v: import('three').Vector3; w: import('three').Vector3; t: number;
        from?: { p: import('three').Vector3; q: import('three').Quaternion };
      };
      const keys: KeyMesh[] = [];
      const ox = -COLS * U / 2, oz = -ROWN * U / 2;
      ROWS.forEach((row, ri) => {
        let x = 0;
        row.forEach(k => {
          const kw = k.w * U - GAP, kd = U - GAP;
          const body = new THREE.Group();
          // the skirt: the keycap's wide lower part
          const skirt = new THREE.Mesh(new THREE.RoundedBoxGeometry(kw, SKIRT_H, kd, 3, 0.012), k.accent ? skirtAccent : skirtMat);
          skirt.position.y = SKIRT_H / 2;
          // the top: smaller, soft, nudged a touch towards the back like a sculpted cap
          const inset = U * 0.13;
          const tw = kw - 2 * inset, td = kd - 2 * inset;
          const top = new THREE.Mesh(new THREE.RoundedBoxGeometry(tw, CAP_H * 2, td, 4, 0.016), k.accent ? topAccent : topMat);
          top.position.set(0, SKIRT_H, -U * 0.025);
          body.add(skirt, top);
          // the legend, on the top's face
          const lg = new THREE.PlaneGeometry(tw, td);
          lg.rotateX(-Math.PI / 2);
          const uv = lg.attributes.uv;
          const cx0 = x + k.w / 2, half = (tw / U) / 2, halfD = (td / U) / 2;
          const u0 = (cx0 - half) / COLS, u1 = (cx0 + half) / COLS;
          const v0 = 1 - (ri + 0.5 - halfD) / ROWN, v1 = 1 - (ri + 0.5 + halfD) / ROWN;
          uv.setXY(0, u0, v0); uv.setXY(1, u1, v0); uv.setXY(2, u0, v1); uv.setXY(3, u1, v1);
          const legend = new THREE.Mesh(lg, legendMat);
          legend.position.set(0, SKIRT_H + CAP_H + 0.0008, -U * 0.025);
          body.add(legend);
          const cx = ox + (x + k.w / 2) * U, cz = oz + (ri + 0.5) * U;
          body.position.set(cx, PLATE_Y, cz);
          racket.add(body);
          keys.push({ body, x0: cx - (k.w * U) / 2, x1: cx + (k.w * U) / 2, z0: cz - U / 2, z1: cz + U / 2, press: 0, y0: PLATE_Y,
            state: 'on', v: new THREE.Vector3(), w: new THREE.Vector3(), t: 0 });
          x += k.w;
        });
      });
      racket.traverse(o => { const m = o as import('three').Mesh; if (m.isMesh && m.material !== legendMat) { m.castShadow = true; m.receiveShadow = true; } });
      // Where the ball lands, the key is knocked clean off (and a neighbour or two
      // now and then): it flies up, tumbles, lands on the desk, and a few seconds
      // later flies back into its place
      const pressAt = (lx: number, lz: number, power: number) => {
        const hit = keys.filter(q => q.state === 'on' && lx >= q.x0 - U * 0.6 && lx <= q.x1 + U * 0.6 && lz >= q.z0 - U * 0.6 && lz <= q.z1 + U * 0.6);
        hit.sort((a, b) => Math.hypot((a.x0 + a.x1) / 2 - lx, (a.z0 + a.z1) / 2 - lz) - Math.hypot((b.x0 + b.x1) / 2 - lx, (b.z0 + b.z1) / 2 - lz));
        hit.slice(0, 1 + (Math.random() < 0.35 ? 1 : 0) + (power > 0.5 ? 1 : 0)).forEach((q, i) => {
          scene.attach(q.body);                              // keeps where it is, now loose in the room
          q.state = 'fly'; q.t = 0;
          const kx = (q.x0 + q.x1) / 2 - lx, kz = (q.z0 + q.z1) / 2 - lz;
          q.v.set(kx * 0.12 + (Math.random() - 0.5) * 0.03, 0.05 + Math.random() * 0.03 + power * 0.03 - i * 0.01, kz * 0.12 + (Math.random() - 0.5) * 0.03 + 0.01);
          q.w.set((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.5);
        });
      };
      const tmpP = new THREE.Vector3(), tmpQ = new THREE.Quaternion();
      const flyKeys = () => {
        for (const q of keys) {
          const o = q.body;
          if (q.state === 'fly') {
            q.v.y -= 0.0034;
            o.position.add(q.v);
            o.rotation.x += q.w.x; o.rotation.y += q.w.y; o.rotation.z += q.w.z;
            const floorY = fy + 0.004;
            if (o.position.y < floorY) {
              o.position.y = floorY;
              if (q.v.y < -0.015) sound.play('hover', 140);
              q.v.y = Math.abs(q.v.y) * 0.32; q.v.x *= 0.6; q.v.z *= 0.6; q.w.multiplyScalar(0.5);
              if (q.v.y < 0.01) { q.state = 'rest'; q.t = 0; }
            }
          } else if (q.state === 'rest') {
            // settles flat (right side up or upside down, whichever is nearer)
            const flat = (a: number) => Math.round(a / Math.PI) * Math.PI;
            o.rotation.x += (flat(o.rotation.x) - o.rotation.x) * 0.2;
            o.rotation.z += (flat(o.rotation.z) - o.rotation.z) * 0.2;
            o.position.y = fy + (Math.abs(Math.cos(o.rotation.x) * Math.cos(o.rotation.z)) > 0.5 && Math.cos(o.rotation.x) * Math.cos(o.rotation.z) < 0 ? SKIRT_H + CAP_H : 0.004);
            if (++q.t > 60 * 5) { q.state = 'back'; q.t = 0; q.from = { p: o.position.clone(), q: o.quaternion.clone() }; }
          } else if (q.state === 'back' && q.from) {
            // home: its place on the keyboard, wherever the keyboard is now
            q.t = Math.min(1, q.t + 1 / 40);
            const e = q.t < 0.5 ? 2 * q.t * q.t : 1 - (-2 * q.t + 2) ** 2 / 2;
            tmpP.set((q.x0 + q.x1) / 2, q.y0, (q.z0 + q.z1) / 2);
            racket.updateMatrixWorld(); racket.localToWorld(tmpP);
            racket.getWorldQuaternion(tmpQ);
            o.position.lerpVectors(q.from.p, tmpP, e);
            o.position.y += Math.sin(e * Math.PI) * 0.6;
            o.quaternion.slerpQuaternions(q.from.q, tmpQ, e);
            if (q.t >= 1) {
              racket.add(o);
              o.position.set((q.x0 + q.x1) / 2, q.y0, (q.z0 + q.z1) / 2); o.rotation.set(0, 0, 0);
              q.state = 'on'; q.press = 1;
              sound.play('tap', 30);
            }
          }
        }
      };
      scene.add(racket);
      // The string: from the middle of the keyboard to the ball
      const cord = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
        new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.7 }),
      );
      cord.visible = false;   // the ball is still tied on, but the string isn't shown
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
      // The camera drifts a touch after the pointer (a parallax, very slight)
      const look = { x: 0, y: 0, tx: 0, ty: 0 };
      const onMove = (e: PointerEvent) => {
        const r = renderer.domElement.getBoundingClientRect();
        look.tx = ((e.clientX - r.left) / r.width) * 2 - 1; look.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
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
        look.x += (look.tx - look.x) * 0.04; look.y += (look.ty - look.y) * 0.04;
        camera.position.set(look.x * 0.28, 1.5 - look.y * 0.12, 6.8);
        camera.lookAt(0, -0.45, -0.4);
        // Paddle
        const px = st.x, pz = st.z;
        st.x += (st.tx - st.x) * 0.2; st.z += (st.tz - st.z) * 0.2;
        st.vx = st.x - px; st.vz = st.z - pz;
        st.swing *= 0.82;
        st.lift = st.swing * 0.35;
        racket.position.set(st.x, PY + st.lift - TOP_H, st.z);
        racket.rotation.set(st.vz * 2.5, 0, -st.vx * 2.5);
        keys.forEach(q => { if (q.state !== 'on') return; q.press *= 0.82; q.body.position.y = q.y0 - q.press * 0.014; });
        flyKeys();

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
          const vyIn = b.vy;
          b.y = top + BALL_R;
          b.vy = 0.105 + st.swing * 0.06 + Math.min(0.02, Math.hypot(st.vx, st.vz) * 0.2);
          b.vx = b.vx * 0.3 + dx * 0.05 + st.vx * 0.9;
          b.vz = b.vz * 0.3 + dz * 0.05 + st.vz * 0.9;
          hitKick = 1; squash = 1;
          pressAt(b.x - st.x, b.z - st.z, Math.min(1, -vyIn / 0.12));
          sound.play('tap', 40);
        }
        hitKick *= 0.9;
        // Squash on a hit (flat and wide), then stretched along its flight (tall and narrow)
        squash *= 0.86;
        const stretch = Math.min(0.28, Math.abs(b.vy) * 1.9);
        const sy = (1 + stretch) * (1 - 0.42 * squash), sxz = 1 / Math.sqrt(1 + stretch) * (1 + 0.3 * squash);
        ballHolder.scale.set(sxz, sy, sxz);
        ballHolder.position.set(b.x, b.y - BALL_R * (1 - sy) * 0.9, b.z);
        {
          const hgt = Math.max(0, b.y - BALL_R - -Y), t = Math.min(1, hgt / 1.4);
          blob.position.set(b.x, -Y + 0.004, b.z);
          blob.scale.setScalar(BALL_R * (1.5 + 2.2 * t));
          (blob.material as import('three').MeshBasicMaterial).opacity = 0.55 * (1 - t) * (1 - t);
        }
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 160, background: '#d6edf6', animation: 'pageIn 0.35s 0.05s ease both' }}>
      <div ref={host} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}
