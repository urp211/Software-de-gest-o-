/**
 * Física arcade de um camião-reboque com atrelado, estilo ETS2 simplificado.
 * Modelo de bicicleta (bicycle model) com deslizamento lateral e um atrelado
 * ligado por engate que segue o trator.
 */

export interface Controls {
  acelerador: number; // 0..1
  travao: number; // 0..1
  volante: number; // -1..1
  travaoMao: boolean;
  marchaAtras: boolean;
}

export const controlsZero = (): Controls => ({
  acelerador: 0,
  travao: 0,
  volante: 0,
  travaoMao: false,
  marchaAtras: false,
});

export interface TruckState {
  x: number;
  z: number;
  heading: number; // rad, 0 = +Z
  vel: number; // m/s ao longo do heading
  velLateral: number;
  direcao: number; // ângulo das rodas, rad
  rotacaoRoda: number; // para animar as rodas
  atreladoHeading: number;
  motorRPM: number;
  marcha: number;
}

export const ENTRE_EIXOS = 4.2; // m
export const COMPRIMENTO_ATRELADO = 7.0;
export const DIRECAO_MAX = 0.62; // rad

export function truckInicial(x = 0, z = 0, heading = 0): TruckState {
  return {
    x,
    z,
    heading,
    vel: 0,
    velLateral: 0,
    direcao: 0,
    rotacaoRoda: 0,
    atreladoHeading: heading,
    motorRPM: 700,
    marcha: 1,
  };
}

const VEL_MAX = 24; // ~86 km/h
const VEL_MAX_RE = -7;

/** Avança a física. dt em segundos. `carregado` aumenta a inércia. */
export function passoTruck(
  t: TruckState,
  c: Controls,
  dt: number,
  carregado: boolean,
) {
  const massaFator = carregado ? 1.42 : 1;

  // --- Direção: converge suavemente e reduz com a velocidade ---
  const limiteVel = 1 - Math.min(0.62, Math.abs(t.vel) / 40);
  const alvoDirecao = c.volante * DIRECAO_MAX * limiteVel;
  const taxa = 3.4;
  t.direcao += (alvoDirecao - t.direcao) * Math.min(1, taxa * dt);

  // --- Forças longitudinais ---
  const potencia = 4.6 / massaFator;
  let acel = 0;
  if (c.marchaAtras) {
    acel = -c.acelerador * potencia * 0.5;
  } else {
    // binário cai a alta velocidade
    const queda = 1 - Math.min(0.75, Math.abs(t.vel) / VEL_MAX);
    acel = c.acelerador * potencia * (0.35 + queda * 0.65);
  }

  // travões
  const travagem = (c.travao * 4.4 + (c.travaoMao ? 6.5 : 0)) / massaFator;
  if (Math.abs(t.vel) > 0.05) acel -= Math.sign(t.vel) * travagem;
  else if (travagem > 0) t.vel = 0;

  // resistências
  acel -= t.vel * 0.055 * massaFator; // rolamento
  acel -= Math.sign(t.vel) * t.vel * t.vel * 0.0032; // aerodinâmica

  t.vel += acel * dt;
  t.vel = Math.max(VEL_MAX_RE, Math.min(VEL_MAX, t.vel));
  if (Math.abs(t.vel) < 0.25 && c.acelerador === 0 && (c.travao > 0 || c.travaoMao)) t.vel = 0;
  if (Math.abs(t.vel) < 0.04 && c.acelerador === 0) t.vel = 0;

  // --- Rotação (modelo de bicicleta) ---
  const rotacao = (t.vel / ENTRE_EIXOS) * Math.tan(t.direcao);
  t.heading += rotacao * dt;

  // deslizamento lateral leve para dar peso à condução
  const derrapa = c.travaoMao ? 0.55 : 0.14;
  const alvoLateral = -rotacao * t.vel * derrapa;
  t.velLateral += (alvoLateral - t.velLateral) * Math.min(1, 5 * dt);
  t.velLateral *= 1 - Math.min(1, 2.4 * dt);

  // --- Posição ---
  const sh = Math.sin(t.heading);
  const ch = Math.cos(t.heading);
  t.x += (sh * t.vel + ch * t.velLateral) * dt;
  t.z += (ch * t.vel - sh * t.velLateral) * dt;

  t.rotacaoRoda += (t.vel / 0.55) * dt;

  // --- Atrelado: segue o engate ---
  let d = t.heading - t.atreladoHeading;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  const forcaEngate = Math.min(1, (Math.abs(t.vel) / COMPRIMENTO_ATRELADO) * dt * 2.6);
  t.atreladoHeading += d * forcaEngate * (t.vel >= 0 ? 1 : -0.75);

  // --- Motor / caixa (só visual e áudio) ---
  const kmh = Math.abs(t.vel) * 3.6;
  const marchas = [0, 22, 40, 58, 74, 999];
  let m = 1;
  for (let i = 1; i < marchas.length; i++) if (kmh >= marchas[i - 1]) m = i;
  t.marcha = c.marchaAtras ? -1 : Math.min(5, m);
  const faixa = kmh - (marchas[Math.max(0, t.marcha - 1)] ?? 0);
  const alvoRPM = 700 + Math.min(1, faixa / 22) * 1500 + c.acelerador * 350;
  t.motorRPM += (alvoRPM - t.motorRPM) * Math.min(1, 4 * dt);
}

export const velocidadeKmh = (t: TruckState) => Math.abs(t.vel) * 3.6;

/** Posição do engate (atrás do trator). */
export function posEngate(t: TruckState) {
  return {
    x: t.x - Math.sin(t.heading) * 3.1,
    z: t.z - Math.cos(t.heading) * 3.1,
  };
}

/** Posição do centro do atrelado. */
export function posAtrelado(t: TruckState) {
  const e = posEngate(t);
  return {
    x: e.x - Math.sin(t.atreladoHeading) * (COMPRIMENTO_ATRELADO / 2),
    z: e.z - Math.cos(t.atreladoHeading) * (COMPRIMENTO_ATRELADO / 2),
  };
}
