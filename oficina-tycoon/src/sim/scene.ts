import * as THREE from 'three';
import { CORES_CARRO, criarCamiao, criarCarro, criarCone } from './models';
import type { TruckMesh } from './models';
import { construirMundo, naEstrada, pontoNaEstrada, TAM_MUNDO } from './world';
import { passoTruck, posAtrelado, truckInicial, velocidadeKmh } from './truck';
import type { Controls, TruckState } from './truck';

/** Câmaras no estilo ETS2. */
export const CAMERAS = [
  { id: 'cabine', nome: 'Cabine', icone: '🪟' },
  { id: 'capo', nome: 'Capô', icone: '🔭' },
  { id: 'perseguicao', nome: 'Perseguição', icone: '🎥' },
  { id: 'cinema', nome: 'Cinemática', icone: '🎬' },
  { id: 'retrovisor', nome: 'Retrovisor', icone: '🪞' },
  { id: 'roda', nome: 'Roda', icone: '🛞' },
  { id: 'topo', nome: 'Aérea', icone: '🛰️' },
] as const;

export type CameraId = (typeof CAMERAS)[number]['id'];

export interface Missao {
  id: string;
  cliente: string;
  servico: string;
  pagamento: number;
  x: number;
  z: number;
  corCarro: number;
  tipoCarro: number;
}

export type FaseMissao = 'sem-missao' | 'a-caminho' | 'a-carregar' | 'a-voltar' | 'entregue';

export interface Telemetria {
  kmh: number;
  rpm: number;
  marcha: number;
  distancia: number; // ao alvo atual
  fase: FaseMissao;
  carregado: boolean;
  seta: number; // ângulo relativo ao alvo, rad
}

const OFICINA = new THREE.Vector3(30, 0, 22);
const RAIO_CARREGAR = 9;
const RAIO_ENTREGAR = 12;

export class Jogo3D {
  renderer: THREE.WebGLRenderer;
  cena: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  truck: TruckState;
  malha: TruckMesh;
  controls: Controls;
  cameraId: CameraId = 'perseguicao';

  private carroMissao: THREE.Group | null = null;
  private cones: THREE.Group[] = [];
  private trafego: { g: THREE.Group; vel: number; dir: THREE.Vector2 }[] = [];
  private camPos = new THREE.Vector3();
  private camAlvo = new THREE.Vector3();
  private relogio = new THREE.Clock();
  private raf = 0;
  private carregado = false;
  private missao: Missao | null = null;
  private fase: FaseMissao = 'sem-missao';
  private luzSol: THREE.DirectionalLight;
  private farolL: THREE.SpotLight;
  private farolR: THREE.SpotLight;
  private noite = false;

  onTelemetria?: (t: Telemetria) => void;
  onEvento?: (tipo: 'carregado' | 'entregue', missao: Missao) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = true;

    this.cena = new THREE.Scene();
    this.cena.background = new THREE.Color(0x8fb6d9);
    this.cena.fog = new THREE.Fog(0x8fb6d9, 90, 300);

    this.camera = new THREE.PerspectiveCamera(62, 1, 0.25, 900);

    // ---- Luz ----
    this.cena.add(new THREE.HemisphereLight(0xbcd8f0, 0x4a5340, 1.05));
    const sol = new THREE.DirectionalLight(0xfff2d8, 1.9);
    sol.position.set(70, 110, 50);
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    sol.shadow.bias = -0.0016;
    const c = 62;
    sol.shadow.camera.left = -c;
    sol.shadow.camera.right = c;
    sol.shadow.camera.top = c;
    sol.shadow.camera.bottom = -c;
    sol.shadow.camera.far = 320;
    this.cena.add(sol);
    this.cena.add(sol.target);
    this.luzSol = sol;

    construirMundo(this.cena);

    // ---- Camião ----
    this.truck = truckInicial(OFICINA.x, OFICINA.z + 14, Math.PI);
    this.malha = criarCamiao(0xff8c1a);
    this.cena.add(this.malha.grupo);
    this.controls = {
      acelerador: 0, travao: 0, volante: 0, travaoMao: false, marchaAtras: false,
    };

    // faróis reais (spotlights)
    const mkFarol = () => {
      const s = new THREE.SpotLight(0xfff0cc, 0, 65, 0.55, 0.45, 1.4);
      s.visible = false;
      this.cena.add(s);
      this.cena.add(s.target);
      return s;
    };
    this.farolL = mkFarol();
    this.farolR = mkFarol();

