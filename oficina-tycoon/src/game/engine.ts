import {
  AVATARES,
  DURACAO_DIA,
  NOMES,
  NOMES_MEC,
  PARTS,
  SERVICES,
  UPGRADES,
  VEHICLES,
  custoUpgrade,
  xpParaNivel,
} from './data';
import type {
  GameState,
  Job,
  Mechanic,
  PartId,
  ServiceDef,
  ServiceId,
  UpgradeId,
} from './types';

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Paleta dos carros (espelha sim/models CORES_CARRO, sem depender do three). */
const CORES_CARRO = [
  0xd94f4f, 0x4f7fd9, 0x54b06a, 0xe0c14a, 0xb0b6c0,
  0x8e5bd0, 0xe08a3c, 0x2f3742, 0xd9d9e0, 0x3aa8a0,
];

/** Eixos da grelha de estradas (espelha sim/world EIXOS). */
const EIXOS_RUA = [-160, -80, 0, 80, 160];

/** Ponto aleatório sobre uma faixa de rodagem do mundo 3D. */
function localAvaria() {
  const eixo = EIXOS_RUA[Math.floor(Math.random() * EIXOS_RUA.length)];
  const along = (Math.random() - 0.5) * 2 * 170;
  const faixa = (Math.random() < 0.5 ? -1 : 1) * 3.5;
  return Math.random() < 0.5
    ? { x: eixo + faixa, z: along }
    : { x: along, z: eixo + faixa };
}
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const rnd = (min: number, max: number) => min + Math.random() * (max - min);

export const STOCK_ZERO = (): Record<PartId, number> =>
  Object.keys(PARTS).reduce((acc, k) => {
    acc[k as PartId] = 0;
    return acc;
  }, {} as Record<PartId, number>);

export function novoMecanico(nivel = 1, nomesUsados: string[] = []): Mechanic {
  const disp = NOMES_MEC.filter((n) => !nomesUsados.includes(n));
  return {
    id: uid(),
    nome: pick(disp.length ? disp : NOMES_MEC),
    avatar: pick(AVATARES),
    nivel,
    xp: 0,
    salario: 60 + nivel * 55,
    energia: 100,
    jobId: null,
  };
}

export function estadoInicial(nomeOficina = 'Oficina Kwanza'): GameState {
  const stock = STOCK_ZERO();
  stock.oleo = 6;
  stock.filtro = 4;
  stock.pastilhas = 4;
  return {
    version: 1,
    nomeOficina,
    dinheiro: 1500,
    reputacao: 50,
    nivel: 1,
    xp: 0,
    dia: 1,
    tempoDia: 0,
    stock,
    mecanicos: [novoMecanico(1)],
    fila: [],
    ativos: [],
    ultimoTick: Date.now(),
    stats: { concluidos: 0, perdidos: 0, faturacao: 0, gastos: 0 },
    upgrades: {
      baias: 1,
      ferramentas: 1,
      marketing: 1,
      armazem: 1,
      formacao: 1,
      lounge: 1,
    },
    log: [
      {
        id: uid(),
        texto: 'Abriste as portas da oficina. Boa sorte!',
        tipo: 'info',
        t: Date.now(),
      },
    ],
  };
}

export const capacidadeArmazem = (s: GameState) => 10 + (s.upgrades.armazem - 1) * 10;

export const velocidade = (s: GameState) => 1 + (s.upgrades.ferramentas - 1) * 0.12;

export const custoMecanicoNovo = (s: GameState) =>
  Math.round(800 * Math.pow(2.05, s.mecanicos.length - 1));

export function servicosDisponiveis(nivel: number): ServiceDef[] {
  return Object.values(SERVICES).filter((s) => s.nivel <= nivel);
}

function sorteiaVeiculo() {
  const total = VEHICLES.reduce((a, v) => a + v.raridade, 0);
  let r = Math.random() * total;
  for (const v of VEHICLES) {
    r -= v.raridade;
    if (r <= 0) return v;
  }
  return VEHICLES[0];
}

