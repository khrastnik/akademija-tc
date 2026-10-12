// 3D prizor toplotne črpalke zrak–voda. Vse je zgrajeno iz preprostih teles v kodi:
// brez modelov za prenos, zato je simulator majhen in deluje brez povezave.
import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  Fog,
  CurvePath,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  InstancedMesh,
  LineCurve3,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  RepeatWrapping,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Material,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type Cue = 'leaves' | 'ice' | 'ice-full' | 'oil' | 'dirty-filter' | 'bubbles' | 'low-water' | 'frost-drier' | 'valve-dhw';
export type OperatingMode = 'ogrevanje' | 'sanitarna' | 'odtajevanje';

export interface Anchor {
  id: string;
  x: number;
  y: number;
  visible: boolean;
}

export interface SimScene {
  anchors(ids: string[]): Anchor[];
  highlight(id: string | null): void;
  focus(id: string | null): void;
  reveal(cue: Cue): void;
  resetCues(): void;
  setDisplay(lines: string[], alarm?: boolean): void;
  setFlowSpeed(refrigerant: number, water: number): void;
  /** Ogrevanje, sanitarna voda (3-potni ventil na bojler) ali odtajevanje (4-potni ventil obrne tok). */
  setOperatingMode(mode: OperatingMode): void;
  onPick(cb: (id: string) => void): void;
  resize(): void;
  dispose(): void;
}

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

/** Pot iz ravnih odsekov – cevi z jasnimi koleni, kot na pravi napravi. */
function path(points: Vector3[]) {
  const p = new CurvePath<Vector3>();
  for (let i = 1; i < points.length; i++) p.add(new LineCurve3(points[i - 1], points[i]));
  return p;
}

// Barve: rdeča = visok tlak, modra = nizek tlak; voda topla oranžna, povratna turkizna.
const COL = {
  hot: 0xd9412b,
  liquid: 0xe08a3c,
  cold: 0x2f7fd1,
  coldGas: 0x4aa3e8,
  waterHot: 0xf0a24a,
  waterCold: 0x3fb8b0,
  casing: 0xe9e4da,
  metal: 0x9aa3ad,
  copper: 0xb87333,
  dark: 0x2b2f33,
};

// Kje so deli in merilne točke (sidra za oznake v HTML nad platnom).
export const ANCHORS: Record<string, Vector3> = {
  uparjalnik: v(-2.55, 1.08, -0.22),
  ventilator: v(-2.55, 0.6, 0.3),
  kompresor: v(-1.85, 0.42, 0.06),
  eev: v(-1.55, 1.02, 0.06),
  kondenzator: v(1.6, 1.88, -0.2),
  obtocna: v(1.85, 0.72, -0.2),
  filter: v(2.45, 0.28, -0.2),
  raztezna: v(2.85, 0.92, -0.35),
  radiator: v(3.55, 1.1, -0.6),
  krmilnik: v(1.65, 1.28, 0.08),
  stiripotni: v(-1.85, 0.86, 0.12),
  susilnik: v(-1.12, 1.0, 0.06),
  locevalnik: v(-2.1, 0.52, 0.06),
  servisni: v(-2.55, 0.2, -0.2),
  'zunanji-senzor': v(-0.13, 1.72, 0.5),
  tripotni: v(2.32, 1.9, -0.2),
  bojler: v(2.65, 1.36, -1.35),
  pretok: v(1.93, 1.1, -0.2),
  varnostni: v(2.0, 1.98, -0.2),
  dogrevalnik: v(2.08, 1.62, -0.2),
  // merilne točke na ceveh
  sesalni: v(-2.55, 0.2, -0.2),
  tekocinski: v(-0.7, 0.95, 0.06),
  tlacni: v(-0.7, 1.22, 0.06),
  dvizni: v(2.5, 1.78, -0.2),
  povratni: v(3.4, 0.24, -0.2),
};

