'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface GlobeHeroProps {
  className?: string;
}

const CITIES = [
  { name: 'Accra',      lat: 5.6,  lon: -0.19 },
  { name: 'Kumasi',     lat: 6.7,  lon: -1.62 },
  { name: 'Tamale',     lat: 9.4,  lon: -0.84 },
  { name: 'Cape Coast', lat: 5.1,  lon: -1.28 },
];

function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

type GeoJson = { features: Array<{ geometry: { type: string; coordinates: unknown } }> };

/** Rasterise GeoJSON land polygons to a canvas, then sample dot positions. */
function buildDotPositions(geoJson: GeoJson, step = 1.5): THREE.Vector3[] {
  const CW = 720, CH = 360;
  const canvas = document.createElement('canvas');
  canvas.width  = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = '#fff';

  const toX = (lon: number) => ((lon + 180) / 360) * CW;
  const toY = (lat: number) => ((90 - lat) / 180) * CH;

  const drawRing = (ring: number[][]) => {
    ctx.beginPath();
    ring.forEach(([lon, lat], i) => {
      if (i === 0) ctx.moveTo(toX(lon), toY(lat));
      else          ctx.lineTo(toX(lon), toY(lat));
    });
    ctx.closePath();
    ctx.fill();
  };

  for (const f of geoJson.features) {
    const { type, coordinates } = f.geometry as { type: string; coordinates: number[][][] | number[][][][] };
    if (type === 'Polygon')      (coordinates as number[][][]).forEach(drawRing);
    if (type === 'MultiPolygon') (coordinates as number[][][][]).flat().forEach(drawRing);
  }

  const px = ctx.getImageData(0, 0, CW, CH).data;

  const dots: THREE.Vector3[] = [];
  for (let lat = -89; lat <= 89; lat += step) {
    for (let lon = -179; lon <= 180; lon += step) {
      const ix = Math.round(((lon + 180) / 360) * (CW - 1));
      const iy = Math.round(((90 - lat)  / 180) * (CH - 1));
      if (px[(iy * CW + ix) * 4] > 128) {
        dots.push(latLonToVec3(lat, lon, 1.008));
      }
    }
  }
  return dots;
}

/** Round dot sprite (used by PointsMaterial). */
function makeDotTexture(size = 64): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0,   'rgba(255,255,255,1)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.9)');
  g.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

export default function GlobeHero({ className }: GlobeHeroProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rafRef   = useRef<number>(0);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.z = 2.2;

    // ── Globe group ───────────────────────────────────────────
    const globe = new THREE.Group();
    scene.add(globe);

    // Base sphere — deep navy so dots pop
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(1, 80, 40),
      new THREE.MeshPhongMaterial({
        color:     0x06111f,
        emissive:  0x030a16,
        shininess: 60,
        specular:  0x1a3a6a,
      }),
    ));

    // Thick atmospheric rim — makes the sphere edge visible
    for (let i = 0; i < 3; i++) {
      globe.add(new THREE.Mesh(
        new THREE.SphereGeometry(1.06 + i * 0.04, 32, 32),
        new THREE.MeshPhongMaterial({
          color:       0x1a55cc,
          transparent: true,
          opacity:     0.07 - i * 0.02,
          side:        THREE.BackSide,
        }),
      ));
    }

    // ── Lights ────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x0a1428, 3.0));
    const key = new THREE.DirectionalLight(0x6688ee, 2.5);
    key.position.set(5, 3, 4);
    scene.add(key);
    // Strong blue rim light from behind-left to create sphere edge glow
    const rimLight = new THREE.PointLight(0x2255ff, 1.2, 8);
    rimLight.position.set(-2, 0, -2);
    scene.add(rimLight);
    // Warm orange from bottom-right (Ghana glow)
    const warmLight = new THREE.PointLight(0xff6519, 0.4, 12);
    warmLight.position.set(2, -2, 2);
    scene.add(warmLight);

    // ── City pins + pulse rings ───────────────────────────────
    const pulseRings: { mesh: THREE.Mesh; phase: number }[] = [];

    CITIES.forEach((city, ci) => {
      const pos = latLonToVec3(city.lat, city.lon, 1.02);

      const pin = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xff6519 }),
      );
      pin.position.copy(pos);
      globe.add(pin);

      // soft halo
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xff6519, transparent: true, opacity: 0.15 }),
      );
      halo.position.copy(pos);
      globe.add(halo);

      for (let r = 0; r < 2; r++) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.02, 0.034, 20),
          new THREE.MeshBasicMaterial({ color: 0xff6519, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
        );
        ring.position.copy(pos);
        ring.lookAt(pos.clone().multiplyScalar(3));
        pulseRings.push({ mesh: ring, phase: ci * 1.3 + r * 1.9 });
        globe.add(ring);
      }
    });

    // ── Land dots (loaded async) ───────────────────────────────
    fetch('/world-land.geojson')
      .then(r => r.json())
      .then((geo: GeoJson) => {
        const positions = buildDotPositions(geo, 1.4);
        const buf = new Float32Array(positions.length * 3);
        positions.forEach((v, i) => { buf[i*3]=v.x; buf[i*3+1]=v.y; buf[i*3+2]=v.z; });
        const geo3 = new THREE.BufferGeometry();
        geo3.setAttribute('position', new THREE.BufferAttribute(buf, 3));
        const mat = new THREE.PointsMaterial({
          size:            0.016,
          sizeAttenuation: true,
          map:             makeDotTexture(),
          color:           0x7aacff,
          transparent:     true,
          opacity:         0.9,
          depthWrite:      false,
          alphaTest:       0.05,
        });
        globe.add(new THREE.Points(geo3, mat));
      })
      .catch(() => {});

    // ── Initial orientation: West Africa centre ───────────────
    globe.rotation.y = -Math.PI / 2;

    // ── Resize ────────────────────────────────────────────────
    const resize = () => {
      const w = el.offsetWidth, h = el.offsetHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // ── Animation ─────────────────────────────────────────────
    const animate = (t: number) => {
      rafRef.current = requestAnimationFrame(animate);
      globe.rotation.y += 0.0005;
      pulseRings.forEach(({ mesh, phase }) => {
        const s = 1 + 0.55 * ((Math.sin(t * 0.0013 + phase) + 1) / 2);
        mesh.scale.setScalar(s);
        (mesh.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - (s - 1) / 0.55);
      });
      renderer.render(scene, camera);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    />
  );
}