export function gerarJob(s: GameState): Job {
  const disp = servicosDisponiveis(s.nivel);
  // Reputação alta => maior chance de serviços caros
  const pesoTopo = 0.25 + (s.reputacao / 100) * 0.55;
  const ordenados = [...disp].sort((a, b) => a.pagamentoBase - b.pagamentoBase);
  const idx =
    Math.random() < pesoTopo
      ? Math.floor(rnd(ordenados.length / 2, ordenados.length))
      : Math.floor(rnd(0, Math.max(1, ordenados.length / 2)));
  const servico = ordenados[Math.min(idx, ordenados.length - 1)];
  const veiculo = sorteiaVeiculo();
  // Serviços pesados chegam mais vezes como avaria na estrada
  const precisaReboque = Math.random() < 0.22 + servico.dificuldade * 0.09;
  const bonusRep = 1 + (s.reputacao - 50) / 160;
  const pagamento = Math.round(
    servico.pagamentoBase *
      veiculo.multiplicador *
      bonusRep *
      rnd(0.9, 1.15) *
      (precisaReboque ? 1.45 : 1),
  );
  // Reboque paga um extra e o cliente espera mais (está à espera do camião)
  const pacienciaMax = Math.round(
    (38 + servico.dificuldade * 6) *
      (1 + (s.upgrades.lounge - 1) * 0.18) *
      (precisaReboque ? 2.4 : 1),
  );
  return {
    id: uid(),
    cliente: pick(NOMES),
    veiculo,
    servico: servico.id,
    pagamento,
    duracao: Math.round(servico.duracaoBase * veiculo.multiplicador * rnd(0.9, 1.1)),
    progresso: 0,
    paciencia: pacienciaMax,
    pacienciaMax,
    mecanicoId: null,
    gorjetaOk: true,
    precisaReboque,
    reboqueFeito: false,
    local: precisaReboque ? localAvaria() : undefined,
    corCarro: CORES_CARRO[Math.floor(Math.random() * CORES_CARRO.length)],
    tipoCarro: Math.floor(Math.random() * 3),
  };
}

export function addLog(
  s: GameState,
  texto: string,
  tipo: 'ok' | 'mau' | 'info' = 'info',
) {
  s.log.unshift({ id: uid(), texto, tipo, t: Date.now() });
  if (s.log.length > 40) s.log.length = 40;
}

export function temPecas(s: GameState, servico: ServiceId) {
  const req = SERVICES[servico].pecas;
  return Object.entries(req).every(
    ([p, q]) => s.stock[p as PartId] >= (q as number),
  );
}

export function pecasEmFalta(s: GameState, servico: ServiceId): PartId[] {
  const req = SERVICES[servico].pecas;
  return Object.entries(req)
    .filter(([p, q]) => s.stock[p as PartId] < (q as number))
    .map(([p]) => p as PartId);
}

export function ganharXP(s: GameState, xp: number) {
  s.xp += xp;
  while (s.xp >= xpParaNivel(s.nivel)) {
    s.xp -= xpParaNivel(s.nivel);
    s.nivel += 1;
    addLog(s, `⭐ Oficina subiu para o nível ${s.nivel}!`, 'ok');
  }
}

