import * as THREE from 'three';

const mat = (cor: number, rough = 0.7, metal = 0.1) =>
  new THREE.MeshStandardMaterial({ color: cor, roughness: rough, metalness: metal });

const caixa = (
  w: number, h: number, d: number, m: THREE.Material,
  x = 0, y = 0, z = 0,
) => {
  const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  g.position.set(x, y, z);
  g.castShadow = true;
  g.receiveShadow = true;
  return g;
};

function roda(raio = 0.55, larg = 0.34) {
  const g = new THREE.Group();
  const pneu = new THREE.Mesh(
    new THREE.CylinderGeometry(raio, raio, larg, 16),
    mat(0x14161c, 0.95, 0),
  );
  pneu.rotation.z = Math.PI / 2;
  pneu.castShadow = true;
  g.add(pneu);
  const jante = new THREE.Mesh(
    new THREE.CylinderGeometry(raio * 0.55, raio * 0.55, larg + 0.03, 12),
    mat(0xb8c0cc, 0.35, 0.85),
  );
  jante.rotation.z = Math.PI / 2;
  g.add(jante);
  return g;
}

export interface TruckMesh {
  grupo: THREE.Group;
  trator: THREE.Group;
  atrelado: THREE.Group;
  rodas: THREE.Group[];
  rodasDir: THREE.Group[];
  rampa: THREE.Mesh;
  slotCarro: THREE.Object3D;
  farois: THREE.Group;
  luzesTravao: THREE.Mesh[];
}

/** Camião-reboque (tow truck) com plataforma basculante. */
export function criarCamiao(cor = 0xff8c1a): TruckMesh {
  const grupo = new THREE.Group();

  // ---------- TRATOR ----------
  const trator = new THREE.Group();
  const corpo = mat(cor, 0.45, 0.35);
  const escuro = mat(0x1a1e28, 0.6, 0.4);
  const vidro = new THREE.MeshStandardMaterial({
    color: 0x18384f, roughness: 0.08, metalness: 0.9,
    transparent: true, opacity: 0.72,
  });

  // chassis
  trator.add(caixa(2.1, 0.3, 5.6, escuro, 0, 0.75, 0.2));
  // cabine
  trator.add(caixa(2.45, 1.85, 2.5, corpo, 0, 1.85, 1.55));
  // teto/spoiler
  trator.add(caixa(2.3, 0.45, 1.4, corpo, 0, 2.95, 1.3));
  // grelha frontal
  trator.add(caixa(2.3, 0.85, 0.25, escuro, 0, 1.35, 2.82));
  // para-choques
  trator.add(caixa(2.5, 0.42, 0.3, mat(0x2b3240, 0.5, 0.6), 0, 0.82, 2.9));

  // vidros
  const pb = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 0.1), vidro);
  pb.position.set(0, 2.15, 2.76);
  pb.rotation.x = -0.14;
  trator.add(pb);
  for (const s of [-1, 1]) {
    const lat = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 1.5), vidro);
    lat.position.set(s * 1.22, 2.05, 1.6);
    trator.add(lat);
  }

  // retrovisores
  for (const s of [-1, 1]) {
    const braco = caixa(0.08, 0.5, 0.08, escuro, s * 1.42, 2.3, 2.35);
    trator.add(braco);
    const esp = caixa(0.12, 0.55, 0.28, mat(0x8fa3bb, 0.2, 0.9), s * 1.52, 2.15, 2.35);
    trator.add(esp);
  }

  // tubos de escape
  for (const s of [-1, 1]) {
    const t = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 2.4, 8),
      mat(0xa8b2c0, 0.3, 0.95),
    );
    t.position.set(s * 1.3, 2.1, 0.5);
    trator.add(t);
  }

  // faróis
  const farois = new THREE.Group();
  const matFarol = new THREE.MeshStandardMaterial({
    color: 0xfff0c0, emissive: 0xffd98a, emissiveIntensity: 1.6,
  });
  for (const s of [-1, 1]) {
    farois.add(caixa(0.55, 0.3, 0.12, matFarol, s * 0.8, 1.28, 2.94));
  }
  // luzes de presença no teto (marker lights, muito ETS2)
  for (const s of [-1.5, -0.5, 0.5, 1.5]) {
    const m = caixa(0.14, 0.1, 0.12, new THREE.MeshStandardMaterial({
      color: 0xffb020, emissive: 0xff9500, emissiveIntensity: 1.2,
    }), s * 0.62, 3.2, 1.75);
    farois.add(m);
  }
  trator.add(farois);

  // ---------- ATRELADO (plataforma porta-carros) ----------
  const atrelado = new THREE.Group();
  const plataforma = mat(0x39414f, 0.8, 0.25);
  atrelado.add(caixa(2.5, 0.28, 7.0, plataforma, 0, 1.0, 0));
  // guardas laterais
  for (const s of [-1, 1]) {
    atrelado.add(caixa(0.12, 0.34, 7.0, mat(cor, 0.5, 0.4), s * 1.19, 1.28, 0));
  }
  // frente do atrelado
  atrelado.add(caixa(2.4, 1.1, 0.18, mat(cor, 0.5, 0.4), 0, 1.6, 3.4));
  // caixa de ferramentas
  atrelado.add(caixa(2.2, 0.5, 0.9, escuro, 0, 0.65, 2.6));

  // rampa basculante (roda na traseira)
  const rampa = caixa(2.3, 0.16, 2.6, plataforma, 0, 1.0, -4.6);
  rampa.geometry.translate(0, 0, 1.3); // pivot na frente da rampa
  rampa.position.set(0, 1.0, -3.5);
  atrelado.add(rampa);

  // luzes traseiras
  const luzesTravao: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const l = caixa(0.4, 0.22, 0.1, new THREE.MeshStandardMaterial({
      color: 0x8a1414, emissive: 0xff1a1a, emissiveIntensity: 0.4,
    }), s * 0.95, 1.35, -3.52);
    luzesTravao.push(l);
    atrelado.add(l);
  }

  // slot onde o carro guinchado assenta
  const slotCarro = new THREE.Object3D();
  slotCarro.position.set(0, 1.2, -0.4);
  atrelado.add(slotCarro);

  // ---------- RODAS ----------
  const rodas: THREE.Group[] = [];
  const rodasDir: THREE.Group[] = [];
  // eixo dianteiro (direcional)
  for (const s of [-1, 1]) {
    const w = roda(0.6, 0.36);
    w.position.set(s * 1.08, 0.6, 2.1);
    trator.add(w);
    rodas.push(w);
    rodasDir.push(w);
  }
  // eixo traseiro do trator (rodado duplo)
  for (const s of [-1, 1]) {
    for (const d of [0, 0.34]) {
      const w = roda(0.58, 0.3);
      w.position.set(s * (1.02 + d), 0.58, -0.9);
      trator.add(w);
      rodas.push(w);
    }
  }
  // rodas do atrelado
  for (const s of [-1, 1]) {
    for (const zz of [-2.0, -2.85]) {
      const w = roda(0.52, 0.3);
      w.position.set(s * 1.12, 0.52, zz);
      atrelado.add(w);
      rodas.push(w);
    }
  }

  grupo.add(trator);
  grupo.add(atrelado);
  return { grupo, trator, atrelado, rodas, rodasDir, rampa, slotCarro, farois, luzesTravao };
}

