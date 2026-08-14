import * as THREE from 'three';
import { criarPoste, criarPredio, criarOficina } from './models';

export const TAM_MUNDO = 400;
export const LARG_ESTRADA = 14;
export const ESPACO = 80; // distância entre eixos da grelha de ruas
export const OFICINA_POS = new THREE.Vector3(0, 0, 0);

/** Coordenadas dos eixos da grelha (x e z). */
export const EIXOS = [-160, -80, 0, 80, 160];

/** Distância do ponto à estrada mais próxima (0 = em cima do eixo). */
export function distanciaEstrada(x: number, z: number) {
  let dx = Infinity;
  let dz = Infinity;
  for (const e of EIXOS) {
    dx = Math.min(dx, Math.abs(x - e));
    dz = Math.min(dz, Math.abs(z - e));
  }
  return Math.min(dx, dz);
}

export const naEstrada = (x: number, z: number) =>
  distanciaEstrada(x, z) < LARG_ESTRADA / 2;

/** Devolve um ponto aleatório sobre uma faixa de rodagem. */
export function pontoNaEstrada(rng: () => number) {
  const eixo = EIXOS[Math.floor(rng() * EIXOS.length)];
  const along = (rng() - 0.5) * 2 * (TAM_MUNDO / 2 - 20);
  const faixa = (rng() < 0.5 ? -1 : 1) * 3.5;
  return rng() < 0.5
    ? { x: eixo + faixa, z: along }
    : { x: along, z: eixo + faixa };
}

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function construirMundo(cena: THREE.Scene) {
  const rng = mulberry(20260814);

  // ---------- Chão ----------
  const chao = new THREE.Mesh(
    new THREE.PlaneGeometry(TAM_MUNDO * 1.6, TAM_MUNDO * 1.6),
    new THREE.MeshStandardMaterial({ color: 0x3d5c3a, roughness: 1 }),
  );
  chao.rotation.x = -Math.PI / 2;
  chao.receiveShadow = true;
  cena.add(chao);

  // ---------- Estradas ----------
  const asfalto = new THREE.MeshStandardMaterial({ color: 0x2f333b, roughness: 0.95 });
  const linha = new THREE.MeshStandardMaterial({
    color: 0xe8dfa0,
    roughness: 0.8,
  });

  const comprimento = TAM_MUNDO * 1.2;
  for (const e of EIXOS) {
    for (const eixoZ of [true, false]) {
      const g = new THREE.Mesh(
        new THREE.PlaneGeometry(LARG_ESTRADA, comprimento),
        asfalto,
      );
      g.rotation.x = -Math.PI / 2;
      g.position.y = 0.02;
      if (eixoZ) g.position.x = e;
      else {
        g.rotation.z = Math.PI / 2;
        g.position.z = e;
      }
      g.receiveShadow = true;
      cena.add(g);

      // marcação central tracejada
      const traco = new THREE.PlaneGeometry(0.28, 3.2);
      const n = Math.floor(comprimento / 8);
      const inst = new THREE.InstancedMesh(traco, linha, n);
      const m4 = new THREE.Matrix4();
      for (let i = 0; i < n; i++) {
        const p = -comprimento / 2 + i * 8 + 4;
        if (eixoZ) m4.makeTranslation(e, 0.035, p);
        else m4.makeTranslation(p, 0.035, e);
        const rot = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
        if (!eixoZ) rot.multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
        m4.multiply(rot);
        inst.setMatrixAt(i, m4);
      }
      inst.instanceMatrix.needsUpdate = true;
      cena.add(inst);
    }
  }

  // ---------- Oficina (base) ----------
  const of = criarOficina();
  of.position.set(30, 0, 30);
  cena.add(of);

  // parque em frente à oficina
  const parque = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 22),
    new THREE.MeshStandardMaterial({ color: 0x3a3f47, roughness: 0.95 }),
  );
  parque.rotation.x = -Math.PI / 2;
  parque.position.set(30, 0.03, 18);
  parque.receiveShadow = true;
  cena.add(parque);

  // ---------- Quarteirões ----------
  const ocupado = (x: number, z: number, r: number) => {
    if (distanciaEstrada(x, z) < LARG_ESTRADA / 2 + r + 2) return true;
    if (Math.hypot(x - 30, z - 26) < 26) return true; // zona da oficina
    return false;
  };

  for (let i = 0; i < 150; i++) {
    const x = (rng() - 0.5) * (TAM_MUNDO - 40);
    const z = (rng() - 0.5) * (TAM_MUNDO - 40);
    const w = 8 + rng() * 14;
    const d = 8 + rng() * 14;
    const h = 6 + rng() * 30;
    if (ocupado(x, z, Math.max(w, d) / 2)) continue;
    const p = criarPredio(w, h, d, rng());
    p.position.set(x, 0, z);
    cena.add(p);
  }

  // ---------- Árvores (instanciadas: 2 draw calls no total) ----------
  {
    const transformacoes: THREE.Matrix4[] = [];
    for (let i = 0; i < 260; i++) {
      const x = (rng() - 0.5) * TAM_MUNDO * 1.35;
      const z = (rng() - 0.5) * TAM_MUNDO * 1.35;
      if (distanciaEstrada(x, z) < LARG_ESTRADA / 2 + 3) continue;
      if (Math.hypot(x - 30, z - 26) < 28) continue;
      const esc = 0.7 + rng() * 0.8;
      transformacoes.push(
        new THREE.Matrix4().compose(
          new THREE.Vector3(x, 0, z),
          new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0), rng() * Math.PI,
          ),
          new THREE.Vector3(esc, esc, esc),
        ),
      );
    }
    const n = transformacoes.length;
    const troncoGeo = new THREE.CylinderGeometry(0.18, 0.26, 2.2, 6);
    troncoGeo.translate(0, 1.1, 0);
    const copaGeo = new THREE.IcosahedronGeometry(1.5, 0);
    copaGeo.translate(0, 3.0, 0);
    const troncos = new THREE.InstancedMesh(
      troncoGeo,
      new THREE.MeshStandardMaterial({ color: 0x5a4232, roughness: 0.95 }),
      n,
    );
    const copas = new THREE.InstancedMesh(
      copaGeo,
      new THREE.MeshStandardMaterial({ color: 0x2f7a3f, roughness: 0.95 }),
      n,
    );
    transformacoes.forEach((m, i) => {
      troncos.setMatrixAt(i, m);
      copas.setMatrixAt(i, m);
    });
    troncos.instanceMatrix.needsUpdate = true;
    copas.instanceMatrix.needsUpdate = true;
    troncos.castShadow = true;
    copas.castShadow = true;
    cena.add(troncos, copas);
  }

  // ---------- Postes de luz ----------
  for (const e of EIXOS) {
    for (let p = -TAM_MUNDO / 2; p < TAM_MUNDO / 2; p += 42) {
      const a = criarPoste();
      a.position.set(e + LARG_ESTRADA / 2 + 1.2, 0, p);
      a.rotation.y = Math.PI;
      cena.add(a);
      const b = criarPoste();
      b.position.set(p, 0, e + LARG_ESTRADA / 2 + 1.2);
      b.rotation.y = -Math.PI / 2;
      cena.add(b);
    }
  }

  return { oficina: new THREE.Vector3(30, 0, 22) };
}