/** Avança a simulação em `dt` segundos. Muta o estado (usar com produce/cópia). */
export function tick(s: GameState, dt: number) {
  s.tempoDia += dt;

  // --- Novos clientes ---
  const taxaBase = 0.055 * (1 + (s.upgrades.marketing - 1) * 0.15);
  const taxa = taxaBase * (0.6 + s.reputacao / 100);
  const limiteFila = 4 + s.upgrades.lounge;
  if (s.fila.length < limiteFila && Math.random() < taxa * dt) {
    const j = gerarJob(s);
    s.fila.push(j);
  }

  // --- Paciência da fila ---
  for (const j of s.fila) j.paciencia -= dt;
  const desistiram = s.fila.filter((j) => j.paciencia <= 0);
  if (desistiram.length) {
    s.fila = s.fila.filter((j) => j.paciencia > 0);
    for (const j of desistiram) {
      s.stats.perdidos += 1;
      s.reputacao = Math.max(0, s.reputacao - 2.5);
      addLog(s, `😠 ${j.cliente} cansou-se de esperar e foi embora.`, 'mau');
    }
  }

  // --- Trabalho em curso ---
  const vel = velocidade(s);
  const terminados: Job[] = [];
  for (const j of s.ativos) {
    const mec = s.mecanicos.find((m) => m.id === j.mecanicoId);
    if (!mec) continue;
    const fatorEnergia = mec.energia > 25 ? 1 : 0.5;
    const ritmo = (0.75 + mec.nivel * 0.25) * vel * fatorEnergia;
    j.progresso += dt * ritmo;
    mec.energia = Math.max(0, mec.energia - dt * 1.1);
    if (j.progresso >= j.duracao) terminados.push(j);
  }

  for (const j of terminados) {
    s.ativos = s.ativos.filter((a) => a.id !== j.id);
    const mec = s.mecanicos.find((m) => m.id === j.mecanicoId);
    const svc = SERVICES[j.servico];
    let ganho = j.pagamento;
    if (j.gorjetaOk && Math.random() < 0.3 + s.reputacao / 300) {
      const gorjeta = Math.round(ganho * rnd(0.08, 0.22));
      ganho += gorjeta;
      addLog(s, `💚 ${j.cliente} deixou ${gorjeta} Kz de gorjeta.`, 'ok');
    }
    s.dinheiro += ganho;
    s.stats.faturacao += ganho;
    s.stats.concluidos += 1;
    s.reputacao = Math.min(100, s.reputacao + 1.2 + svc.dificuldade * 0.25);
    ganharXP(s, 25 + svc.dificuldade * 18);
    if (mec) {
      mec.jobId = null;
      mec.xp += Math.round(
        (10 + svc.dificuldade * 8) * (1 + (s.upgrades.formacao - 1) * 0.25),
      );
      const need = mec.nivel * 120;
      if (mec.xp >= need && mec.nivel < 5) {
        mec.xp -= need;
        mec.nivel += 1;
        mec.salario = Math.round(mec.salario * 1.35);
        addLog(s, `🎉 ${mec.nome} subiu para nível ${mec.nivel}!`, 'ok');
      }
    }
    addLog(
      s,
      `✅ ${svc.nome} em ${j.veiculo.nome} de ${j.cliente} — +${ganho} Kz`,
      'ok',
    );
  }

  // --- Recuperação de energia de quem está parado ---
  for (const m of s.mecanicos) {
    if (!m.jobId) m.energia = Math.min(100, m.energia + dt * 3.5);
  }

  // --- Fim do dia: salários ---
  if (s.tempoDia >= DURACAO_DIA) {
    s.tempoDia -= DURACAO_DIA;
    s.dia += 1;
    const folha = s.mecanicos.reduce((a, m) => a + m.salario, 0);
    const renda = 120 + (s.upgrades.baias - 1) * 90;
    const total = folha + renda;
    s.dinheiro -= total;
    s.stats.gastos += total;
    for (const m of s.mecanicos) m.energia = Math.min(100, m.energia + 45);
    addLog(s, `📅 Dia ${s.dia}. Pagaste ${total} Kz (salários + renda).`, 'info');
    if (s.dinheiro < 0) {
      s.reputacao = Math.max(0, s.reputacao - 6);
      addLog(s, `🏦 Estás no vermelho! A reputação sofreu.`, 'mau');
    }
  }
}

// ---------- Ações do jogador ----------

export function aceitarJob(s: GameState, jobId: string, mecId: string): string | null {
  const job = s.fila.find((j) => j.id === jobId);
  if (!job) return 'Trabalho já não está disponível.';
  const mec = s.mecanicos.find((m) => m.id === mecId);
  if (!mec) return 'Mecânico inválido.';
  if (mec.jobId) return `${mec.nome} já está ocupado.`;
  if (job.precisaReboque && !job.reboqueFeito)
    return 'Este carro está avariado na estrada — vai buscá-lo com o reboque.';
  if (s.ativos.length >= s.upgrades.baias) return 'Não há baias livres.';
  const falta = pecasEmFalta(s, job.servico);
  if (falta.length)
    return `Falta stock: ${falta.map((p) => PARTS[p].nome).join(', ')}`;

  const req = SERVICES[job.servico].pecas;
  for (const [p, q] of Object.entries(req)) s.stock[p as PartId] -= q as number;

  s.fila = s.fila.filter((j) => j.id !== jobId);
  job.mecanicoId = mecId;
  mec.jobId = job.id;
  s.ativos.push(job);
  return null;
}