export const CORES_CARRO = [
  0xd94f4f, 0x4f7fd9, 0x54b06a, 0xe0c14a, 0xb0b6c0,
  0x8e5bd0, 0xe08a3c, 0x2f3742, 0xd9d9e0, 0x3aa8a0,
];

/** Carro de passageiros genérico com variação de forma. */
export function criarCarro(cor: number, tipo = 0): THREE.Group {
  const g = new THREE.Group();
  const c = mat(cor, 0.35, 0.5);
  const vidro = new THREE.MeshStandardMaterial({
    color: 0x1b3346, roughness: 0.1, metalness: 0.9,
    transparent: true, opacity: 0.75,
  });
  const preto = mat(0x1a1d24, 0.7, 0.3);

  const comp = tipo === 2 ? 4.9 : tipo === 1 ? 4.4 : 4.0;
  const alt = tipo === 1 ? 0.72 : 0.62;

  // corpo
  g.add(caixa(1.85, alt, comp, c, 0, 0.72, 0));
  // tejadilho
  const tetoComp = comp * 0.5;
  g.add(caixa(1.7, 0.62, tetoComp, c, 0, 0.72 + alt / 2 + 0.31, -0.15));
  // vidros
  g.add(caixa(1.74, 0.44, tetoComp * 0.92, vidro, 0, 0.72 + alt / 2 + 0.33, -0.15));
  // para-choques
  g.add(caixa(1.9, 0.26, 0.22, preto, 0, 0.52, comp / 2 - 0.05));
  g.add(caixa(1.9, 0.26, 0.22, preto, 0, 0.52, -comp / 2 + 0.05));
  // faróis
  const fm = new THREE.MeshStandardMaterial({
    color: 0xffeec2, emissive: 0xffdf9a, emissiveIntensity: 0.5,
  });
  for (const s of [-1, 1]) {
    g.add(caixa(0.42, 0.18, 0.1, fm, s * 0.62, 0.82, comp / 2));
    g.add(caixa(0.42, 0.18, 0.1, mat(0x9c2020, 0.4, 0.3), s * 0.62, 0.82, -comp / 2));
  }
  // rodas
  const zf = comp / 2 - 1.0;
  for (const s of [-1, 1]) {
    for (const z of [zf, -zf]) {
      const w = roda(0.36, 0.24);
      w.position.set(s * 0.92, 0.36, z);
      g.add(w);
    }
  }
  return g;
}

