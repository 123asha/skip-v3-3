import { useEffect, useRef } from 'react';
import { sound, sharedAudio, SOUND_BUS } from '../sound/Sound';
import svgPaths from '../../imports/Index/svg-3bjnx36a2y';
import { asset } from '../utils/asset';

// 404 alternative (localhost only): a minimalist table-tennis paddle in real 3D (three.js)
// and a ball in a bare room. The racket follows the pointer on its own plane,
// tilting with its motion; the ball flies back and forth between the racket,
// the walls, the floor and the ceiling.
const BG = 0xe6e1da;   // the room's grey, also shown before the scene is drawn
const X = 2.6, Y = 1.5, Z_BACK = -4, Z_RACKET = 0.3;   // (the desk's front edge is at z ≈ 0.9)
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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(BG);
      renderer.shadowMap.enabled = true;
      // soft shadows (variance maps), as in a studio render
      renderer.shadowMap.type = THREE.VSMShadowMap;
      // A filmic grade, as in a studio render: soft highlights, gentle contrast
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.95;
      el.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 220);
      camera.position.set(0, 1.6, 6.3);
      camera.lookAt(0, -0.1, -1.3);
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
      scene.background = new THREE.Color(0xe6e1da);
      scene.add(new THREE.AmbientLight(0xfff6ee, 0.34));
      scene.add(new THREE.HemisphereLight(0xfffaf3, 0xeadfd2, 0.42));
      const sun = new THREE.DirectionalLight(0xfff6ec, 0.5);
      // Almost straight overhead: shadows lie right under what casts them
      sun.position.set(-0.25, 8, 0.35);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.left = -7; sun.shadow.camera.right = 7;
      sun.shadow.camera.top = 7; sun.shadow.camera.bottom = -7;
      sun.shadow.camera.near = 1; sun.shadow.camera.far = 16;
      sun.shadow.radius = 6; sun.shadow.blurSamples = 12; sun.shadow.bias = -0.0006;
      scene.add(sun);
      // Low sun through a window off to the left: it throws the window's panes, slanted,
      // across the wall and the desk, with soft leaf shadows from a plant outside
      const paneCookie = (() => {
        const c = document.createElement('canvas'); c.width = c.height = 512;
        const g = c.getContext('2d')!;
        g.fillStyle = '#000'; g.fillRect(0, 0, 512, 512);
        g.filter = 'blur(3px)';
        g.fillStyle = '#fff';
        // two tall panes side by side, a bar across each
        for (const x0 of [150, 268]) { g.fillRect(x0, 110, 100, 120); g.fillRect(x0, 244, 100, 150); }
        // leaves, in shade
        g.fillStyle = '#000';
        let seed = 3; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        for (let i = 0; i < 26; i++) {
          const cx = 260 + r() * 130, cy = 100 + r() * 140, rx = 8 + r() * 16, ry = 4 + r() * 7;
          g.save(); g.translate(cx, cy); g.rotate(r() * Math.PI); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.restore();
        }
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
        return t;
      })();
      const stripes = new THREE.SpotLight(0xffd9a8, 26, 0, 0.42, 0.15, 0);
      stripes.position.set(-11, 5.5, 3.5);
      stripes.target.position.set(1.8, 0.2, -4);
      stripes.map = paneCookie;
      stripes.castShadow = true;
      stripes.shadow.mapSize.set(1024, 1024);
      stripes.shadow.camera.near = 4; stripes.shadow.camera.far = 30;
      stripes.shadow.bias = -0.0004; stripes.shadow.normalBias = 0.02;
      stripes.shadow.radius = 4; stripes.shadow.blurSamples = 10;
      scene.add(stripes, stripes.target);

      const shade = (m: import('three').Object3D) => { m.traverse(o => { const q = o as import('three').Mesh; if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); return m; };
      const mat = (color: number, roughness = 0.6, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
      const fy = -Y;                                            // the desktop's surface
      // The desk: a light oak top on thin white legs, with a wooden drawer, standing on the floor
      {
        const oak = (() => {
          const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
          const g = c.getContext('2d')!;
          g.fillStyle = '#e2c79c'; g.fillRect(0, 0, 1024, 256);
          for (let i = 0; i < 140; i++) {
            const y = Math.random() * 256, a = 0.04 + Math.random() * 0.08;
            g.strokeStyle = `rgba(150,105,55,${a})`; g.lineWidth = 0.6 + Math.random() * 1.8;
            g.beginPath(); g.moveTo(0, y);
            for (let x = 0; x <= 1024; x += 64) g.lineTo(x, y + Math.sin(x * 0.004 + i) * 6 + (Math.random() - 0.5) * 2);
            g.stroke();
          }
          const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
          return t;
        })();
        const DW = 8.4, DZ0 = Z_BACK, DZ1 = 0.9, TH = 0.12, LEGS = 4.8;   // about 125 × 72 cm, 73 cm high
        const top = new THREE.Mesh(new THREE.RoundedBoxGeometry(DW, TH, DZ1 - DZ0, 3, 0.02), new THREE.MeshStandardMaterial({ map: oak, roughness: 0.55 }));
        top.position.set(0, fy - TH / 2, (DZ0 + DZ1) / 2);
        scene.add(shade(top));
        const white = mat(0xf2f0ec, 0.45, 0.2);
        for (const [x, z] of [[-DW / 2 + 0.25, DZ1 - 0.2], [DW / 2 - 0.25, DZ1 - 0.2], [-DW / 2 + 0.25, DZ0 + 0.2], [DW / 2 - 0.25, DZ0 + 0.2]]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, LEGS, 20), white);
          leg.position.set(x, fy - TH - LEGS / 2, z);
          scene.add(shade(leg));
        }
        const apron = new THREE.Mesh(new THREE.BoxGeometry(DW - 0.6, 0.16, 0.04), white);
        apron.position.set(0, fy - TH - 0.08, DZ1 - 0.22);
        scene.add(shade(apron));
        const drawer = new THREE.Mesh(new THREE.RoundedBoxGeometry(2.8, 0.5, 2.4, 3, 0.04), new THREE.MeshStandardMaterial({ map: oak, roughness: 0.5 }));
        drawer.position.set(2.2, fy - TH - 0.25, DZ1 - 1.25);
        scene.add(shade(drawer));
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), mat(0xd8d4cd, 0.85));
        floor.rotation.x = -Math.PI / 2; floor.position.set(0, fy - TH - LEGS, 0);
        floor.receiveShadow = true;
        scene.add(floor);
      }
      // The wall: a pale, finely textured fabric
      const fabric = (() => {
        const c = document.createElement('canvas'); c.width = c.height = 128;
        const g = c.getContext('2d')!;
        g.fillStyle = '#d5d2cc'; g.fillRect(0, 0, 128, 128);
        for (let y = 0; y < 128; y += 4) for (let x = 0; x < 128; x += 4) {
          const v = 205 + Math.floor(Math.random() * 30);
          g.fillStyle = `rgb(${v},${v - 2},${v - 6})`; g.fillRect(x + ((y / 4) % 2) * 2, y, 3, 3);
        }
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
        t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(60, 30);
        return t;
      })();
      // the wall
      {
        const sh = new THREE.Shape();
        sh.moveTo(-9, fy); sh.lineTo(9, fy); sh.lineTo(9, fy + 10); sh.lineTo(-9, fy + 10); sh.lineTo(-9, fy);
        const g = new THREE.ShapeGeometry(sh);
        // world-scaled UVs so the fabric keeps its size
        const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 18, uv.getY(i) / 10);
        const wall = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xffffff, map: fabric, roughness: 0.95, side: THREE.DoubleSide }));
        wall.position.z = Z_BACK - 0.02;
        wall.receiveShadow = true; wall.castShadow = true;
        scene.add(wall);
      }
      // Things on the desk, after the reference photos
      // (the ones the ball bounces off once it's free — see the docking below)
      const colliders: import('three').Object3D[] = [];
      // Things the ball can knock about (everything on the desk but the iMac): it shoves them
      // across the oak, spins them a little, pushes them off the edge — the mug can break
      type Prop = { root: import('three').Object3D; mass: number; kind?: 'mug'; vx: number; vz: number; w: number; vy: number;
        pos0?: import('three').Vector3; yaw0: number; aoM?: import('three').Mesh; ao0?: import('three').Vector3; aoRot0: number; fall: boolean; gone: boolean };
      const propOf = new Map<import('three').Object3D, Prop>();
      const props: Prop[] = [];
      const prop = (hits: import('three').Object3D[], root: import('three').Object3D, aoM: import('three').Mesh | undefined, mass: number, kind?: 'mug') => {
        const e: Prop = { root, mass, kind, vx: 0, vz: 0, w: 0, vy: 0, yaw0: root.rotation.y, aoM, aoRot0: aoM ? aoM.rotation.z : 0, fall: false, gone: false };
        hits.forEach(h => propOf.set(h, e)); props.push(e);
      };
      // Contact shadows: a soft darkening on the desk right under each thing, where the
      // light can't reach (ambient occlusion) — it's what makes them sit on the desk
      const aoTex = (() => {
        const c = document.createElement('canvas'); c.width = c.height = 128;
        const g = c.getContext('2d')!, gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        gr.addColorStop(0, '#fff'); gr.addColorStop(0.5, '#9a9a9a'); gr.addColorStop(1, '#000');
        g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(c);
      })();
      const ao = (x: number, z: number, rx: number, rz: number, op = 0.35, rotY = 0) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x2a2018, alphaMap: aoTex, transparent: true, opacity: op, depthWrite: false }));
        m.rotation.set(-Math.PI / 2, 0, rotY); m.scale.set(rx * 2, rz * 2, 1);
        m.position.set(x, -Y + 0.003, z);
        scene.add(m);
        return m;
      };
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
      // — the lamp from the reference: two stacked glossy peach "doughnuts" of glass,
      // glowing, on a slim two-tone stem and a flat disc foot, with a cable and a knob
      {
        const g = new THREE.Group();
        const cream = mat(0xeadfcd, 0.45), peach = mat(0xf0b98e, 0.4);
        g.add(new THREE.Mesh(new THREE.LatheGeometry([V2(0, 0), V2(0.42, 0), V2(0.43, 0.01), V2(0.42, 0.025), V2(0, 0.025)], 64), cream));
        const stemLow = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.62, 24), cream); stemLow.position.y = 0.33;
        const stemTop = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.42, 24), peach); stemTop.position.y = 0.85;
        const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 32), peach); collar.position.y = 1.07;
        g.add(stemLow, stemTop, collar);
        const glass = new THREE.MeshPhysicalMaterial({ color: 0xffd2a8, emissive: 0xffa868, emissiveIntensity: 0.55, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.12 });   // (no transmission: it costs a whole extra render pass)
        for (const [y, r] of [[1.2, 0.36], [1.47, 0.32]] as const) {
          const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.13, 32, 72), glass);
          t.rotation.x = Math.PI / 2; t.position.y = y; t.scale.z = 0.95;
          g.add(t); colliders.push(t);
        }
        colliders.push(stemLow, stemTop);
        const top = new THREE.Mesh(new THREE.CircleGeometry(0.24, 48), glass); top.rotation.x = -Math.PI / 2; top.position.y = 1.6; g.add(top);
        // its own warm light
        const bulb = new THREE.PointLight(0xffb070, 1.6, 3.5, 2); bulb.position.y = 1.33; g.add(bulb);
        // the cable, curling over the desk to a round knob
        const curve = new THREE.CatmullRomCurve3([V3(0.3, 0.02, 0.1), V3(0.7, 0.015, 0.5), V3(0.4, 0.015, 1.0), V3(-0.3, 0.015, 0.9), V3(-0.6, 0.015, 0.4)]);
        g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.012, 8, false), cream));
        g.position.set(2.75, fy, -3.15);
        prop(g.children.filter(c => colliders.includes(c)), g, ao(2.75, -3.15, 0.6, 0.6, 0.3), 2.2);
        g.traverse(o => { const m = o as import('three').Mesh; if (m.isMesh) { m.castShadow = m.material !== glass; m.receiveShadow = true; } });
        scene.add(g);
      }
      // — an Apple Magic Mouse: a long, low, seamless white shell (a pill-shaped footprint,
      // a gentle dome highest a little behind the middle, thinning to a fine edge) over a
      // thin aluminium base that shows as a silver line under it
      {
        const A = 0.205, B = 0.405, HT = 0.1;                    // half-width, half-length, height
        const N = 4;                                              // footprint: |x/A|^4 + |z/B|^4 = 1
        const toFoot = (u: number, v: number) => {
          // a point of the square [-1,1]² taken onto the footprint, at "radius" m
          const m = Math.max(Math.abs(u), Math.abs(v));
          if (m === 0) return { x: 0, z: 0, m };
          const k = m / Math.pow(Math.abs(u) ** N + Math.abs(v) ** N, 1 / N);
          return { x: u * k * A, z: v * k * B, m };
        };
        const top = new THREE.PlaneGeometry(2, 2, 72, 144);
        top.rotateX(-Math.PI / 2);
        const pos = top.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const f = toFoot(pos.getX(i), pos.getZ(i));
          const along = f.z / B;                                  // −1 front … +1 back
          const h = HT * Math.pow(Math.max(0, 1 - f.m ** 4), 0.42) * (1 - 0.14 * along) ;
          pos.setXYZ(i, f.x, h, f.z);
        }
        top.computeVertexNormals();
        const shellMat = new THREE.MeshPhysicalMaterial({ color: 0xfcfcfb, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.06 });
        const shell = new THREE.Mesh(top, shellMat);
        shell.position.y = 0.022;
        // the aluminium base: the same footprint a touch smaller, a thin plate
        const foot = new THREE.Shape();
        for (let i = 0; i <= 96; i++) {
          const t = (i / 96) * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t);
          const x = Math.sign(c) * Math.abs(c) ** (2 / N) * A * 0.93, z = Math.sign(sn) * Math.abs(sn) ** (2 / N) * B * 0.95;
          if (i === 0) foot.moveTo(x, z); else foot.lineTo(x, z);
        }
        const baseG = new THREE.ExtrudeGeometry(foot, { depth: 0.022, bevelEnabled: false, curveSegments: 4 });
        baseG.rotateX(Math.PI / 2); baseG.translate(0, 0.022, 0);
        const base = new THREE.Mesh(baseG, mat(0xd4d6d9, 0.28, 0.85));
        const mouse = new THREE.Group();
        mouse.add(base, shell);
        mouse.position.set(1.75, fy, -1.5); mouse.rotation.y = -0.12;
        scene.add(shade(mouse)); colliders.push(mouse);
        prop([mouse], mouse, ao(1.75, -1.5, 0.3, 0.52, 0.42, -0.12), 0.6);
      }
      // The rest of the desk: the iMac in the middle; a snake plant at the back left balancing the lamp
      // at the back right; a clear acrylic pen stand and a kraft notebook with a gel pen on the
      // left, the mouse and a mug on the right; plenty of empty oak between
      {
        let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        // — a snake plant (Sansevieria) in a matte concrete pot: tall, fleshy, sword-like
        // leaves with a slight twist, dark green banded with pale stripes, yellow edges
        {
          const g = new THREE.Group();
          const concrete = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, map: canvasTex(256, 256, cg => {
            cg.fillStyle = '#bfbab2'; cg.fillRect(0, 0, 256, 256);
            for (let i = 0; i < 5000; i++) { const v = 150 + Math.random() * 70; cg.fillStyle = `rgba(${v},${v - 3},${v - 8},0.35)`; cg.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 2); }
          }) });
          const pot = new THREE.Mesh(new THREE.LatheGeometry([V2(0, 0), V2(0.33, 0), V2(0.36, 0.03), V2(0.4, 0.62), V2(0.37, 0.63), V2(0.35, 0.12), V2(0, 0.12)], 56), concrete);
          g.add(pot);
          const soil = new THREE.Mesh(new THREE.CircleGeometry(0.36, 40), mat(0x33271f, 1)); soil.rotation.x = -Math.PI / 2; soil.position.y = 0.57; g.add(soil);
          // the leaf picture: wavy pale bands across dark green, a yellow margin each side
          const leafTex = canvasTex(128, 512, lg => {
            lg.fillStyle = '#2f5427'; lg.fillRect(0, 0, 128, 512);
            for (let y = 0; y < 512; y += 9 + Math.random() * 10) {
              lg.strokeStyle = `rgba(${150 + Math.random() * 40},${180 + Math.random() * 30},${120 + Math.random() * 30},${0.25 + Math.random() * 0.3})`;
              lg.lineWidth = 2 + Math.random() * 4;
              lg.beginPath(); lg.moveTo(10, y);
              for (let x = 10; x <= 118; x += 12) lg.lineTo(x, y + Math.sin(x * 0.12 + y) * 4);
              lg.stroke();
            }
            for (let i = 0; i < 1400; i++) { lg.fillStyle = `rgba(0,20,0,${Math.random() * 0.12})`; lg.fillRect(Math.random() * 128, Math.random() * 512, 2, 2); }
            const edge = lg.createLinearGradient(0, 0, 128, 0);
            edge.addColorStop(0, '#c9b65a'); edge.addColorStop(0.08, '#b8a94e'); edge.addColorStop(0.12, 'rgba(0,0,0,0)'); edge.addColorStop(0.88, 'rgba(0,0,0,0)'); edge.addColorStop(0.92, '#b8a94e'); edge.addColorStop(1, '#c9b65a');
            lg.fillStyle = edge; lg.fillRect(0, 0, 128, 512);
          });
          const leafMats = [0xffffff, 0xe8efe0, 0xd8e4cc].map(tint => new THREE.MeshStandardMaterial({ map: leafTex, color: tint, roughness: 0.38, side: THREE.DoubleSide }));
          // one leaf: a long tapered blade, gently folded along its middle, twisting and leaning as it rises
          const blade = (h: number, w: number, twist: number, lean: number) => {
            const geo = new THREE.PlaneGeometry(1, 1, 6, 28);
            const pos = geo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
              const u = pos.getX(i) + 0.5, v = pos.getY(i) + 0.5;           // 0…1 across, 0…1 up
              const width = w * Math.pow(Math.sin(Math.PI * Math.min(1, v * 0.62 + 0.38)), 0.8) * (1 - Math.pow(v, 6));
              let x = (u - 0.5) * width, z = Math.abs(u - 0.5) * width * 0.55;   // folded into a shallow V
              const a = twist * v, ca = Math.cos(a), sa = Math.sin(a);
              [x, z] = [x * ca - z * sa, x * sa + z * ca];
              pos.setXYZ(i, x, v * h, z + lean * v * v * h);
            }
            geo.computeVertexNormals();
            return geo;
          };
          for (let i = 0; i < 11; i++) {
            const a = rnd() * Math.PI * 2, r = 0.05 + rnd() * 0.17;
            const h = 1.3 + rnd() * 1.1, w = 0.17 + rnd() * 0.08;
            const m = new THREE.Mesh(blade(h, w, (rnd() - 0.5) * 1.6, 0.06 + rnd() * 0.18), leafMats[i % leafMats.length]);
            m.position.set(Math.cos(a) * r, 0.55, Math.sin(a) * r);
            m.rotation.y = -a + Math.PI / 2 + (rnd() - 0.5) * 0.6;
            m.castShadow = true;
            g.add(m);
          }
          g.position.set(-2.85, fy, -3.1);
          scene.add(shade(g)); colliders.push(pot);
          prop([pot], g, ao(-2.85, -3.1, 0.6, 0.6, 0.45), 3);
        }
        // — a MUJI acrylic pen stand (clear), with MUJI gel pens and a pencil
        {
          const g = new THREE.Group();
          const acrylic = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.22, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
          const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.62, 0.42), acrylic); box.position.y = 0.31;
          const edges = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color: 0xcfd6d8, transparent: true, opacity: 0.8 }));
          edges.position.y = 0.31;
          g.add(box, edges);
          for (const [x, z, tl, col] of [[-0.08, -0.06, 0.08, 0x1d1d1d], [0.06, 0.05, -0.06, 0x1d1d1d], [0.08, -0.08, 0.12, 0xe9e9e6], [-0.05, 0.08, -0.1, 0xd9c29a]] as const) {
            const pen = rod(V3(x, 0.03, z), V3(x + tl, 0.98, z - tl * 0.4), 0.022, mat(col, 0.45));
            g.add(pen);
          }
          g.position.set(-1.95, fy, -2.35);
          scene.add(g); box.castShadow = false; colliders.push(box);
          prop([box], g, ao(-1.95, -2.35, 0.36, 0.36, 0.3), 0.9);
          g.traverse(o => { const m = o as import('three').Mesh; if (m.isMesh && m !== box) m.castShadow = true; });
        }
        // — a MUJI kraft-paper notebook, slightly askew, with a black gel pen on it
        {
          const g = new THREE.Group();
          const kraft = mat(0xc4a57a, 0.85);
          const cover = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.05, 1.42), [kraft, kraft, kraft, kraft, kraft, kraft]);
          cover.position.y = 0.025;
          const pages = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.036, 1.4), mat(0xf6f3ec, 0.9)); pages.position.set(0.01, 0.025, 0);
          const label = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.14), new THREE.MeshStandardMaterial({ roughness: 0.9, map: canvasTex(300, 100, gg => { gg.fillStyle = '#f2ece0'; gg.fillRect(0, 0, 300, 100); gg.strokeStyle = '#8a7a63'; gg.lineWidth = 2; for (const y of [40, 66]) { gg.beginPath(); gg.moveTo(20, y); gg.lineTo(280, y); gg.stroke(); } }) }));
          label.rotation.x = -Math.PI / 2; label.position.set(0, 0.052, -0.38);
          const pen = rod(V3(-0.32, 0.075, 0.45), V3(0.3, 0.075, -0.15), 0.024, mat(0x1b1b1b, 0.4));
          const clip = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.12), mat(0x1b1b1b, 0.4)); clip.position.set(0.22, 0.1, -0.08); clip.rotation.y = 0.78;
          g.add(cover, pages, label, pen, clip);
          g.position.set(-2.55, fy, -0.45); g.rotation.y = 0.22;
          scene.add(shade(g)); colliders.push(cover);
          prop([cover], g, ao(-2.55, -0.45, 0.62, 0.85, 0.22, 0.22), 1.1);
        }
        // — a white porcelain mug (front right)
        {
          const mug = new THREE.Group();
          const porcelain = new THREE.MeshStandardMaterial({ color: 0xf3f1ec, roughness: 0.28 });
          mug.add(new THREE.Mesh(new THREE.LatheGeometry([V2(0, 0), V2(0.17, 0), V2(0.18, 0.02), V2(0.18, 0.4), V2(0.165, 0.4), V2(0.165, 0.05), V2(0, 0.05)], 48), porcelain));
          const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 12, 32, Math.PI * 1.2), porcelain);
          handle.position.set(0.18, 0.22, 0); handle.rotation.z = -Math.PI * 0.6;
          mug.add(handle);
          mug.position.set(2.85, fy, -0.35); mug.rotation.y = 0.5;
          scene.add(shade(mug)); colliders.push(mug);
          prop([mug], mug, ao(2.85, -0.35, 0.3, 0.3, 0.45), 0.8, 'mug');
        }
      }
      // An iMac (24", silver) at the back of the desk, «404» on its screen
      let screenFx: ((now: number) => void) | null = null;
      await document.fonts.ready;
      if (stop) { renderer.dispose(); renderer.domElement.remove(); return; }
      {
        // A real 24" iMac (1 unit ≈ 14.5 cm, the scale of the keyboard and the desk): 54.7 cm wide,
        // the body 36.6 cm tall and 11.5 mm thin, lifted 9.5 cm off the desk; a 16:9 screen with an
        // even white border of about 1.3 cm; a 4.6 cm silver chin; a 13 × 14.7 cm bent-plate stand
        const W = 3.77, D = 0.08, BORDER = 0.09, LIFT = 0.655;
        const BEZ_H = (W - 2 * BORDER) * 9 / 16 + 2 * BORDER;
        const H = BEZ_H + 0.5;                                  // a generous silver chin below the screen
        // Apple's silver: a light, soft-satin aluminium
        const silver = new THREE.MeshStandardMaterial({ color: 0xe6e7e9, roughness: 0.38, metalness: 0.35 });
        const mac = new THREE.Group();
        const shell = new THREE.Mesh(new THREE.RoundedBoxGeometry(W, H, D, 4, 0.045), silver);
        mac.add(shell);
        // the white bezel and the screen over the upper part of the front; the silver chin shows below
        const bezel = new THREE.Mesh(new THREE.RoundedBoxGeometry(W - 0.004, BEZ_H, 0.006, 3, 0.04), new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.35 }));
        bezel.position.set(0, H / 2 - BEZ_H / 2 - 0.002, D / 2);
        mac.add(bezel);
        const screenTex = (() => {
          const c = document.createElement('canvas'); c.width = 1600; c.height = 900;
          const g = c.getContext('2d')!;
          const bg = g.createLinearGradient(0, 0, 1600, 900);
          bg.addColorStop(0, '#f5f5f3'); bg.addColorStop(1, '#e9e9e7');
          g.fillStyle = bg; g.fillRect(0, 0, 1600, 900);
          const cs = getComputedStyle(document.documentElement);
          const family = cs.getPropertyValue('--font-display').trim() || 'sans-serif';
          const weight = cs.getPropertyValue('--heading-weight').trim() || '450';
          // «404» is drawn every frame out of static (see below); here only its shape, as a mask
          const DW0 = 720, DH0 = 405;
          const tm = document.createElement('canvas'); tm.width = DW0; tm.height = DH0;
          {
            const tg = tm.getContext('2d')!;
            tg.fillStyle = '#000'; tg.textAlign = 'center'; tg.textBaseline = 'middle';
            tg.font = `${weight} ${Math.round(DH0 * 0.52)}px ${family}`;
            if ('letterSpacing' in tg) (tg as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${-Math.round(DH0 * 0.011)}px`;
            // soft, smeared edges: the letters are drawn only as a blurred shadow
            tg.shadowColor = '#000'; tg.shadowBlur = 16; tg.shadowOffsetX = DW0 * 2;
            tg.fillText('404', DW0 / 2 - DW0 * 2, DH0 * 0.52);
            tg.shadowBlur = 5;
            tg.fillText('404', DW0 / 2 - DW0 * 2, DH0 * 0.52);
          }
          // The picture on the screen is redrawn from this one with interference over it, in
          // black and white like an old television: a faint static and scan lines always, a slow
          // rolling band, and now and then a burst — heavy snow, the picture rolling and its
          // lines jerked sideways, grey bars, a flicker
          const DW = 720, DH = 405;
          const d = document.createElement('canvas'); d.width = DW; d.height = DH;
          const dg = d.getContext('2d')!;
          const lines = document.createElement('canvas'); lines.width = 4; lines.height = DH;
          { const lg = lines.getContext('2d')!; for (let y = 0; y < DH; y += 3) { lg.fillStyle = 'rgba(0,0,0,0.05)'; lg.fillRect(0, y, 4, 1); } }
          const linesPat = dg.createPattern(lines, 'repeat')!;
          // a few frames of static, made once and shuffled
          const snow = Array.from({ length: 6 }, () => {
            const n = document.createElement('canvas'); n.width = 360; n.height = 203;
            const ng = n.getContext('2d')!, img = ng.createImageData(360, 203);
            for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() < 0.5 ? 95 + Math.random() * 55 : 185 + Math.random() * 55; /* a softer, lighter grey */ img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
            ng.putImageData(img, 0, 0);
            return n;
          });
          const t = new THREE.CanvasTexture(d); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
          // each frame: the plain screen, and «404» filled with static (dark, crawling)
          const fr = document.createElement('canvas'); fr.width = DW; fr.height = DH;
          const frg = fr.getContext('2d')!;
          const nt = document.createElement('canvas'); nt.width = DW; nt.height = DH;
          const ntg = nt.getContext('2d')!;
          // the whole screen is snow; «404» is the same snow, only denser and darker — written in noise
          const compose = () => {
            frg.imageSmoothingEnabled = false;
            const i0 = Math.floor(Math.random() * snow.length);
            frg.globalCompositeOperation = 'source-over';
            frg.drawImage(snow[i0], 0, 0, DW, DH);
            frg.fillStyle = 'rgba(238,238,234,0.66)'; frg.fillRect(0, 0, DW, DH);   // the field: pale snow
            ntg.globalCompositeOperation = 'source-over';
            ntg.imageSmoothingEnabled = false;
            ntg.drawImage(snow[(i0 + 1 + Math.floor(Math.random() * (snow.length - 1))) % snow.length], 0, 0, DW, DH);
            ntg.fillStyle = 'rgba(80,80,78,0.4)'; ntg.fillRect(0, 0, DW, DH);     // the letters: greyer snow
            ntg.globalCompositeOperation = 'destination-in';
            // the shape wavers a little from frame to frame, like a weak signal
            ntg.drawImage(tm, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 2, DW, DH);
            frg.drawImage(nt, 0, 0);
          };
          let burst = 0, frame = 0, roll = 0;
          screenFx = (now: number) => {
            if ((frame++ % 5) !== 0) return;                       // 12 fps: a slow, lazy flicker
            dg.globalCompositeOperation = 'source-over'; dg.globalAlpha = 1;
            dg.imageSmoothingEnabled = true;
            compose();
            if (burst <= 0 && Math.random() < 0.012) { burst = 4 + Math.floor(Math.random() * 8); roll = Math.random() < 0.5 ? (Math.random() - 0.5) * DH * 0.6 : 0; }
            if (burst > 0) {
              burst--;
              // the picture rolls (vertical hold), wrapping round
              const oy = ((roll * (burst / 12)) % DH + DH) % DH;
              dg.drawImage(fr, 0, oy, DW, DH); dg.drawImage(fr, 0, oy - DH, DW, DH);
              // lines jerked sideways (horizontal hold)
              for (let k = 0, n = 3 + Math.floor(Math.random() * 6); k < n; k++) {
                const y = Math.random() * DH, h = 2 + Math.random() * 30, dx = (Math.random() - 0.5) * 110;
                dg.drawImage(d, 0, y, DW, h, dx, y, DW, h);
              }
              // heavy snow
              dg.imageSmoothingEnabled = false;
              dg.globalAlpha = 0.35 + Math.random() * 0.3;
              dg.drawImage(snow[Math.floor(Math.random() * snow.length)], 0, 0, DW, DH);
              dg.globalAlpha = 1;
              // grey bars
              for (let k = 0, n = 1 + Math.floor(Math.random() * 3); k < n; k++) {
                dg.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.22)';
                dg.fillRect(0, Math.random() * DH, DW, 3 + Math.random() * 16);
              }
              if (Math.random() < 0.3) { dg.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)'; dg.fillRect(0, 0, DW, DH); }
            } else {
              dg.drawImage(fr, 0, 0, DW, DH);
              // a faint static even when calm
              dg.imageSmoothingEnabled = false;
              dg.globalAlpha = 0.0;
              dg.globalAlpha = 1;
            }
            // the rolling band and the scan lines
            const by = ((now / 1000) * 35) % (DH + 120) - 60;
            const band = dg.createLinearGradient(0, by - 40, 0, by + 40);
            band.addColorStop(0, 'rgba(255,255,255,0)'); band.addColorStop(0.5, 'rgba(255,255,255,0.08)'); band.addColorStop(1, 'rgba(255,255,255,0)');
            dg.fillStyle = band; dg.fillRect(0, by - 40, DW, 80);
            dg.fillStyle = linesPat; dg.fillRect(0, 0, DW, DH);
            t.needsUpdate = true;
          };
          screenFx(0);
          return t;
        })();
        const SW = W - 2 * BORDER, SH = SW * 9 / 16;
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
        screen.position.set(0, H / 2 - BEZ_H / 2 - 0.002, D / 2 + 0.0045);
        mac.add(screen);
        const cam = new THREE.Mesh(new THREE.CircleGeometry(0.008, 16), new THREE.MeshBasicMaterial({ color: 0x222222 }));
        cam.position.set(0, H / 2 - 0.045, D / 2 + 0.0045);
        mac.add(cam);
        // Round stickers on the chin: our favicon, and the logo
        // on white, black, terracotta and sage — different sizes, stuck on a little askew
        const logoPaths = svgPaths.pb7e9300.match(/M[^M]+/g)!;
        const drawLogo = (g: CanvasRenderingContext2D, cx: number, cy: number, w: number, color: string) => {
          const sc = w / 52.5283;
          g.save(); g.fillStyle = color; g.translate(cx - w / 2, cy - 16 * sc); g.scale(sc, sc);
          g.fill(new Path2D(logoPaths[1])); g.fill(new Path2D(logoPaths[2])); g.fill(new Path2D(logoPaths[4])); g.fill(new Path2D(logoPaths[0] + logoPaths[3]), 'evenodd');
          g.restore();
        };
        const fav = new Image();
        const favTexs: import('three').CanvasTexture[] = [];
        fav.onload = () => favTexs.forEach(t => {
          const g = (t.image as HTMLCanvasElement).getContext('2d')!;
          g.drawImage(fav, 128 - 84, 128 - 84, 168, 168);   // the favicon on white
          t.needsUpdate = true;
        });
        fav.src = asset('/fav-black-nobg.png');
        const stickerTex = (kind: 'fav' | 'white' | 'black' | 'terracotta' | 'sage') => canvasTex(256, 256, g => {
          g.fillStyle = '#fbfaf8'; g.beginPath(); g.arc(128, 128, 126, 0, Math.PI * 2); g.fill();     // the white die-cut edge
          const fill = { fav: '#fbfaf8', white: '#fbfaf8', black: '#151515', terracotta: '#d9784e', sage: '#9fae94' }[kind];
          g.fillStyle = fill; g.beginPath(); g.arc(128, 128, 116, 0, Math.PI * 2); g.fill();
          if (kind !== 'fav') drawLogo(g, 128, 128, 150, kind === 'white' || kind === 'sage' ? '#151515' : '#fbfaf8');
        });
        const addSticker = (kind: 'fav' | 'white' | 'black' | 'terracotta' | 'sage', x: number, y: number, r: number, rot: number) => {
          const t = stickerTex(kind);
          if (kind === 'fav') favTexs.push(t);
          const m = new THREE.Mesh(new THREE.CircleGeometry(r, 48), new THREE.MeshStandardMaterial({ map: t, roughness: 0.45, transparent: true }));
          m.position.set(x, y, D / 2 + 0.003 + favTexs.length * 0.0004 + r * 0.001); m.rotation.z = rot;
          mac.add(m);
        };
        const chinY = -H / 2 + (H - BEZ_H) / 2 - 0.01;
        // one, our favicon, in the middle of the chin
        addSticker('fav', 0, chinY, 0.12, 0);
        // the stand: one bent aluminium plate — a leaning upright and a flat foot
        // from behind the body it leans back down to the desk, then runs forward flat under the screen
        const SW_ST = 0.9, FOOT_D = 1.01, FOOT_T = 0.04;
        const FOOT_Y = -H / 2 - LIFT + FOOT_T / 2;            // the foot lies on the desktop
        const topP = new THREE.Vector3(0, -H / 2 + 0.8, -D / 2 - 0.02), lowP = new THREE.Vector3(0, FOOT_Y + 0.02, -0.69);
        const dv = topP.clone().sub(lowP), upLen = dv.length();
        const up = new THREE.Mesh(new THREE.RoundedBoxGeometry(SW_ST, upLen, 0.035, 2, 0.012), silver);
        up.position.copy(lowP).addScaledVector(dv, 0.5);
        up.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dv.normalize());
        const foot = new THREE.Mesh(new THREE.RoundedBoxGeometry(SW_ST, FOOT_T, FOOT_D, 2, 0.012), silver);
        foot.position.set(0, FOOT_Y, -0.69 + FOOT_D / 2);
        const bend = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, SW_ST, 16), silver);
        bend.rotation.z = Math.PI / 2; bend.position.set(0, FOOT_Y + 0.015, -0.69);
        mac.add(up, foot, bend);
        colliders.push(shell, bezel, foot);
        mac.position.set(0, fy + LIFT + H / 2, -2.1);
        ao(0, -2.25, 0.45, 0.5, 0.35);
        mac.traverse(o => { const m = o as import('three').Mesh; if (m.isMesh && m !== screen && m !== cam) { m.castShadow = true; m.receiveShadow = true; } });
        scene.add(mac);
      }

      // The ball: matte white
      const tex = (() => {
        const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
        const g = c.getContext('2d')!;
        g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = '#111111';
        // «error ·» running all the way round the ball's equator like a rim, in black on the white
        // ball (seamless — the texture wraps at its edges)
        const cs = getComputedStyle(document.documentElement);
        g.font = `${cs.getPropertyValue('--heading-weight').trim() || '450'} 40px ${cs.getPropertyValue('--font-display').trim() || 'sans-serif'}`;
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#161616';
        const N = 7;
        for (let i = 0; i < N; i++) g.fillText('error ·', (i + 0.5) * (1024 / N), 258);
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
      const caseMat = new THREE.MeshPhysicalMaterial({ color: 0xebe5dc, roughness: 0.4, clearcoat: 0.4, clearcoatRoughness: 0.3 });
      const slab = (sh: import('three').Shape, depth: number, y: number, mat: import('three').Material) => {
        const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 3, curveSegments: 16 });
        g.rotateX(-Math.PI / 2); g.translate(0, y, 0);
        return new THREE.Mesh(g, mat);
      };
      racket.add(slab(caseShape, PLATE_Y - 0.008, 0.004, caseMat));        // body up to the plate
      racket.add(slab(rim, CASE_H - PLATE_Y, PLATE_Y - 0.004, caseMat));   // the rim around the well
      const plate = new THREE.Mesh(new THREE.ShapeGeometry(well), new THREE.MeshStandardMaterial({ color: 0x8a8178, roughness: 0.8 }));
      plate.rotation.x = -Math.PI / 2; plate.position.y = PLATE_Y + 0.001;
      racket.add(plate);
      // A tiny orange switch on the back edge, as in the reference
      const sw = new THREE.Mesh(new THREE.RoundedBoxGeometry(0.06, 0.018, 0.025, 2, 0.006), new THREE.MeshStandardMaterial({ color: 0xd9784e, roughness: 0.4 }));
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
            g.fillStyle = k.accent ? '#fff7f0' : '#8d857c';
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
      const topMat = new THREE.MeshStandardMaterial({ color: 0xf3eee6, roughness: 0.4 });
      const topAccent = new THREE.MeshStandardMaterial({ color: 0xdb7d52, roughness: 0.35 });
      const legendMat = new THREE.MeshBasicMaterial({ map: legendTex, transparent: true, depthWrite: false });
      type KeyMesh = {
        body: import('three').Object3D; x0: number; x1: number; z0: number; z1: number; press: number; y0: number;
        // knocked off: flying, lying on the desk, or flying home
        state: 'on' | 'fly' | 'rest' | 'back'; v: import('three').Vector3; w: import('three').Vector3; t: number;
        from?: { p: import('three').Vector3; q: import('three').Quaternion };
      };
      const keys: KeyMesh[] = [];
      const keyMeshes = new Set<import('three').Object3D>();
      const ox = -COLS * U / 2, oz = -ROWN * U / 2;
      ROWS.forEach((row, ri) => {
        let x = 0;
        row.forEach(k => {
          const kw = k.w * U - GAP, kd = U - GAP;
          const body = new THREE.Group();
          // one flat, softly rounded keycap
          const KH = SKIRT_H + CAP_H;
          const cap = new THREE.Mesh(new THREE.RoundedBoxGeometry(kw, KH, kd, 4, 0.014), k.accent ? topAccent : topMat);
          cap.position.y = KH / 2;
          body.add(cap); keyMeshes.add(cap);
          // the legend, on its top
          const tw = kw * 0.94, td = kd * 0.94;
          const lg = new THREE.PlaneGeometry(tw, td);
          lg.rotateX(-Math.PI / 2);
          const uv = lg.attributes.uv;
          const cx0 = x + k.w / 2, half = (tw / U) / 2, halfD = (td / U) / 2;
          const u0 = (cx0 - half) / COLS, u1 = (cx0 + half) / COLS;
          const v0 = 1 - (ri + 0.5 - halfD) / ROWN, v1 = 1 - (ri + 0.5 + halfD) / ROWN;
          uv.setXY(0, u0, v0); uv.setXY(1, u1, v0); uv.setXY(2, u0, v1); uv.setXY(3, u1, v1);
          const legend = new THREE.Mesh(lg, legendMat);
          legend.position.set(0, KH + 0.0008, 0);
          body.add(legend);
          const cx = ox + (x + k.w / 2) * U, cz = oz + (ri + 0.5) * U;
          body.position.set(cx, PLATE_Y, cz);
          racket.add(body);
          keys.push({ body, x0: cx - (k.w * U) / 2, x1: cx + (k.w * U) / 2, z0: cz - U / 2, z1: cz + U / 2, press: 0, y0: PLATE_Y,
            state: 'on', v: new THREE.Vector3(), w: new THREE.Vector3(), t: 0 });
          x += k.w;
        });
      });
      // the case casts the keyboard's shadow; the many keys don't need to (a lot of draws saved)
      racket.traverse(o => { const m = o as import('three').Mesh; if (m.isMesh && m.material !== legendMat) { m.castShadow = !keyMeshes.has(m); m.receiveShadow = true; } });
      // Where the ball lands, the key is knocked clean off (and a neighbour or two
      // now and then): it flies up, tumbles and lands on the desk, where it stays
      // A plastic crack when keys are knocked off: a sharp snap of filtered noise, a second
      // smaller click, and the low knock of the key coming loose
      const playBreak = (power: number) => {
        const ctx = sharedAudio(); if (!ctx || !SOUND_BUS.on) return;
        const now = ctx.currentTime;
        const snap = (at: number, gain: number, freq: number, dur: number) => {
          const len = Math.ceil(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), ch = buf.getChannelData(0);
          for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
          const src = ctx.createBufferSource(); src.buffer = buf;
          const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 1.4;
          const gn = ctx.createGain(); gn.gain.value = gain;
          src.connect(bp).connect(gn).connect(ctx.destination); src.start(now + at);
        };
        snap(0, 0.5 + power * 0.4, 3200 + Math.random() * 900, 0.05);
        snap(0.03 + Math.random() * 0.02, 0.25, 5200, 0.03);
        const osc = ctx.createOscillator(), og = ctx.createGain();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(260, now); osc.frequency.exponentialRampToValueAtTime(90, now + 0.09);
        og.gain.setValueAtTime(0.18, now); og.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        osc.connect(og).connect(ctx.destination); osc.start(now); osc.stop(now + 0.14);
      };
      // A mechanical keyboard's clack when keys come off: the switch's click and the cap popping loose
      const playKeyClack = (power: number) => {
        const ctx = sharedAudio(); if (!ctx || !SOUND_BUS.on) return;
        const now = ctx.currentTime;
        const len = Math.ceil(ctx.sampleRate * 0.012), buf = ctx.createBuffer(1, len, ctx.sampleRate), ch = buf.getChannelData(0);
        for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
        const src = ctx.createBufferSource(); src.buffer = buf;
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3500;
        const g1 = ctx.createGain(); g1.gain.value = 0.35 + power * 0.25;
        src.connect(hp).connect(g1).connect(ctx.destination); src.start(now);
        const osc = ctx.createOscillator(), g2 = ctx.createGain();
        osc.type = 'square'; osc.frequency.setValueAtTime(1150, now + 0.012); osc.frequency.exponentialRampToValueAtTime(420, now + 0.05);
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
        g2.gain.setValueAtTime(0.0001, now); g2.gain.setValueAtTime(0.09, now + 0.012); g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
        osc.connect(lp).connect(g2).connect(ctx.destination); osc.start(now + 0.012); osc.stop(now + 0.08);
      };
      // A soft knock for the ball against everything but the keyboard (quieter than the site's taps)
      let lastSoft = 0;
      const softKnock = (strength = 0.5) => {
        const ctx = sharedAudio(); if (!ctx || !SOUND_BUS.on) return;
        const t = performance.now(); if (t - lastSoft < 60) return; lastSoft = t;
        const now = ctx.currentTime, osc = ctx.createOscillator(), g = ctx.createGain();
        const f = 620 * (1 + (Math.random() - 0.5) * 0.15);
        osc.type = 'sine'; osc.frequency.setValueAtTime(f, now); osc.frequency.exponentialRampToValueAtTime(f * 0.7, now + 0.07);
        g.gain.setValueAtTime(0.06 + Math.min(1, strength) * 0.05, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
        osc.connect(g).connect(ctx.destination); osc.start(now); osc.stop(now + 0.09);
      };
      const pressAt = (lx: number, lz: number, power: number) => {
        const hit = keys.filter(q => q.state === 'on' && lx >= q.x0 - U * 0.6 && lx <= q.x1 + U * 0.6 && lz >= q.z0 - U * 0.6 && lz <= q.z1 + U * 0.6);
        hit.sort((a, b) => Math.hypot((a.x0 + a.x1) / 2 - lx, (a.z0 + a.z1) / 2 - lz) - Math.hypot((b.x0 + b.x1) / 2 - lx, (b.z0 + b.z1) / 2 - lz));
        const off = hit.slice(0, 1 + (Math.random() < 0.35 ? 1 : 0) + (power > 0.5 ? 1 : 0));
        if (off.length) playKeyClack(power);
        off.forEach((q, i) => {
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
              q.v.y = Math.abs(q.v.y) * 0.32; q.v.x *= 0.6; q.v.z *= 0.6; q.w.multiplyScalar(0.5);
              if (q.v.y < 0.01) { q.state = 'rest'; q.t = 0; }
            }
          } else if (q.state === 'rest') {
            // settles flat (right side up or upside down, whichever is nearer)
            const flat = (a: number) => Math.round(a / Math.PI) * Math.PI;
            o.rotation.x += (flat(o.rotation.x) - o.rotation.x) * 0.2;
            o.rotation.z += (flat(o.rotation.z) - o.rotation.z) * 0.2;
            o.position.y = fy + (Math.abs(Math.cos(o.rotation.x) * Math.cos(o.rotation.z)) > 0.5 && Math.cos(o.rotation.x) * Math.cos(o.rotation.z) < 0 ? SKIRT_H + CAP_H : 0.004);
            // and stays there — knocked-off keys come back only with a reload
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
      // Docking: the keyboard parked in front of the monitor sets the ball free
      const DOCK_Z = -1.15, DOCK_IN = -1.5, DOCK_OUT = -0.2;
      let docked = false, dockT = 0, reel = false, freeKick = false;
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
          st.tz = Math.max(DOCK_Z - 0.45, Math.min(Z_RACKET, hit.z));
        }
      };
      const onDown = () => { st.swing = 1; };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerdown', onDown);

      let raf = 0;
      const tick = () => {
        look.x += (look.tx - look.x) * 0.04; look.y += (look.ty - look.y) * 0.04;
        // the camera swings round the desk on an arc (about ±22° sideways, a little up and down)
        {
          const tx = 0, ty = -0.1, tz = -1.3, R = Math.hypot(1.7, 7.6), p0 = Math.atan2(1.7, 7.6);
          const yaw = look.x * 0.38, pitch = p0 - look.y * 0.1;
          camera.position.set(tx + R * Math.sin(yaw) * Math.cos(pitch), ty + R * Math.sin(pitch), tz + R * Math.cos(yaw) * Math.cos(pitch));
          camera.lookAt(tx, ty, tz);
        }
        // Paddle
        const px = st.x, pz = st.z;
        st.x += (st.tx - st.x) * 0.2; st.z += (st.tz - st.z) * 0.2;
        st.vx = st.x - px; st.vz = st.z - pz;
        st.swing *= 0.82;
        st.lift = st.swing * 0.35;
        // Brought up to the monitor, the keyboard settles calmly into its place in front of it;
        // pulled back towards you, it lifts off again
        if (!docked && st.tz < DOCK_IN && Math.abs(st.tx) < 1.3) { docked = true; reel = false; freeKick = true; sound.play('tap', 20); }
        else if (docked && st.tz > DOCK_OUT) { docked = false; reel = true; }
        dockT += ((docked ? 1 : 0) - dockT) * 0.06;
        const de = dockT * dockT * (3 - 2 * dockT);
        if (docked) { st.x += (0 - st.x) * 0.08; st.z += (DOCK_Z - st.z) * 0.08; }
        racket.position.set(st.x, (PY + st.lift - TOP_H) * (1 - de) + fy * de, st.z);
        racket.rotation.set(st.vz * 2.5 * (1 - de), 0, -st.vx * 2.5 * (1 - de));
        keys.forEach(q => { if (q.state !== 'on') return; q.press *= 0.82; q.body.position.y = q.y0 - q.press * 0.014; });
        flyKeys();
        moveProps();
        clearUnderKeyboard();

        const free = docked && dockT > 0.4;
        if (free) { freeBall(); finishBall(); screenFx?.(performance.now()); renderer.render(scene, camera); raf = requestAnimationFrame(tick); return; }
        // Ball, tied to the middle of the paddle by its string
        b.vy -= 0.0034;
        // Falling, it is steered back over the paddle, so it always comes down on it
        b.vx += (st.x - b.x) * 0.0016; b.vz += (st.z - b.z) * 0.0016;
        b.vx *= 0.995; b.vz *= 0.995;
        b.x += b.vx; b.y += b.vy; b.z += b.vz;
        if (reel) {
          // coming back from roaming the desk: reeled in by the string, gently
          const ddx = st.x - b.x, ddy = PY + st.lift + 1 - b.y, ddz = st.z - b.z, dd = Math.hypot(ddx, ddy, ddz) || 1;
          if (dd > LEN * 0.9) { const f = Math.min(0.02, (dd - LEN * 0.9) * 0.004); b.vx += ddx / dd * f; b.vy += ddy / dd * f; b.vz += ddz / dd * f; b.vx *= 0.97; b.vy *= 0.97; b.vz *= 0.97; }
          else reel = false;
        }
        // The string: once taut it stops the ball and pulls it back
        const cx = st.x, cy = PY + st.lift, cz = st.z;
        let dx = b.x - cx, dy = b.y - cy, dz = b.z - cz;
        const dist = Math.hypot(dx, dy, dz);
        if (dist > LEN && !reel) {
          const nx = dx / dist, ny = dy / dist, nz = dz / dist;
          b.x = cx + nx * LEN; b.y = cy + ny * LEN; b.z = cz + nz * LEN;
          const out = b.vx * nx + b.vy * ny + b.vz * nz;
          if (out > 0) { b.vx -= 1.5 * out * nx; b.vy -= 1.5 * out * ny; b.vz -= 1.5 * out * nz; }
        }
        if (b.y > Y - BALL_R) { b.y = Y - BALL_R; b.vy = -Math.abs(b.vy) * 0.6; }
        // The floor, the walls: a ball that misses the paddle bounces off them, with a knock
        if (b.y < -Y + BALL_R) {
          b.y = -Y + BALL_R;
          if (b.vy < -0.02) { softKnock(-b.vy / 0.12); squash = Math.max(squash, 0.7); }
          b.vy = Math.abs(b.vy) * 0.72; b.vx *= 0.92; b.vz *= 0.92;
        }
        if (b.x > X - BALL_R) { b.x = X - BALL_R; if (b.vx > 0.02) softKnock(0.4); b.vx = -Math.abs(b.vx) * 0.8; }
        if (b.x < -X + BALL_R) { b.x = -X + BALL_R; if (b.vx < -0.02) softKnock(0.4); b.vx = Math.abs(b.vx) * 0.8; }
        if (b.z < Z_BACK + BALL_R) { b.z = Z_BACK + BALL_R; b.vz = Math.abs(b.vz) * 0.8; }
        if (b.z > Z_RACKET + 0.4) { b.z = Z_RACKET + 0.4; b.vz = -Math.abs(b.vz) * 0.8; }
        collideProps();
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
          if (!keys.some(q => q.state === 'on' && b.x - st.x >= q.x0 - U * 0.6 && b.x - st.x <= q.x1 + U * 0.6 && b.z - st.z >= q.z0 - U * 0.6 && b.z - st.z <= q.z1 + U * 0.6)) sound.play('tap', 40);
          pressAt(b.x - st.x, b.z - st.z, Math.min(1, -vyIn / 0.12));
        }
        finishBall();
        screenFx?.(performance.now());
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      // The ball's look each frame: squash and stretch, roll, its contact shadow, the (hidden) string
      const finishBall = () => {
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
      };
      // Free: the ball roams the desk and bounces off the things on it (and the docked keyboard)
      let boxes: import('three').Box3[] | null = null;
      const closest = new THREE.Vector3();
      const bounceOff = (minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number, e?: Prop) => {
        closest.set(Math.max(minX, Math.min(b.x, maxX)), Math.max(minY, Math.min(b.y, maxY)), Math.max(minZ, Math.min(b.z, maxZ)));
        let nx = b.x - closest.x, ny = b.y - closest.y, nz = b.z - closest.z;
        const d = Math.hypot(nx, ny, nz);
        if (d >= BALL_R) return;
        if (d < 1e-6) { nx = 0; ny = 1; nz = 0; } else { nx /= d; ny /= d; nz /= d; }
        b.x = closest.x + nx * BALL_R; b.y = closest.y + ny * BALL_R; b.z = closest.z + nz * BALL_R;
        const vn = b.vx * nx + b.vy * ny + b.vz * nz;
        if (vn < 0) {
          b.vx -= 1.85 * vn * nx; b.vy -= 1.85 * vn * ny; b.vz -= 1.85 * vn * nz;
          if (vn < -0.015) { softKnock(-vn / 0.1); squash = Math.max(squash, 0.6); }
          if (e) {
            // the thing takes the blow: shoved away from the ball, spun a little
            // (with the keyboard parked the ball means it: it shoves much harder, and things go off the desk)
            const imp = -vn * (docked ? 2.6 : 1.1) / e.mass, hl = Math.hypot(nx, nz) || 1;
            e.vx -= (nx / hl) * imp; e.vz -= (nz / hl) * imp; e.w += (Math.random() - 0.5) * imp * 3;
            // only the mug can break
            if (e.kind === 'mug' && -vn > 0.05) shatter(e);
          }
        }
      };
      // Every prop's box follows the prop as it moves
      const ensureBoxes = () => {
        if (!boxes) { scene.updateMatrixWorld(true); boxes = colliders.map(o => new THREE.Box3().setFromObject(o)); props.forEach(e => { e.pos0 = e.root.position.clone(); if (e.aoM) e.ao0 = e.aoM.position.clone(); }); }
      };
      // The keyboard, low on the desk, can't sit on anything: whatever is under it is moved out of the way
      const clearUnderKeyboard = () => {
        if (dockT < 0.15) return;
        ensureBoxes();
        const kx0 = st.x - KW / 2 - 0.03, kx1 = st.x + KW / 2 + 0.03, kz0 = st.z - KD / 2 - 0.03, kz1 = st.z + KD / 2 + 0.03;
        colliders.forEach((o, i) => {
          const e = propOf.get(o); if (!e || e.gone || e.fall || !e.pos0) return;
          const bx = boxes![i], ox = e.root.position.x - e.pos0.x, oz = e.root.position.z - e.pos0.z;
          const x0 = bx.min.x + ox, x1 = bx.max.x + ox, z0 = bx.min.z + oz, z1 = bx.max.z + oz;
          if (x1 <= kx0 || x0 >= kx1 || z1 <= kz0 || z0 >= kz1) return;
          // out along the shortest way
          const pushes = [kx0 - x1, kx1 - x0, kz0 - z1, kz1 - z0];
          const k = pushes.reduce((bi, v, j) => (Math.abs(v) < Math.abs(pushes[bi]) ? j : bi), 0);
          if (k < 2) e.root.position.x += pushes[k]; else e.root.position.z += pushes[k];
          if (e.aoM && e.ao0) e.aoM.position.set(e.ao0.x + e.root.position.x - e.pos0.x, e.ao0.y, e.ao0.z + e.root.position.z - e.pos0.z);
        });
      };
      const collideProps = () => {
        ensureBoxes();
        colliders.forEach((o, i) => {
          const bx = boxes![i], e = propOf.get(o);
          if (e?.gone || e?.fall) return;
          const ox = e && e.pos0 ? e.root.position.x - e.pos0.x : 0, oz = e && e.pos0 ? e.root.position.z - e.pos0.z : 0;
          bounceOff(bx.min.x + ox, bx.min.y, bx.min.z + oz, bx.max.x + ox, bx.max.y, bx.max.z + oz, e);
        });
      };
      // The mug breaks: it's gone, and a few porcelain shards fly and settle on the desk
      type Shard = { m: import('three').Mesh; v: import('three').Vector3; w: import('three').Vector3; rest: boolean };
      const shards: Shard[] = [];
      const shardBox = new THREE.Box3();
      // Anything breaks into shards in its own colours, with a crack
      const shatter = (e: Prop) => {
        if (e.gone || e.fall) return;
        e.gone = true; e.root.visible = false; if (e.aoM) e.aoM.visible = false;
        playBreak(1);
        e.root.updateMatrixWorld(true);
        shardBox.setFromObject(e.root);
        const c = shardBox.getCenter(new THREE.Vector3()), sz = shardBox.getSize(new THREE.Vector3());
        const cols: number[] = [];
        e.root.traverse(o => {
          const m = (o as import('three').Mesh).material as import('three').MeshStandardMaterial | undefined;
          if (m && 'color' in m && m.color && cols.length < 4) { const h = m.color.getHex(); if (!cols.includes(h)) cols.push(h); }
        });
        const mats = (cols.length ? cols : [0xeeeeee]).map(col => new THREE.MeshStandardMaterial({ color: col, roughness: 0.4, flatShading: true }));
        const n = 10 + Math.round(Math.min(10, (sz.x + sz.y + sz.z) * 3));
        const big = Math.min(0.16, 0.04 + (sz.x + sz.z) * 0.05);
        for (let i = 0; i < n; i++) {
          const m = new THREE.Mesh(new THREE.TetrahedronGeometry(big * (0.4 + Math.random() * 0.8), 0), mats[i % mats.length]);
          m.position.set(c.x + (Math.random() - 0.5) * sz.x * 0.8, Math.max(fy + 0.05, c.y + (Math.random() - 0.5) * sz.y * 0.8), c.z + (Math.random() - 0.5) * sz.z * 0.8);
          m.castShadow = true; scene.add(m);
          const a = Math.random() * Math.PI * 2, sp = 0.02 + Math.random() * 0.05;
          shards.push({ m, v: V3(Math.cos(a) * sp, 0.02 + Math.random() * 0.06, Math.sin(a) * sp), w: V3(Math.random() * 0.4, Math.random() * 0.4, Math.random() * 0.4), rest: false });
        }
      };
      // Props sliding (with friction), turning, falling off the desk; shards settling
      const moveProps = () => {
        for (const e of props) {
          if (e.gone) continue;
          const r = e.root;
          if (e.fall) {
            e.vy -= 0.008; r.position.y += e.vy; r.position.x += e.vx; r.position.z += e.vz; r.rotation.x += 0.04;
            if (e.aoM) e.aoM.visible = false;
            if (r.position.y < fy - 7) { r.visible = false; e.gone = true; }
            continue;
          }
          if (Math.abs(e.vx) + Math.abs(e.vz) + Math.abs(e.w) < 1e-5) continue;
          r.position.x += e.vx; r.position.z += e.vz; r.rotation.y += e.w;
          e.vx *= 0.9; e.vz *= 0.9; e.w *= 0.86;
          if (r.position.z < Z_BACK + 0.35) { r.position.z = Z_BACK + 0.35; e.vz = Math.abs(e.vz) * 0.3; }
          if (Math.abs(r.position.x) > 4.2 || r.position.z > 0.9) { e.fall = true; e.vy = 0; softKnock(0.3); }
          if (e.aoM && e.ao0 && e.pos0) {
            e.aoM.position.set(e.ao0.x + r.position.x - e.pos0.x, e.ao0.y, e.ao0.z + r.position.z - e.pos0.z);
            e.aoM.rotation.z = e.aoRot0 - (r.rotation.y - e.yaw0);
          }
        }
        for (const sh of shards) {
          if (sh.rest) continue;
          sh.v.y -= 0.0034; sh.m.position.add(sh.v);
          sh.m.rotation.x += sh.w.x; sh.m.rotation.y += sh.w.y; sh.m.rotation.z += sh.w.z;
          // on the desk, or past its edges down to the floor
          const onDesk = Math.abs(sh.m.position.x) < 4.2 && sh.m.position.z < 0.9 && sh.m.position.z > Z_BACK;
          const groundY = onDesk ? fy + 0.03 : fy - 4.9;
          if (sh.m.position.y < groundY) { sh.m.position.y = groundY; sh.v.y = Math.abs(sh.v.y) * 0.3; sh.v.x *= 0.6; sh.v.z *= 0.6; sh.w.multiplyScalar(0.5); if (sh.v.y < 0.008) sh.rest = true; }
        }
      };
      const freeBall = () => {
        collideProps();
        if (freeKick) { freeKick = false; b.vy = Math.max(b.vy, 0.09); b.vx += (Math.random() - 0.5) * 0.06; b.vz -= 0.02; }
        b.vy -= 0.0034;
        b.x += b.vx; b.y += b.vy; b.z += b.vz;
        // the desktop: it keeps bouncing, and now and then heads for something on the desk
        if (b.y < fy + BALL_R) {
          b.y = fy + BALL_R;
          if (b.vy < -0.02) { softKnock(-b.vy / 0.12); squash = Math.max(squash, 0.7); }
          b.vy = Math.max(Math.abs(b.vy) * 0.85, 0.075 + Math.random() * 0.035);
          // on the hunt: the nearest thing still standing, aimed so the arc comes down on it
          const alive = props.filter(e => !e.gone && !e.fall);
          if (alive.length) {
            let tgt = alive[0], best = Infinity;
            for (const e of alive) { const d = Math.hypot(e.root.position.x - b.x, e.root.position.z - b.z); if (d < best) { best = d; tgt = e; } }
            b.vy = 0.1 + Math.random() * 0.02;
            const flight = (2 * b.vy) / 0.0034;                     // frames until it comes back down
            const hx = tgt.root.position.x - b.x, hz = tgt.root.position.z - b.z;
            b.vx = hx / flight; b.vz = hz / flight;
          } else { b.vx *= 0.95; b.vz *= 0.95; }
        }
        // the room: back wall, the desk's ends, a little in front, a ceiling
        if (b.z < Z_BACK + BALL_R) { b.z = Z_BACK + BALL_R; b.vz = Math.abs(b.vz) * 0.8; softKnock(0.4); }
        if (b.z > 0.7) { b.z = 0.7; b.vz = -Math.abs(b.vz) * 0.8; }
        if (Math.abs(b.x) > 4.0) { b.x = Math.sign(b.x) * 4.0; b.vx = -b.vx * 0.8; }
        if (b.y > 3.5) { b.y = 3.5; b.vy = -Math.abs(b.vy); }
        // the docked keyboard
        bounceOff(st.x - KW / 2, fy, st.z - KD / 2, st.x + KW / 2, fy + TOP_H, st.z + KD / 2);
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 160, background: '#e6e1da', animation: 'pageIn 0.35s 0.05s ease both' }}>
      <div ref={host} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}
