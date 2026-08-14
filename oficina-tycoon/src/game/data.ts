import type {
  PartDef,
  PartId,
  ServiceDef,
  ServiceId,
  UpgradeId,
  VehicleDef,
} from './types';

export const PARTS: Record<PartId, PartDef> = {
  oleo: { id: 'oleo', nome: 'Óleo 5W30', icone: '🛢️', custo: 25, nivel: 1 },
  filtro: { id: 'filtro', nome: 'Filtro', icone: '🌀', custo: 15, nivel: 1 },
  pastilhas: { id: 'pastilhas', nome: 'Pastilhas', icone: '🛑', custo: 40, nivel: 1 },
  pneu: { id: 'pneu', nome: 'Pneu', icone: '🛞', custo: 60, nivel: 2 },
  bateria: { id: 'bateria', nome: 'Bateria', icone: '🔋', custo: 90, nivel: 3 },
  correia: { id: 'correia', nome: 'Correia', icone: '⛓️', custo: 110, nivel: 4 },
  embraiagem: { id: 'embraiagem', nome: 'Embraiagem', icone: '⚙️', custo: 220, nivel: 6 },
  injector: { id: 'injector', nome: 'Injector', icone: '💉', custo: 180, nivel: 8 },
};

export const SERVICES: Record<ServiceId, ServiceDef> = {
  revisao: {
    id: 'revisao',
    nome: 'Revisão',
    icone: '🧰',
    dificuldade: 1,
    duracaoBase: 14,
    pagamentoBase: 120,
    pecas: { oleo: 1, filtro: 1 },
    nivel: 1,
  },
  travoes: {
    id: 'travoes',
    nome: 'Travões',
    icone: '🛑',
    dificuldade: 2,
    duracaoBase: 20,
    pagamentoBase: 210,
    pecas: { pastilhas: 2 },
    nivel: 1,
  },
  pneus: {
    id: 'pneus',
    nome: 'Troca de pneus',
    icone: '🛞',
    dificuldade: 2,
    duracaoBase: 18,
    pagamentoBase: 260,
    pecas: { pneu: 2 },
    nivel: 2,
  },
  bateria: {
    id: 'bateria',
    nome: 'Bateria',
    icone: '🔋',
    dificuldade: 2,
    duracaoBase: 16,
    pagamentoBase: 240,
    pecas: { bateria: 1 },
    nivel: 3,
  },
  diagnostico: {
    id: 'diagnostico',
    nome: 'Diagnóstico',
    icone: '💻',
    dificuldade: 3,
    duracaoBase: 22,
    pagamentoBase: 300,
    pecas: {},
    nivel: 4,
  },
  distribuicao: {
    id: 'distribuicao',
    nome: 'Distribuição',
    icone: '⛓️',
    dificuldade: 4,
    duracaoBase: 34,
    pagamentoBase: 520,
    pecas: { correia: 1, oleo: 1 },
    nivel: 5,
  },
  embraiagem: {
    id: 'embraiagem',
    nome: 'Embraiagem',
    icone: '⚙️',
    dificuldade: 5,
    duracaoBase: 44,
    pagamentoBase: 780,
    pecas: { embraiagem: 1 },
    nivel: 6,
  },
  motor: {
    id: 'motor',
    nome: 'Recondicionar motor',
    icone: '🏎️',
    dificuldade: 5,
    duracaoBase: 60,
    pagamentoBase: 1300,
    pecas: { injector: 2, oleo: 2, filtro: 1 },
    nivel: 8,
  },
};

export const VEHICLES: VehicleDef[] = [
  { nome: 'Citadino', icone: '🚗', multiplicador: 1, raridade: 40 },
  { nome: 'Carrinha', icone: '🚐', multiplicador: 1.25, raridade: 22 },
  { nome: 'SUV', icone: '🚙', multiplicador: 1.45, raridade: 18 },
  { nome: 'Pick-up', icone: '🛻', multiplicador: 1.6, raridade: 10 },
  { nome: 'Desportivo', icone: '🏎️', multiplicador: 2.2, raridade: 6 },
  { nome: 'Camião', icone: '🚚', multiplicador: 2.8, raridade: 3 },
  { nome: 'Clássico', icone: '🚕', multiplicador: 3.5, raridade: 1 },
];

export const NOMES = [
  'Sr. Manuel', 'D. Fernanda', 'Kelson', 'Nzuzi', 'Dra. Aline', 'Tó Zé',
  'Sandra', 'Eng.º Paulo', 'Mama Rosa', 'Dj Kadu', 'Bruno', 'Yara',
  'Sr. Domingos', 'Cátia', 'Edson', 'Prof. Lima', 'Nádia', 'Kiluanje',
];

export const NOMES_MEC = [
  'Zé Chave', 'Tuca', 'Baptista', 'Rita', 'Kamba', 'Sílvio',
  'Djamila', 'Óscar', 'Neco', 'Vânia', 'Mestre Bento', 'Ivo',
];

export const AVATARES = ['👨‍🔧', '👩‍🔧', '🧑‍🔧'];

export interface UpgradeDef {
  id: UpgradeId;
  nome: string;
  icone: string;
  desc: string;
  max: number;
  custoBase: number;
  custoFator: number;
  efeito: (n: number) => string;
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'baias',
    nome: 'Baias de trabalho',
    icone: '🏗️',
    desc: 'Mais veículos em reparação ao mesmo tempo.',
    max: 6,
    custoBase: 900,
    custoFator: 2.3,
    efeito: (n) => `${n} baias`,
  },
  {
    id: 'ferramentas',
    nome: 'Ferramentas',
    icone: '🔧',
    desc: 'Reparações mais rápidas.',
    max: 10,
    custoBase: 400,
    custoFator: 1.7,
    efeito: (n) => `+${(n - 1) * 12}% velocidade`,
  },
  {
    id: 'marketing',
    nome: 'Marketing',
    icone: '📣',
    desc: 'Mais clientes e trabalhos melhores.',
    max: 10,
    custoBase: 350,
    custoFator: 1.75,
    efeito: (n) => `+${(n - 1) * 15}% clientes`,
  },
  {
    id: 'armazem',
    nome: 'Armazém',
    icone: '📦',
    desc: 'Capacidade máxima por tipo de peça.',
    max: 8,
    custoBase: 300,
    custoFator: 1.8,
    efeito: (n) => `${10 + (n - 1) * 10} un./peça`,
  },
  {
    id: 'formacao',
    nome: 'Formação',
    icone: '🎓',
    desc: 'Mecânicos ganham XP mais depressa.',
    max: 8,
    custoBase: 600,
    custoFator: 1.9,
    efeito: (n) => `+${(n - 1) * 25}% XP`,
  },
  {
    id: 'lounge',
    nome: 'Sala de espera',
    icone: '🛋️',
    desc: 'Clientes esperam mais tempo sem desistir.',
    max: 8,
    custoBase: 500,
    custoFator: 1.85,
    efeito: (n) => `+${(n - 1) * 18}% paciência`,
  },
];

export const custoUpgrade = (u: UpgradeDef, nivelAtual: number) =>
  Math.round(u.custoBase * Math.pow(u.custoFator, nivelAtual - 1));

export const xpParaNivel = (n: number) => Math.round(180 * Math.pow(1.55, n - 1));

export const DURACAO_DIA = 120; // segundos