/** Cone de sinalização (marca o local da avaria). */
export function criarCone(): THREE.Group {
  const g = new THREE.Group();
  const c = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.75, 10),
    mat(0xff6a1a, 0.8, 0),
  );
  c.position.y = 0.38;
  c.castShadow = true;
  g.add(c);
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.06, 0.6),
    mat(0x2a2a2a, 0.9, 0),
  );
  base.position.y = 0.03;
  g.add(base);
  return g;
}

/** Edifício da oficina, com portão e letreiro. */
export function criarOficina(): THREE.Group {
  const g = new THREE.Group();
  const parede = mat(0xb9c2cf, 0.85, 0.05);
  const escuro = mat(0x2d3542, 0.7, 0.2);

  g.add(caixa(20, 7, 14, parede, 0, 3.5, 0));
  // telhado
  const telhado = caixa(21, 0.6, 15, mat(0x3b4452, 0.9, 0.1), 0, 7.2, 0);
  g.add(telhado);
  // portões
  for (const s of [-1, 1]) {
    g.add(caixa(5.4, 5, 0.3, escuro, s * 4.2, 2.5, 7.05));
    // faixas
    for (let i = 0; i < 4; i++) {
      g.add(caixa(5.2, 0.12, 0.34, mat(0x555f70, 0.8, 0.2), s * 4.2, 1 + i * 1.1, 7.08));
    }
  }
  // letreiro
  const placa = caixa(12, 1.6, 0.4, new THREE.MeshStandardMaterial({
    color: 0xff8c1a, emissive: 0xff6a00, emissiveIntensity: 0.55,
  }), 0, 8.4, 6.5);
  g.add(placa);
  // pilares
  for (const s of [-1, 1]) {
    g.add(caixa(0.8, 8, 0.8, mat(0x8b95a5, 0.9, 0.05), s * 9.6, 4, 7));
  }
  return g;
}

/** Prédio urbano procedural. Janelas em InstancedMesh (2 draw calls/prédio). */
export function criarPredio(w: number, h: number, d: number, seed: number): THREE.Group {
  const g = new THREE.Group();
  const tons = [0x6b7280, 0x7c8493, 0x5b6472, 0x8a8f9c, 0x66707e, 0x9aa3b0];
  const cor = tons[Math.floor(seed * tons.length) % tons.length];
  g.add(caixa(w, h, d, mat(cor, 0.92, 0.04), 0, h / 2, 0));

  const janelaOn = new THREE.MeshStandardMaterial({
    color: 0xffe9a8, emissive: 0xffd070, emissiveIntensity: 0.85,
  });
  const janelaOff = mat(0x2b3340, 0.4, 0.6);
  const geo = new THREE.BoxGeometry(1.1, 1.4, 0.1);

  const pisos = Math.max(1, Math.floor(h / 3.2));
  const colsW = Math.max(1, Math.floor(w / 2.4));

  // recolher transformações primeiro para dimensionar os InstancedMesh
  const on: THREE.Matrix4[] = [];
  const off: THREE.Matrix4[] = [];
  for (let p = 0; p < pisos; p++) {
    for (let c = 0; c < colsW; c++) {
      const y = 2.0 + p * 3.0;
      if (y > h - 1) continue;
      const aceso = ((p * 7 + c * 13 + Math.floor(seed * 100)) % 10) < 4;
      const x = -w / 2 + 1.2 + c * (w / colsW);
      for (const sgn of [1, -1]) {
        const m = new THREE.Matrix4().makeTranslation(x, y, (sgn * d) / 2 + sgn * 0.05);
        (aceso ? on : off).push(m);
      }
    }
  }
  for (const [lista, material] of [[on, janelaOn], [off, janelaOff]] as const) {
    if (!lista.length) continue;
    const inst = new THREE.InstancedMesh(geo, material, lista.length);
    lista.forEach((m, i) => inst.setMatrixAt(i, m));
    inst.instanceMatrix.needsUpdate = true;
    g.add(inst);
  }
  return g;
}

/** Árvore simples low-poly. */
export function criarArvore(): THREE.Group {
  const g = new THREE.Group();
  const tronco = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.26, 2.2, 6),
    mat(0x5a4232, 0.95, 0),
  );
  tronco.position.y = 1.1;
  tronco.castShadow = true;
  g.add(tronco);
  const copa = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.5, 0),
    mat(0x2f7a3f, 0.95, 0),
  );
  copa.position.y = 3.0;
  copa.castShadow = true;
  g.add(copa);
  return g;
}

/** Poste de iluminação. */
export function criarPoste(): THREE.Group {
  const g = new THREE.Group();
  const m = mat(0x4a5260, 0.7, 0.5);
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 8, 8), m);
  p.position.y = 4;
  g.add(p);
  const braco = caixa(1.6, 0.14, 0.14, m, 0.8, 7.9, 0);
  g.add(braco);
  const luz = caixa(0.7, 0.16, 0.34, new THREE.MeshStandardMaterial({
    color: 0xfff3d0, emissive: 0xffe9a8, emissiveIntensity: 1.4,
  }), 1.5, 7.78, 0);
  g.add(luz);
  return g;
}