    this.criarTrafego();
    this.resize();
  }

  // ---------------- Tráfego ambiente ----------------
  private criarTrafego() {
    let seed = 7;
    const rng = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < 16; i++) {
      const p = pontoNaEstrada(rng);
      const g = criarCarro(CORES_CARRO[i % CORES_CARRO.length], i % 3);
      const horiz = Math.abs(p.x) > Math.abs(p.z) ? false : true;
      const dir = horiz
        ? new THREE.Vector2(0, rng() < 0.5 ? 1 : -1)
        : new THREE.Vector2(rng() < 0.5 ? 1 : -1, 0);
      g.position.set(p.x, 0, p.z);
      g.rotation.y = Math.atan2(dir.x, dir.y);
      this.cena.add(g);
      this.trafego.push({ g, vel: 7 + rng() * 9, dir });
    }
  }

  private moverTrafego(dt: number) {
    for (const t of this.trafego) {
      t.g.position.x += t.dir.x * t.vel * dt;
      t.g.position.z += t.dir.y * t.vel * dt;
      const lim = TAM_MUNDO / 2;
      if (Math.abs(t.g.position.x) > lim || Math.abs(t.g.position.z) > lim) {
        t.dir.multiplyScalar(-1);
        t.g.rotation.y = Math.atan2(t.dir.x, t.dir.y);
      }
    }
  }

  // ---------------- Missões ----------------
  definirMissao(m: Missao) {
    this.limparMissao();
    this.missao = m;
    this.fase = 'a-caminho';
    const carro = criarCarro(m.corCarro, m.tipoCarro);
    carro.position.set(m.x, 0, m.z);
    carro.rotation.y = Math.random() * Math.PI * 2;
    // inclinado, como avariado na berma
    carro.rotation.z = 0.03;
    this.cena.add(carro);
    this.carroMissao = carro;
    for (let i = 0; i < 3; i++) {
      const cone = criarCone();
      const ang = (i / 3) * Math.PI * 2;
      cone.position.set(m.x + Math.cos(ang) * 3.5, 0, m.z + Math.sin(ang) * 3.5);
      this.cena.add(cone);
      this.cones.push(cone);
    }
  }

  private limparMissao() {
    if (this.carroMissao) {
      this.carroMissao.parent?.remove(this.carroMissao);
      this.carroMissao = null;
    }
    for (const c of this.cones) c.parent?.remove(c);
    this.cones = [];
    this.carregado = false;
    this.fase = 'sem-missao';
    this.missao = null;
  }

  /** Chamado pelo botão de guinchar. Devolve msg de erro ou null. */
  tentarGuinchar(): string | null {
    if (!this.missao) return 'Não tens nenhuma missão ativa.';
    if (this.carregado) return 'Já tens um carro no reboque.';
    const d = Math.hypot(this.truck.x - this.missao.x, this.truck.z - this.missao.z);
    if (d > RAIO_CARREGAR) return `Aproxima-te do carro (${Math.round(d)} m).`;
    if (velocidadeKmh(this.truck) > 5) return 'Pára o camião primeiro.';
    this.carregado = true;
    this.fase = 'a-voltar';
    for (const c of this.cones) c.parent?.remove(c);
    this.cones = [];
    if (this.carroMissao) {
      this.carroMissao.parent?.remove(this.carroMissao);
      this.malha.slotCarro.add(this.carroMissao);
      this.carroMissao.position.set(0, 0, 0);
      this.carroMissao.rotation.set(0, 0, 0);
    }
    this.onEvento?.('carregado', this.missao);
    return null;
  }

  /** Chamado ao chegar à oficina. */
  tentarEntregar(): string | null {
    if (!this.carregado || !this.missao) return 'Não tens carro para entregar.';
    const d = Math.hypot(this.truck.x - OFICINA.x, this.truck.z - OFICINA.z);
    if (d > RAIO_ENTREGAR) return `Leva o carro à oficina (${Math.round(d)} m).`;
    if (velocidadeKmh(this.truck) > 5) return 'Pára o camião primeiro.';
    const m = this.missao;
    this.limparMissao();
    this.fase = 'entregue';
    this.onEvento?.('entregue', m);
    return null;
  }

  definirNoite(v: boolean) {
    this.noite = v;
    if (v) {
      this.cena.background = new THREE.Color(0x0a1220);
      this.cena.fog = new THREE.Fog(0x0a1220, 40, 190);
      this.luzSol.intensity = 0.22;
      this.luzSol.color.set(0x9db4d8);
      this.farolL.visible = true;
      this.farolR.visible = true;
      this.farolL.intensity = 900;
      this.farolR.intensity = 900;
    } else {
      this.cena.background = new THREE.Color(0x8fb6d9);
      this.cena.fog = new THREE.Fog(0x8fb6d9, 90, 300);
      this.luzSol.intensity = 1.9;
      this.luzSol.color.set(0xfff2d8);
      this.farolL.visible = false;
      this.farolR.visible = false;
    }
  }

  get estaNoite() { return this.noite; }
  get temCarga() { return this.carregado; }
  get faseAtual() { return this.fase; }

  // ---------------- Câmaras ----------------
  private atualizarCamera(dt: number) {
    const t = this.truck;
    const sh = Math.sin(t.heading);
    const ch = Math.cos(t.heading);
    const pos = new THREE.Vector3();
    const alvo = new THREE.Vector3();
    let suave = 1 - Math.exp(-8 * dt);
    let fov = 62;

    // local (x=direita, y=cima, z=frente) -> mundo
    const L = (lx: number, ly: number, lz: number, out: THREE.Vector3) =>
      out.set(t.x + lx * ch + lz * sh, ly, t.z - lx * sh + lz * ch);

    switch (this.cameraId) {
      case 'cabine': {
        // Sentado ao volante, lado esquerdo da cabine — a vista icónica do ETS2
        L(-0.58, 2.5, 1.75, pos);
        L(-0.58, 2.25, 26, alvo);
        fov = 70;
        suave = 1; // rígida à cabine
        break;
      }
      case 'capo': {
        L(0, 2.2, 3.0, pos);
        L(0, 1.75, 28, alvo);
        fov = 72;
        suave = 1;
        break;
      }
      case 'retrovisor': {
        // Espelho lateral esquerdo: olha para trás ao longo do atrelado
        L(-1.75, 2.35, 2.1, pos);
        const a = posAtrelado(t);
        alvo.set(a.x, 1.7, a.z);
        fov = 74;
        suave = 1;
        break;
      }
      case 'roda': {
        // Câmara na cava da roda dianteira direita
        L(2.6, 0.9, 2.0, pos);
        L(0.4, 1.15, 5.0, alvo);
        fov = 62;
        suave = 1;
        break;
      }
      case 'cinema': {
        // câmara larga, ligeiramente lateral, com atraso — trailer-style
        pos.set(t.x - sh * 15 + ch * 9, 5.6, t.z - ch * 15 - sh * 9);
        alvo.set(t.x + sh * 6, 2.2, t.z + ch * 6);
        fov = 46;
        suave = 1 - Math.exp(-2.2 * dt);
        break;
      }
      case 'topo': {
        pos.set(t.x, 46, t.z - 6);
        alvo.set(t.x, 0, t.z);
        fov = 55;
        suave = 1 - Math.exp(-6 * dt);
        break;
      }
      case 'perseguicao':
      default: {
        const recuo = 15 + Math.min(6, velocidadeKmh(t) / 14);
        pos.set(t.x - sh * recuo, 7.2, t.z - ch * recuo);
        alvo.set(t.x + sh * 8, 2.4, t.z + ch * 8);
        fov = 60 + Math.min(10, velocidadeKmh(t) / 9);
        suave = 1 - Math.exp(-5.5 * dt);
        break;
      }
    }

    this.camPos.lerp(pos, suave);
    this.camAlvo.lerp(alvo, suave);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camAlvo);
    if (Math.abs(this.camera.fov - fov) > 0.1) {
      this.camera.fov += (fov - this.camera.fov) * Math.min(1, 4 * dt);
      this.camera.updateProjectionMatrix();
    }
  }

  mudarCamera(id: CameraId) {
    this.cameraId = id;
    // salto imediato para evitar varrimento estranho entre vistas
    this.camPos.set(this.truck.x, 3, this.truck.z);
  }

  proximaCamera(): CameraId {
    const i = CAMERAS.findIndex((c) => c.id === this.cameraId);
    const n = CAMERAS[(i + 1) % CAMERAS.length].id;
    this.mudarCamera(n);
    return n;
  }

  // ---------------- Loop ----------------
  private atualizarMalha() {
    const t = this.truck;
    this.malha.trator.position.set(t.x, 0, t.z);
    this.malha.trator.rotation.y = t.heading;

    const a = posAtrelado(t);
    this.malha.atrelado.position.set(a.x, 0, a.z);
    this.malha.atrelado.rotation.y = t.atreladoHeading;

    for (const w of this.malha.rodas) w.rotation.x = t.rotacaoRoda;
    for (const w of this.malha.rodasDir) w.rotation.y = t.direcao;

    // rampa desce quando estás perto do carro e parado
    let alvoRampa = 0;
    if (this.missao && !this.carregado) {
      const d = Math.hypot(t.x - this.missao.x, t.z - this.missao.z);
      if (d < RAIO_CARREGAR && velocidadeKmh(t) < 5) alvoRampa = -0.42;
    }
    this.malha.rampa.rotation.x += (alvoRampa - this.malha.rampa.rotation.x) * 0.08;

    // luzes de travão
    const aTravar = this.controls.travao > 0.05 || this.controls.travaoMao;
    for (const l of this.malha.luzesTravao) {
      const m = l.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity += ((aTravar ? 2.4 : 0.35) - m.emissiveIntensity) * 0.25;
    }

    // faróis seguem o camião
    if (this.noite) {
      const sh = Math.sin(t.heading);
      const ch = Math.cos(t.heading);
      for (const [luz, s] of [[this.farolL, -1], [this.farolR, 1]] as const) {
        luz.position.set(t.x + sh * 3 + ch * s * 0.8, 1.3, t.z + ch * 3 - sh * s * 0.8);
        luz.target.position.set(t.x + sh * 40 + ch * s * 3, 0, t.z + ch * 40 - sh * s * 3);
        luz.target.updateMatrixWorld();
      }
    }

    // sombra do sol acompanha o camião
    this.luzSol.position.set(t.x + 70, 110, t.z + 50);
    this.luzSol.target.position.set(t.x, 0, t.z);
    this.luzSol.target.updateMatrixWorld();
  }

  private colisoes() {
    // manter dentro do mundo
    const lim = TAM_MUNDO / 2 + 30;
    const t = this.truck;
    if (Math.abs(t.x) > lim) { t.x = Math.sign(t.x) * lim; t.vel *= 0.3; }
    if (Math.abs(t.z) > lim) { t.z = Math.sign(t.z) * lim; t.vel *= 0.3; }
    // fora de estrada => arrasta
    if (!naEstrada(t.x, t.z) && Math.abs(t.vel) > 9) {
      t.vel *= 0.985;
    }
  }

  private emitir() {
    const t = this.truck;
    let dx = 0;
    let dz = 0;
    if (this.fase === 'a-caminho' && this.missao) {
      dx = this.missao.x - t.x;
      dz = this.missao.z - t.z;
    } else if (this.carregado || this.fase === 'a-voltar') {
      dx = OFICINA.x - t.x;
      dz = OFICINA.z - t.z;
    }
    const dist = Math.hypot(dx, dz);
    let seta = 0;
    if (dist > 0.1) {
      const angAlvo = Math.atan2(dx, dz);
      seta = angAlvo - t.heading;
      while (seta > Math.PI) seta -= Math.PI * 2;
      while (seta < -Math.PI) seta += Math.PI * 2;
    }
    this.onTelemetria?.({
      kmh: velocidadeKmh(t),
      rpm: t.motorRPM,
      marcha: t.marcha,
      distancia: dist,
      fase: this.fase,
      carregado: this.carregado,
      seta,
    });
  }

  iniciar() {
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, this.relogio.getDelta());
      passoTruck(this.truck, this.controls, dt, this.carregado);
      this.colisoes();
      this.moverTrafego(dt);
      this.atualizarMalha();
      this.atualizarCamera(dt);
      this.renderer.render(this.cena, this.camera);
      this.emitir();
    };
    this.relogio.getDelta();
    loop();
  }

  parar() { cancelAnimationFrame(this.raf); }

  resize() {
    const el = this.renderer.domElement;
    const w = el.clientWidth || window.innerWidth;
    const h = el.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  destruir() {
    this.parar();
    this.renderer.dispose();
  }
}

export { OFICINA };
