export type PartId =
  | 'oleo'
  | 'filtro'
  | 'pastilhas'
  | 'pneu'
  | 'bateria'
  | 'correia'
  | 'embraiagem'
  | 'injector';

export interface PartDef {
  id: PartId;
  nome: string;
  icone: string;
  custo: number;
  nivel: number; // nível de oficina necessário para comprar
}

export type ServiceId =
  | 'revisao'
  | 'travoes'
  | 'pneus'
  | 'bateria'
  | 'distribuicao'
  | 'embraiagem'
  | 'diagnostico'
  | 'motor';

export interface ServiceDef {
  id: ServiceId;
  nome: string;
  icone: string;
  dificuldade: number; // 1..5
  duracaoBase: number; // segundos
  pagamentoBase: number;
  pecas: Partial<Record<PartId, number>>;
  nivel: number;
}

export interface VehicleDef {
  nome: string;
  icone: string;
  multiplicador: number;
  raridade: number; // peso de sorteio
}

export interface Mechanic {
  id: string;
  nome: string;
  avatar: string;
  nivel: number; // 1..5 skill
  xp: number;
  salario: number; // por dia de jogo (a cada 120s)
  energia: number; // 0..100
  jobId: string | null;
}

export interface Job {
  id: string;
  cliente: string;
  veiculo: VehicleDef;
  servico: ServiceId;
  pagamento: number;
  duracao: number; // segundos necessários de trabalho
  progresso: number; // segundos acumulados
  paciencia: number; // segundos restantes na fila
  pacienciaMax: number;
  mecanicoId: string | null;
  gorjetaOk: boolean;
}

export interface Upgrades {
  baias: number; // nº de veículos em simultâneo
  ferramentas: number; // velocidade
  marketing: number; // fluxo de clientes
  armazem: number; // capacidade de stock
  formacao: number; // ganho de XP dos mecânicos
  lounge: number; // paciência dos clientes
}

export type UpgradeId = keyof Upgrades;

export interface GameState {
  version: number;
  nomeOficina: string;
  dinheiro: number;
  reputacao: number; // 0..100
  nivel: number;
  xp: number;
  dia: number;
  tempoDia: number; // segundos no dia atual
  stock: Record<PartId, number>;
  mecanicos: Mechanic[];
  fila: Job[];
  ativos: Job[];
  ultimoTick: number;
  stats: {
    concluidos: number;
    perdidos: number;
    faturacao: number;
    gastos: number;
  };
  upgrades: Upgrades;
  log: { id: string; texto: string; tipo: 'ok' | 'mau' | 'info'; t: number }[];
}