export function recusarJob(s: GameState, jobId: string) {
  const job = s.fila.find((j) => j.id === jobId);
  if (!job) return;
  s.fila = s.fila.filter((j) => j.id !== jobId);
  s.reputacao = Math.max(0, s.reputacao - 1);
  addLog(s, `🚪 Recusaste ${job.cliente}.`, 'info');
}

export function comprarPeca(s: GameState, part: PartId, qtd: number): string | null {
  const def = PARTS[part];
  if (def.nivel > s.nivel) return `Desbloqueia no nível ${def.nivel}.`;
  const cap = capacidadeArmazem(s);
  if (s.stock[part] + qtd > cap) return `Armazém cheio (máx. ${cap}).`;
  const custo = def.custo * qtd;
  if (s.dinheiro < custo) return 'Dinheiro insuficiente.';
  s.dinheiro -= custo;
  s.stats.gastos += custo;
  s.stock[part] += qtd;
  return null;
}

export function venderPeca(s: GameState, part: PartId, qtd: number): string | null {
  if (s.stock[part] < qtd) return 'Não tens essas peças.';
  const valor = Math.round(PARTS[part].custo * 0.6) * qtd;
  s.stock[part] -= qtd;
  s.dinheiro += valor;
  return null;
}

export function comprarUpgrade(s: GameState, id: UpgradeId): string | null {
  const def = UPGRADES.find((u) => u.id === id)!;
  const atual = s.upgrades[id];
  if (atual >= def.max) return 'Já está no máximo.';
  const custo = custoUpgrade(def, atual);
  if (s.dinheiro < custo) return 'Dinheiro insuficiente.';
  s.dinheiro -= custo;
  s.stats.gastos += custo;
  s.upgrades[id] = atual + 1;
  addLog(s, `${def.icone} ${def.nome} melhorado para nível ${atual + 1}.`, 'ok');
  return null;
}

export function contratar(s: GameState): string | null {
  const custo = custoMecanicoNovo(s);
  if (s.dinheiro < custo) return 'Dinheiro insuficiente.';
  if (s.mecanicos.length >= 6) return 'Equipa completa (máx. 6).';
  s.dinheiro -= custo;
  s.stats.gastos += custo;
  const m = novoMecanico(1, s.mecanicos.map((x) => x.nome));
  s.mecanicos.push(m);
  addLog(s, `🤝 Contrataste ${m.nome}.`, 'ok');
  return null;
}

export function despedir(s: GameState, id: string): string | null {
  if (s.mecanicos.length <= 1) return 'Precisas de pelo menos 1 mecânico.';
  const m = s.mecanicos.find((x) => x.id === id);
  if (!m) return null;
  if (m.jobId) return 'Está a trabalhar num veículo.';
  s.mecanicos = s.mecanicos.filter((x) => x.id !== id);
  addLog(s, `👋 ${m.nome} saiu da equipa.`, 'info');
  return null;
}

export function cafe(s: GameState, id: string): string | null {
  const m = s.mecanicos.find((x) => x.id === id);
  if (!m) return null;
  if (m.energia >= 95) return 'Já está cheio de energia.';
  if (s.dinheiro < 50) return 'Precisas de 50 Kz.';
  s.dinheiro -= 50;
  s.stats.gastos += 50;
  m.energia = Math.min(100, m.energia + 45);
  return null;
}


/** Marca o reboque como concluído (chamado ao entregar o carro na oficina). */
export function concluirReboque(s: GameState, jobId: string): string | null {
  const job = s.fila.find((j) => j.id === jobId);
  if (!job) return 'Esse trabalho já não existe.';
  job.reboqueFeito = true;
  // o cliente ganha paciência: o carro já está na oficina
  job.paciencia = job.pacienciaMax;
  const bonus = Math.round(job.pagamento * 0.18);
  s.dinheiro += bonus;
  s.stats.faturacao += bonus;
  s.reputacao = Math.min(100, s.reputacao + 2);
  ganharXP(s, 40);
  addLog(s, `🪝 Guinchaste o carro de ${job.cliente}. +${bonus} Kz de reboque.`, 'ok');
  return null;
}