export function createScene(canvas: HTMLCanvasElement, opts: { reducedMotion: boolean }): SimScene {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  scene.background = new Color(0xdde8f0);
  scene.fog = new Fog(0xdde8f0, 9, 22);
  const camera = new PerspectiveCamera(42, 1, 0.1, 60);
  camera.position.set(1.2, 2.6, 6.4);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0.45, 0.85, -0.2);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2.2;
  controls.maxDistance = 14;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minAzimuthAngle = -Math.PI * 0.45;
  controls.maxAzimuthAngle = Math.PI * 0.45;

  scene.add(new HemisphereLight(0xfff4e6, 0x6b5a48, 1.6));
  scene.add(new AmbientLight(0xffffff, 0.35));
  const sun = new DirectionalLight(0xffffff, 1.6);
  sun.position.set(-3, 6, 4);
  scene.add(sun);

  const pickables: Mesh[] = [];
  const partMeshes = new Map<string, Mesh[]>();
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  function std(color: number, extra: Partial<ConstructorParameters<typeof MeshStandardMaterial>[0]> = {}) {
    return track(new MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.1, ...extra }));
  }
  function add(part: string | null, geo: any, mat: Material, pos: Vector3, parent: Object3D = scene) {
    const m = new Mesh(track(geo), mat);
    m.position.copy(pos);
    parent.add(m);
    if (part) {
      m.userData.part = part;
      pickables.push(m);
      if (!partMeshes.has(part)) partMeshes.set(part, []);
      partMeshes.get(part)!.push(m);
    }
    return m;
  }

  // ---------- okolica: tla, zid hiše, notranja tla ----------
  add(null, new PlaneGeometry(40, 30), std(0x93a874), v(-14, -0.002, 0)).rotation.x = -Math.PI / 2;
  add(null, new PlaneGeometry(5.2, 4), std(0xd9c7a8), v(2.6, 0.002, -0.3)).rotation.x = -Math.PI / 2;
  // zid hiše: prosojen, da se vidi cev skozi njega
  add(null, new BoxGeometry(0.2, 2.2, 3.0), std(0xf5efe6, { transparent: true, opacity: 0.3, depthWrite: false }), v(0, 1.1, -0.4));
  add(null, new BoxGeometry(0.2, 0.05, 3.0), std(0xc9b8a0), v(0, 0.025, -0.4));
  // senca pod zunanjo enoto
  add(null, new CircleGeometry(1.05, 32), new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 }), v(-2.25, 0.004, 0)).rotation.x = -Math.PI / 2;

  // ---------- zunanja enota ----------
  const outdoor = new Group();
  scene.add(outdoor);
  const casingMat = std(COL.casing, { transparent: true, opacity: 0.22, depthWrite: false });
  add(null, new BoxGeometry(1.62, 1.22, 0.56), casingMat, v(-2.25, 0.62, 0), outdoor);
  add(null, new BoxGeometry(1.62, 0.06, 0.56), std(COL.casing), v(-2.25, 1.25, 0), outdoor); // pokrov
  for (const x of [-3.04, -1.46]) add(null, new BoxGeometry(0.04, 0.08, 0.6), std(COL.dark), v(x, 0.04, 0), outdoor); // noge

  // uparjalnik: lamele s črtasto teksturo
  const finTex = (() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 8;
    const g = c.getContext('2d')!;
    g.fillStyle = '#b9c2c9';
    g.fillRect(0, 0, 64, 8);
    g.fillStyle = '#7d8890';
    for (let x = 0; x < 64; x += 4) g.fillRect(x, 0, 1, 8);
    const t = track(new CanvasTexture(c));
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(10, 1);
    t.colorSpace = SRGBColorSpace;
    return t;
  })();
  const evapMat = std(0xffffff, { map: finTex, metalness: 0.4, roughness: 0.4 });
  add('uparjalnik', new BoxGeometry(1.42, 1.0, 0.07), evapMat, v(-2.3, 0.66, -0.2), outdoor);

  // ventilator z rešetko
  const fan = new Group();
  fan.position.set(-2.55, 0.6, 0.18);
  outdoor.add(fan);
  const bladeMat = std(0x3a3f44);
  for (let i = 0; i < 3; i++) {
    const b = add('ventilator', new BoxGeometry(0.1, 0.34, 0.02), bladeMat, v(0, 0, 0), fan);
    b.geometry.translate(0, 0.17, 0);
    b.rotation.z = (i * Math.PI * 2) / 3;
    b.rotation.y = 0.35;
  }
  add('ventilator', new CylinderGeometry(0.06, 0.06, 0.06, 16), bladeMat, v(0, 0, 0), fan).rotation.x = Math.PI / 2;
  add('ventilator', new TorusGeometry(0.4, 0.015, 8, 48), std(COL.dark), v(-2.55, 0.6, 0.28), outdoor);

  // kompresor
  const compMat = std(0x2f4f3f, { metalness: 0.35, roughness: 0.45 });
  add('kompresor', new CylinderGeometry(0.17, 0.17, 0.42, 28), compMat, v(-1.85, 0.3, 0.06), outdoor);
  add('kompresor', new SphereGeometry(0.17, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), compMat, v(-1.85, 0.51, 0.06), outdoor);

  // ekspanzijski ventil: medeninasto telo s tuljavo
  add('eev', new CylinderGeometry(0.05, 0.05, 0.16, 16), std(0xc9a227, { metalness: 0.6, roughness: 0.3 }), v(-1.55, 0.95, 0.06), outdoor).rotation.z = Math.PI / 2;
  add('eev', new BoxGeometry(0.1, 0.12, 0.1), std(0x1d1f22), v(-1.55, 1.04, 0.06), outdoor);

  const brass = std(0xc9a227, { metalness: 0.6, roughness: 0.3 });
  // 4-potni ventil na tlačnem vodu takoj za kompresorjem, s pilotno tuljavo
  add('stiripotni', new CylinderGeometry(0.055, 0.055, 0.24, 18), brass, v(-1.85, 0.86, 0.06), outdoor).rotation.z = Math.PI / 2;
  add('stiripotni', new BoxGeometry(0.08, 0.08, 0.07), std(0x1d1f22), v(-1.85, 0.94, 0.12), outdoor);
  for (const dx of [-0.07, 0, 0.07]) add('stiripotni', new CylinderGeometry(0.012, 0.012, 0.1, 8), std(COL.copper), v(-1.85 + dx, 0.79, 0.06), outdoor);
  // filter sušilnik na tekočinskem vodu pred EEV
  add('susilnik', new CylinderGeometry(0.04, 0.04, 0.2, 16), std(0x6d7b3a, { metalness: 0.3 }), v(-1.12, 0.95, 0.06), outdoor).rotation.z = Math.PI / 2;
  // ločevalnik kapljevine na sesalnem vodu pred kompresorjem
  add('locevalnik', new CylinderGeometry(0.065, 0.065, 0.3, 18), std(0x2f3e48, { metalness: 0.35 }), v(-2.1, 0.3, 0.06), outdoor);
  // servisna priključka (kapici) na sesalnem in tekočinskem vodu
  for (const p of [v(-2.55, 0.17, -0.2), v(-0.7, 0.98, 0.06)]) add('servisni', new CylinderGeometry(0.014, 0.014, 0.05, 10), std(0x1d6fd1), p);
  // zunanji senzor temperature na severni steni
  add('zunanji-senzor', new BoxGeometry(0.03, 0.09, 0.07), std(0xffffff), v(-0.12, 1.72, 0.5));

  // ---------- notranja enota ----------
  add(null, new BoxGeometry(0.82, 1.62, 0.46), std(0xffffff, { transparent: true, opacity: 0.2, depthWrite: false }), v(1.62, 1.2, -0.18));
  // kondenzator: zloženi ploščni prenosnik
  const plateMat = std(0xb8bec4, { metalness: 0.6, roughness: 0.3 });
  for (let i = 0; i < 9; i++) add('kondenzator', new BoxGeometry(0.42, 0.42, 0.012), plateMat, v(1.6, 1.62, -0.29 + i * 0.022));
  add('kondenzator', new BoxGeometry(0.44, 0.44, 0.04), std(0x8f979e, { metalness: 0.5 }), v(1.6, 1.62, -0.33));
  // obtočna črpalka
  add('obtocna', new CylinderGeometry(0.1, 0.1, 0.16, 20), std(0xc0392b), v(1.85, 0.62, -0.2));
  add('obtocna', new CylinderGeometry(0.07, 0.07, 0.14, 20), std(0x2b2f33), v(1.98, 0.62, -0.2)).rotation.z = Math.PI / 2;
  // zaslon krmilnika s teksturo
  const screen = document.createElement('canvas');
  screen.width = 256;
  screen.height = 128;
  const screenTex = track(new CanvasTexture(screen));
  screenTex.colorSpace = SRGBColorSpace;
  add('krmilnik', new BoxGeometry(0.36, 0.22, 0.03), std(0x2b2f33), v(1.65, 1.15, 0.06));
  add('krmilnik', new PlaneGeometry(0.32, 0.16), track(new MeshBasicMaterial({ map: screenTex })), v(1.65, 1.15, 0.077));

  // filter (Y lovilec) na povratnem vodu
  const filterMat = std(0xc9a227, { metalness: 0.55, roughness: 0.35 });
  add('filter', new CylinderGeometry(0.06, 0.06, 0.24, 18), filterMat, v(2.45, 0.15, -0.2)).rotation.z = Math.PI / 2;
  add('filter', new CylinderGeometry(0.045, 0.045, 0.16, 16), filterMat, v(2.5, 0.08, -0.2)).rotation.z = -0.8;

  // raztezna posoda z manometrom
  add('raztezna', new CylinderGeometry(0.16, 0.16, 0.42, 24), std(0xc0392b), v(2.85, 0.55, -0.35));
  const gaugeFace = add('raztezna', new CircleGeometry(0.07, 24), std(0xffffff), v(2.85, 0.86, -0.27));
  const needle = add(null, new BoxGeometry(0.005, 0.06, 0.004), std(0x111111), v(2.85, 0.86, -0.265));
  needle.geometry.translate(0, 0.028, 0);
  needle.rotation.z = -0.2;
  void gaugeFace;
  add(null, new CylinderGeometry(0.012, 0.012, 0.4, 8), std(COL.copper), v(2.85, 0.25, -0.35));

  // 3-potni preklopni ventil na dvižnem vodu (z motorjem in kazalcem)
  add('tripotni', new BoxGeometry(0.1, 0.1, 0.1), brass, v(2.32, 1.76, -0.2));
  add('tripotni', new BoxGeometry(0.1, 0.09, 0.09), std(0xe9e4da), v(2.32, 1.86, -0.2));
  const valveArrow = add(null, new BoxGeometry(0.012, 0.06, 0.012), std(0xa4502a), v(2.32, 1.92, -0.2));
  valveArrow.geometry.translate(0, 0.02, 0);
  // bojler za sanitarno vodo
  add('bojler', new CylinderGeometry(0.26, 0.26, 1.1, 32), std(0xf2efe8, { roughness: 0.3 }), v(2.65, 0.65, -1.35));
  add('bojler', new SphereGeometry(0.26, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(0xf2efe8, { roughness: 0.3 }), v(2.65, 1.2, -1.35));
  // merilnik pretoka na vodu od črpalke
  add('pretok', new BoxGeometry(0.08, 0.12, 0.08), std(0x1f5fa3), v(1.93, 1.1, -0.2));
  // varnostni ventil (rdeča kapica) in odzračevalnik na vrhu
  add('varnostni', new CylinderGeometry(0.025, 0.025, 0.1, 12), brass, v(2.0, 1.84, -0.2));
  add('varnostni', new CylinderGeometry(0.035, 0.035, 0.04, 12), std(0xc0392b), v(2.0, 1.91, -0.2));
  // električni dogrevalnik v vodnem krogu za kondenzatorjem
  add('dogrevalnik', new CylinderGeometry(0.055, 0.055, 0.22, 18), std(0x9aa3ad, { metalness: 0.5 }), v(2.1, 1.76, -0.2)).rotation.z = Math.PI / 2;

  // radiator
  const radMat = std(0xf4f1ea, { roughness: 0.35 });
  for (let i = 0; i < 8; i++) add('radiator', new BoxGeometry(0.07, 0.68, 0.1), radMat, v(3.25 + i * 0.09, 0.66, -0.6));

  // ---------- cevi ----------
  const tubeMat = new Map<CurvePath<Vector3>, MeshStandardMaterial>();
  function pipe(points: Vector3[], color: number, r = 0.022, part: string | null = null) {
    const curve = path(points);
    const mat = std(color, { roughness: 0.4, metalness: 0.2 });
    add(part, new TubeGeometry(curve, Math.max(8, points.length * 12), r, 8, false), mat, v(0, 0, 0));
    tubeMat.set(curve, mat);
    return curve;
  }
  const ev = [-1.68, -2.95];
  // krog hladiva (smer toka): kompresor → kondenzator → EEV → uparjalnik → kompresor
  const segDischarge = pipe([v(-1.85, 0.66, 0.06), v(-1.85, 1.15, 0.06), v(0, 1.15, 0.06), v(1.3, 1.15, 0.06), v(1.3, 1.78, 0.06), v(1.38, 1.78, -0.2)], COL.hot, 0.024, 'tlacni');
  const segLiquid = pipe([v(1.38, 1.46, -0.2), v(1.3, 1.46, 0.06), v(1.3, 0.95, 0.06), v(0, 0.95, 0.06), v(-1.47, 0.95, 0.06)], COL.liquid, 0.018, 'tekocinski');
  const segMix = pipe([v(-1.63, 0.95, 0.06), v(-1.63, 0.95, -0.2), v(ev[0], 1.04, -0.2)], COL.coldGas, 0.018);
  const segEvap = pipe(
    [v(ev[0], 1.04, -0.2), v(ev[1], 1.04, -0.2), v(ev[1], 0.8, -0.2), v(ev[0], 0.8, -0.2), v(ev[0], 0.56, -0.2), v(ev[1], 0.56, -0.2), v(ev[1], 0.3, -0.2)],
    COL.coldGas,
    0.016,
  );
  // sesalni vod gre skozi ločevalnik kapljevine v kompresor
  const segSuction = pipe(
    [v(ev[1], 0.3, -0.2), v(ev[1], 0.14, -0.2), v(-2.1, 0.14, -0.2), v(-2.1, 0.14, 0.06), v(-2.1, 0.5, 0.06), v(-1.98, 0.5, 0.06), v(-1.98, 0.42, 0.06)],
    COL.cold,
    0.026,
    'sesalni',
  );
  // vodni krog: kondenzator → dvižni → radiator → povratni → filter → črpalka → kondenzator
  // kondenzator → (dogrevalnik) → 3-potni ventil → radiatorji ALI bojler → povratni → filter → črpalka
  const segFlowA = pipe([v(1.82, 1.76, -0.2), v(2.32, 1.76, -0.2)], COL.waterHot, 0.024, 'dvizni');
  const segFlowB = pipe([v(2.32, 1.76, -0.2), v(3.08, 1.76, -0.2), v(3.08, 0.96, -0.2), v(3.08, 0.96, -0.6), v(3.2, 0.96, -0.6), v(3.92, 0.96, -0.6)], COL.waterHot, 0.024, 'dvizni');
  const segReturnA = pipe([v(3.92, 0.34, -0.6), v(4.02, 0.34, -0.6), v(4.02, 0.15, -0.6), v(4.02, 0.15, -0.2), v(2.98, 0.15, -0.2)], COL.waterCold, 0.024, 'povratni');
  const segReturn = pipe([v(2.98, 0.15, -0.2), v(1.85, 0.15, -0.2), v(1.85, 0.52, -0.2)], COL.waterCold, 0.024, 'povratni');
  const segDhwIn = pipe([v(2.32, 1.76, -0.2), v(2.32, 1.76, -1.35), v(2.65, 1.76, -1.35), v(2.65, 0.3, -1.35)], COL.waterHot, 0.02);
  const segDhwOut = pipe([v(2.65, 0.3, -1.35), v(2.98, 0.3, -1.35), v(2.98, 0.15, -1.35), v(2.98, 0.15, -0.2)], COL.waterCold, 0.02);
  const segPumpUp = pipe([v(1.85, 0.72, -0.2), v(1.85, 1.46, -0.2), v(1.82, 1.46, -0.2)], COL.waterCold, 0.024);
  pipe([v(2.85, 0.15, -0.2), v(2.85, 0.15, -0.35)], COL.waterCold, 0.014);

  // ---------- delci, ki tečejo po krogih ----------
  const sphere = track(new SphereGeometry(0.024, 8, 6));
  function flow(curves: CurvePath<Vector3>[], colors: number[], count: number) {
    const lengths = curves.map((c) => c.getLength());
    const total = lengths.reduce((a, b) => a + b, 0);
    const mesh = new InstancedMesh(sphere, track(new MeshBasicMaterial({ color: 0xffffff })), count);
    const dummy = new Object3D();
    const color = new Color();
    scene.add(mesh);
    const state = { offset: 0, speed: 0.25, hidden: new Set<number>(), colors };
    const at = (d: number) => {
      let s = ((d % total) + total) % total;
      for (let i = 0; i < curves.length; i++) {
        if (s <= lengths[i]) return { p: curves[i].getPointAt(Math.min(1, s / lengths[i])), seg: i };
        s -= lengths[i];
      }
      return { p: curves[0].getPointAt(0), seg: 0 };
    };
    function update(dt: number) {
      state.offset += dt * state.speed;
      for (let i = 0; i < count; i++) {
        const { p, seg } = at(state.offset + (i / count) * total);
        dummy.position.copy(p);
        dummy.scale.setScalar(state.hidden.has(i) ? 0 : 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, color.set(state.colors[seg]));
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    return { state, update, mesh };
  }
  const REF_HEAT = [0xff6a4d, 0xffad5c, 0x8fd0ff, 0x8fd0ff, 0x5aa9ff];
  // odtajevanje: tok obrnjen – vroč plin v zunanje lamele, notranji prenosnik je zdaj uparjalnik
  const REF_DEFROST = [0x5aa9ff, 0xffad5c, 0xffad5c, 0xff6a4d, 0xff6a4d];
  const refrigerant = flow([segDischarge, segLiquid, segMix, segEvap, segSuction], [...REF_HEAT], 90);
  const water = flow([segFlowA, segFlowB, segReturnA, segReturn, segPumpUp], [0xffc070, 0xffc070, 0x7fe0d6, 0x7fe0d6, 0x7fe0d6], 64);
  const waterDhw = flow([segFlowA, segDhwIn, segDhwOut, segReturn, segPumpUp], [0xffc070, 0xffc070, 0x7fe0d6, 0x7fe0d6, 0x7fe0d6], 52);
  waterDhw.mesh.visible = false;

  // ---------- vidni namigi napak (pokažejo se šele po pregledu) ----------
  const cues = new Group();
  scene.add(cues);
  const cueObjects: Record<Cue, Object3D[]> = { leaves: [], ice: [], 'ice-full': [], oil: [], 'dirty-filter': [], bubbles: [], 'low-water': [], 'frost-drier': [], 'valve-dhw': [] };
  {
    const leafColors = [0xb5651d, 0xd08a2b, 0x8b4513, 0xc9a227];
    const leafGeo = track(new PlaneGeometry(0.09, 0.065));
    const leafMats = leafColors.map((c) => std(c, { side: 2 }));
    const leaf = (pos: Vector3) => {
      const m = new Mesh(leafGeo, leafMats[cueObjects.leaves.length % 4]);
      m.position.copy(pos);
      cues.add(m);
      cueObjects.leaves.push(m);
      return m;
    };
    // listje na lamelah in na tleh pred enoto (ena geometrija, štirje materiali za vse)
    for (let i = 0; i < 46; i++)
      leaf(v(-3.0 + Math.random() * 1.4, 0.2 + Math.random() * 0.75, -0.13 + Math.random() * 0.02)).rotation.set(Math.random() * 0.6, Math.random() * 0.6, Math.random() * Math.PI);
    for (let i = 0; i < 30; i++) leaf(v(-3.3 + Math.random() * 2.1, 0.012, 0.3 + Math.random() * 0.7)).rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI);
    const ice = add(null, new BoxGeometry(1.46, 0.4, 0.14), std(0xf4fbff, { transparent: true, opacity: 0.88, roughness: 0.1, emissive: 0x9fc9e8, emissiveIntensity: 0.35 }), v(-2.3, 0.34, -0.18), cues);
    cueObjects.ice.push(ice);
    const iceFull = add(null, new BoxGeometry(1.5, 1.04, 0.16), std(0xf4fbff, { transparent: true, opacity: 0.9, roughness: 0.1, emissive: 0x9fc9e8, emissiveIntensity: 0.35 }), v(-2.3, 0.66, -0.18), cues);
    cueObjects['ice-full'].push(iceFull);
    const frost = add(null, new CylinderGeometry(0.052, 0.052, 0.12, 16), std(0xffffff, { transparent: true, opacity: 0.85, roughness: 0.9 }), v(-1.06, 0.95, 0.06), cues);
    frost.rotation.z = Math.PI / 2;
    cueObjects['frost-drier'].push(frost);
    const oil = add(null, new CircleGeometry(0.07, 20), new MeshBasicMaterial({ color: 0x2a1d0e, transparent: true, opacity: 0.85 }), v(-1.6, 0.86, 0.09), cues);
    const drip = add(null, new CircleGeometry(0.12, 20), new MeshBasicMaterial({ color: 0x2a1d0e, transparent: true, opacity: 0.6 }), v(-1.6, 0.015, 0.15), cues);
    drip.rotation.x = -Math.PI / 2;
    cueObjects.oil.push(oil, drip);
    cueObjects['dirty-filter'].push(add(null, new SphereGeometry(0.075, 12, 8), std(0x5b3a1e, { roughness: 1 }), v(2.45, 0.15, -0.2), cues));
    const bubbleGeo = track(new SphereGeometry(0.022, 8, 6));
    const bubbleMat = std(0xffffff, { transparent: true, opacity: 0.85 });
    for (let i = 0; i < 14; i++) {
      const b = new Mesh(bubbleGeo, bubbleMat);
      b.position.set(3.08 + (Math.random() - 0.5) * 0.05, 1.0 + Math.random() * 0.7, -0.2);
      b.scale.setScalar(0.8 + Math.random() * 0.5);
      cues.add(b);
      cueObjects.bubbles.push(b);
    }
  }
  // Senčilnike prevedi v ozadju (brez zamrznitve strani), skupaj s skritimi namigi napak.
  let ready = false;
  for (const list of Object.values(cueObjects)) for (const o of list) o.visible = true;
  renderer
    .compileAsync(scene, camera)
    .catch(() => {})
    .finally(() => {
      resetCues();
      ready = true;
      resize();
    });

  let mode: OperatingMode = 'ogrevanje';
  let fanOn = true;
  let melt = 0; // 0..1 – led se med odtajevanjem stopi
  const iceMat = (cueObjects['ice-full'][0] as Mesh).material as MeshStandardMaterial;
  const setTube = (c: CurvePath<Vector3>, col: number) => tubeMat.get(c)?.color.setHex(col);
  function setOperatingMode(m: OperatingMode) {
    mode = m;
    const defrost = m === 'odtajevanje';
    const dhw = m === 'sanitarna';
    // 4-potni ventil: obrne tok in barve (vroč plin gre v zunanje lamele)
    refrigerant.state.speed = (defrost ? -1 : 1) * Math.abs(refrigerant.state.speed || 0.25);
    refrigerant.state.colors = defrost ? [...REF_DEFROST] : [...REF_HEAT];
    setTube(segDischarge, defrost ? COL.cold : COL.hot);
    setTube(segMix, defrost ? COL.liquid : COL.coldGas);
    setTube(segEvap, defrost ? COL.hot : COL.coldGas);
    setTube(segSuction, defrost ? COL.hot : COL.cold);
    fanOn = !defrost; // med odtajevanjem ventilator stoji
    melt = 0;
    iceMat.opacity = 0.9;
    for (const o of cueObjects['ice-full']) o.visible = defrost;
    // 3-potni ventil: voda v bojler namesto v radiatorje
    water.mesh.visible = !dhw;
    waterDhw.mesh.visible = dhw;
    valveArrow.rotation.z = dhw ? -Math.PI / 2 : 0;
  }

  function resetCues() {
    for (const list of Object.values(cueObjects)) for (const o of list) o.visible = false;
    needle.rotation.z = -0.2;
    valveArrow.rotation.z = mode === 'sanitarna' ? -Math.PI / 2 : 0;
  }
  resetCues();

  // ---------- zaslon krmilnika ----------
  function setDisplay(lines: string[], alarm = false) {
    const g = screen.getContext('2d')!;
    g.fillStyle = alarm ? '#3a0e0a' : '#0d2a24';
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = alarm ? '#ff7b6b' : '#7dffcf';
    g.font = 'bold 34px system-ui, sans-serif';
    g.fillText(lines[0] ?? '', 14, 50);
    g.font = '22px system-ui, sans-serif';
    lines.slice(1, 3).forEach((l, i) => g.fillText(l, 14, 86 + i * 28));
    screenTex.needsUpdate = true;
  }
  setDisplay(['35 °C', 'Ogrevanje', 'OK']);

  // ---------- poudarek in fokus ----------
  let highlighted: string | null = null;
  const savedEmissive = new Map<Mesh, number>();
  function highlight(id: string | null) {
    for (const [m, e] of savedEmissive) (m.material as MeshStandardMaterial).emissive?.setHex(e);
    savedEmissive.clear();
    highlighted = id;
    if (!id) return;
    for (const m of partMeshes.get(id) ?? []) {
      const mat = m.material as MeshStandardMaterial;
      if (!mat.emissive) continue;
      // vsak del ima svoj material, da poudarek ne obarva sosedov
      if (!m.userData.ownMat) {
        m.material = mat.clone();
        track(m.material as Material);
        m.userData.ownMat = true;
      }
      savedEmissive.set(m, (m.material as MeshStandardMaterial).emissive.getHex());
      (m.material as MeshStandardMaterial).emissive.setHex(0xa86b12);
    }
  }

  let tween: { from: Vector3; to: Vector3; camFrom: Vector3; camTo: Vector3; t: number } | null = null;
  const HOME = { target: v(0.45, 0.85, -0.2), cam: v(0.9, 2.3, 5.6) };
  let userMoved = false;
  controls.addEventListener('start', () => (userMoved = true));
  /** Kamera tako daleč, da je cela naprava (≈ 7,4 m široka) na zaslonu – na telefonu dlje, na računalniku bližje. */
  function fitHome(aspect: number) {
    const vfov = (camera.fov * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    const dist = Math.max(3.4, 3.9 / Math.tan(hfov / 2));
    const dir = v(0.12, 0.34, 1).normalize();
    HOME.cam = HOME.target.clone().add(dir.multiplyScalar(dist));
  }
  function focus(id: string | null) {
    const target = id ? ANCHORS[id] : HOME.target;
    if (!target) return;
    const camTo = id ? target.clone().add(v(0.4, 0.9, 2.6)) : HOME.cam;
    tween = { from: controls.target.clone(), to: target.clone(), camFrom: camera.position.clone(), camTo, t: 0 };
  }

  // ---------- izbira dela z dotikom ----------
  const ray = new Raycaster();
  const ndc = new Vector2();
  let pickCb: ((id: string) => void) | null = null;
  let down: { x: number; y: number } | null = null;
  const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
  const onUp = (e: PointerEvent) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    if (hit?.object.userData.part) pickCb?.(hit.object.userData.part);
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);

  // ---------- zanka: riše samo, ko je platno vidno ----------
  let running = true;
  let visible = true;
  let last = performance.now();
  let raf = 0;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(canvas);
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!running || !ready || !visible || document.hidden) return;
    if (tween) {
      tween.t = Math.min(1, tween.t + dt / 0.7);
      const k = ease(tween.t);
      controls.target.lerpVectors(tween.from, tween.to, k);
      camera.position.lerpVectors(tween.camFrom, tween.camTo, k);
      if (tween.t >= 1) tween = null;
    }
    if (!opts.reducedMotion) {
      if (fanOn) fan.rotation.z -= dt * 9 * Math.max(0.2, Math.abs(refrigerant.state.speed) / 0.25);
      refrigerant.update(dt);
      if (water.mesh.visible) water.update(dt);
      if (waterDhw.mesh.visible) waterDhw.update(dt);
      if (mode === 'odtajevanje' && melt < 1) {
        melt = Math.min(1, melt + dt / 8);
        iceMat.opacity = 0.9 * (1 - melt);
        cueObjects['ice-full'][0].scale.y = 1 - melt * 0.85;
      }
      for (const b of cueObjects.bubbles) if (b.visible) b.position.y = 1.0 + ((b.position.y - 1.0 + dt * 0.25) % 0.75);
    }
    if (highlighted) {
      const pulse = 0.5 + 0.5 * Math.sin(now / 220);
      for (const m of partMeshes.get(highlighted) ?? []) (m.material as MeshStandardMaterial).emissiveIntensity = 0.4 + pulse * 0.6;
    }
    controls.update();
    renderer.render(scene, camera);
  }
  refrigerant.update(0);
  water.update(0);
  waterDhw.update(0);
  raf = requestAnimationFrame(frame);

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // na ozkem zaslonu kamera nazaj, da je vidna cela naprava
    camera.fov = w / h < 0.9 ? 50 : 38;
    camera.updateProjectionMatrix();
    fitHome(camera.aspect);
    if (!userMoved && !tween && !highlighted) camera.position.copy(HOME.cam);
    // Izriši takoj: ne čakaj na animacijo (ta v ozadju ali pri »manj gibanja« ne teče).
    if (ready) {
      controls.update();
      renderer.render(scene, camera);
    }
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const tmp = new Vector3();
  return {
    anchors(ids) {
      const r = canvas.getBoundingClientRect();
      return ids.map((id) => {
        const p = ANCHORS[id];
        if (!p) return { id, x: 0, y: 0, visible: false };
        tmp.copy(p).project(camera);
        return { id, x: (tmp.x * 0.5 + 0.5) * r.width, y: (-tmp.y * 0.5 + 0.5) * r.height, visible: tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05 };
      });
    },
    highlight,
    focus,
    reveal(cue) {
      if (cue === 'low-water') needle.rotation.z = 1.1;
      if (cue === 'valve-dhw') {
        valveArrow.rotation.z = -Math.PI / 2;
        water.mesh.visible = false;
        waterDhw.mesh.visible = true;
      }
      for (const o of cueObjects[cue]) o.visible = true;
    },
    resetCues,
    setDisplay,
    setOperatingMode,
    setFlowSpeed(r, w) {
      refrigerant.state.speed = 0.25 * r * (mode === 'odtajevanje' ? -1 : 1);
      water.state.speed = 0.25 * w;
      waterDhw.state.speed = 0.25 * w;
      // premalo hladiva: v tekočinskem vodu so vrzeli
      refrigerant.state.hidden = new Set(r < 0.8 ? [...Array(90).keys()].filter((i) => i % 3 === 0) : []);
    },
    onPick(cb) {
      pickCb = cb;
    },
    resize,
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      controls.dispose();
      for (const d of disposables) d.dispose();
      renderer.dispose();
    },
  };
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
