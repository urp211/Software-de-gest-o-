import { useCallback, useEffect, useMemo, useState } from 'react';
import Drive from './Drive';
import type { Missao } from './sim/scene';
import {
  DURACAO_DIA,
  PARTS,
  SERVICES,
  UPGRADES,
  custoUpgrade,
  xpParaNivel,
} from './game/data';
import {
  aceitarJob,
  cafe,
  concluirReboque,
  capacidadeArmazem,
  comprarPeca,
  comprarUpgrade,
  contratar,
  custoMecanicoNovo,
  despedir,
  pecasEmFalta,
  recusarJob,
  venderPeca,
} from './game/engine';
import { useGame } from './game/store';
import type { GameState, Job, PartId } from './game/types';

const kz = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 10_000
      ? `${(n / 1000).toFixed(1)}k`
      : Math.round(n).toLocaleString('pt-PT');

type Tab = 'oficina' | 'equipa' | 'loja' | 'melhorias' | 'diario';

export default function App() {
  const { state, act, toast, pausado, setPausado, reiniciar } = useGame();
  const [tab, setTab] = useState<Tab>('oficina');
  const [escolher, setEscolher] = useState<Job | null>(null);
  const [aConduzir, setAConduzir] = useState<string | null>(null); // jobId


  const jobReboque = state.fila.find((j) => j.id === aConduzir) ?? null;

  const missao: Missao | null = jobReboque?.local
    ? {
        id: jobReboque.id,
        cliente: jobReboque.cliente,
        servico: SERVICES[jobReboque.servico].nome,
        pagamento: jobReboque.pagamento,
        x: jobReboque.local.x,
        z: jobReboque.local.z,
        corCarro: jobReboque.corCarro,
        tipoCarro: jobReboque.tipoCarro,
      }
    : null;

  // Congela a simulação de gestão enquanto conduzes — não perdes clientes
  // enquanto estás na estrada.
  useEffect(() => {
    setPausado(!!aConduzir);
  }, [aConduzir, setPausado]);

  const onCarregado = useCallback(() => {}, []);
  const onEntregue = useCallback(
    (m: Missao) => {
      act((st) => concluirReboque(st, m.id));
      setAConduzir(null);
      setTab('oficina');
    },
    [act],
  );

  const s = state;
  const livres = s.mecanicos.filter((m) => !m.jobId);
  const baiasLivres = s.upgrades.baias - s.ativos.length;
  const podeAlgo =
    livres.length > 0 &&
    baiasLivres > 0 &&
    s.fila.some((j) => pecasEmFalta(s, j.servico).length === 0);

  if (aConduzir) {
    return (
      <Drive
        missao={missao}
        onCarregado={onCarregado}
        onEntregue={onEntregue}
        onSair={() => setAConduzir(null)}
      />
    );
  }

  return (
    <div className="app">
      <Hud s={s} pausado={pausado} onPausa={() => setPausado((p) => !p)} />

      <div className="screen" key={tab}>
        {tab === 'oficina' && (
          <Oficina
            s={s}
            act={act}
            onEscolher={setEscolher}
            onConduzir={setAConduzir}
          />
        )}
        {tab === 'equipa' && <Equipa s={s} act={act} />}
        {tab === 'loja' && <Loja s={s} act={act} />}
        {tab === 'melhorias' && <Melhorias s={s} act={act} onReset={reiniciar} />}
        {tab === 'diario' && <Diario s={s} />}
      </div>

      {toast && <div className="toast">{toast}</div>}

      {escolher && (
        <SheetMecanico
          s={s}
          job={escolher}
          onFechar={() => setEscolher(null)}
          onEscolher={(mecId) => {
            act((st) => aceitarJob(st, escolher.id, mecId));
            setEscolher(null);
          }}
        />
      )}

      {pausado && (
        <div className="pausa-veu" onClick={() => setPausado(false)}>
          <div>
            <div style={{ fontSize: 52 }}>⏸️</div>
            <h2>Jogo em pausa</h2>
            <p style={{ color: 'var(--dim)', fontSize: 13 }}>
              Toca em qualquer sítio para continuar
            </p>
          </div>
        </div>
      )}

      <nav className="nav">
        <NavBtn
          on={tab === 'oficina'}
          ic="🔧"
          txt="Oficina"
          badge={podeAlgo ? s.fila.length : 0}
          onClick={() => setTab('oficina')}
        />
        <NavBtn on={tab === 'equipa'} ic="👷" txt="Equipa" onClick={() => setTab('equipa')} />
        <NavBtn on={tab === 'loja'} ic="📦" txt="Peças" onClick={() => setTab('loja')} />
        <NavBtn on={tab === 'melhorias'} ic="⭐" txt="Melhorias" onClick={() => setTab('melhorias')} />
        <NavBtn on={tab === 'diario'} ic="📋" txt="Diário" onClick={() => setTab('diario')} />
      </nav>
    </div>
  );
}

function NavBtn({
  on, ic, txt, badge, onClick,
}: { on: boolean; ic: string; txt: string; badge?: number; onClick: () => void }) {
  return (
    <button className={on ? 'on' : ''} onClick={onClick}>
      <span className="ic">{ic}</span>
      {txt}
      {!!badge && <span className="dot">{badge}</span>}
    </button>
  );
}

function Hud({ s, pausado, onPausa }: { s: GameState; pausado: boolean; onPausa: () => void }) {
  const prog = (s.xp / xpParaNivel(s.nivel)) * 100;
  return (
    <header className="hud">
      <div className="hud-top">
        <span className="hud-logo">🔧</span>
        <div className="hud-nome">
          {s.nomeOficina}
          <small>
            Nível {s.nivel} · Dia {s.dia} ·{' '}
            {Math.max(0, Math.ceil(DURACAO_DIA - s.tempoDia))}s
          </small>
        </div>
        <button className="pausa-btn" onClick={onPausa}>
          {pausado ? '▶️' : '⏸️'}
        </button>
      </div>
      <div className="hud-stats">
        <div className="stat money">
          <span>Caixa</span>
          <b>{kz(s.dinheiro)} Kz</b>
        </div>
        <div className="stat rep">
          <span>Reputação</span>
          <b>{Math.round(s.reputacao)}%</b>
        </div>
        <div className="stat">
          <span>Baias</span>
          <b>
            {s.ativos.length}/{s.upgrades.baias}
          </b>
        </div>
        <div className="stat">
          <span>XP</span>
          <b>{Math.round(prog)}%</b>
          <div className="bar">
            <i style={{ width: `${prog}%` }} />
          </div>
        </div>
      </div>
    </header>
  );
}

function Oficina({
  s, act, onEscolher, onConduzir,
}: {
  s: GameState;
  act: (f: (st: GameState) => string | null | void) => void;
  onEscolher: (j: Job) => void;
  onConduzir: (jobId: string) => void;
}) {
  return (
    <>
      <button
        className="btn primary"
        style={{ marginBottom: 12, padding: 13, fontSize: 14 }}
        onClick={() => onConduzir('livre')}
      >
        🚛 Conduzir o reboque (passeio livre)
      </button>

      <h2>Em reparação ({s.ativos.length}/{s.upgrades.baias})</h2>
      {s.ativos.length === 0 && (
        <div className="empty">
          <div>🅿️</div>
          Nenhum veículo na baia. Aceita um cliente da fila!
        </div>
      )}
      {s.ativos.map((j) => {
        const mec = s.mecanicos.find((m) => m.id === j.mecanicoId);
        const svc = SERVICES[j.servico];
        const pct = Math.min(100, (j.progresso / j.duracao) * 100);
        return (
          <div className="card" key={j.id}>
            <div className="job-top">
              <span className="job-veic">{j.veiculo.icone}</span>
              <div className="job-info">
                <b>
                  {svc.icone} {svc.nome}
                </b>
                <span>
                  {j.veiculo.nome} · {j.cliente} · {mec?.avatar} {mec?.nome}
                </span>
              </div>
              <div className="job-pag">
                <b>{Math.round(pct)}%</b>
                <span>{Math.max(0, Math.ceil(j.duracao - j.progresso))}s</span>
              </div>
            </div>
            <div className="pac">
              <i style={{ width: `${pct}%`, background: 'var(--blue)' }} />
            </div>
          </div>
        );
      })}

      <h2 style={{ marginTop: 16 }}>Fila de clientes ({s.fila.length})</h2>
      {s.fila.length === 0 && (
        <div className="empty">
          <div>🕐</div>
          Sem clientes agora. Investe em <b>Marketing</b> para atrair mais gente.
        </div>
      )}
      {s.fila.map((j) => {
        const svc = SERVICES[j.servico];
        const falta = pecasEmFalta(s, j.servico);
        const pac = (j.paciencia / j.pacienciaMax) * 100;
        const cor = pac > 55 ? 'var(--ok)' : pac > 25 ? 'var(--acc)' : 'var(--bad)';
        const semBaia = s.ativos.length >= s.upgrades.baias;
        const semMec = s.mecanicos.every((m) => m.jobId);
        return (
          <div
            className={`card ${j.precisaReboque && !j.reboqueFeito ? 'mis-card' : ''}`}
            key={j.id}
          >
            <div className="job-top">
              <span className="job-veic">{j.veiculo.icone}</span>
              <div className="job-info">
                <b>
                  {svc.icone} {svc.nome}
                </b>
                <span>
                  {j.veiculo.nome} · {j.cliente} · ~{j.duracao}s
                </span>
              </div>
              <div className="job-pag">
                <b>{kz(j.pagamento)} Kz</b>
                <span>{'★'.repeat(svc.dificuldade)}</span>
              </div>
            </div>

            <div className="tags">
              {j.precisaReboque && (
                <span className="tag" style={{
                  color: j.reboqueFeito ? 'var(--ok)' : 'var(--acc)',
                  borderColor: j.reboqueFeito ? '#1f4a35' : '#4a3a12',
                }}>
                  {j.reboqueFeito ? '🪝 Já na oficina' : '🚛 Avariado na estrada'}
                </span>
              )}
              {Object.entries(svc.pecas).length === 0 && (
                <span className="tag ok">Sem peças necessárias</span>
              )}
              {Object.entries(svc.pecas).map(([p, q]) => {
                const em = falta.includes(p as PartId);
                return (
                  <span className={`tag ${em ? 'falta' : 'ok'}`} key={p}>
                    {PARTS[p as PartId].icone} {PARTS[p as PartId].nome} ×{q}
                    {em ? ' ✗' : ''}
                  </span>
                );
              })}
            </div>

            <div className="pac">
              <i style={{ width: `${Math.max(0, pac)}%`, background: cor }} />
            </div>

            {j.precisaReboque && !j.reboqueFeito && (
              <div className="row-btns">
                <button className="btn primary" onClick={() => onConduzir(j.id)}>
                  🚛 Ir buscar com o reboque (+45%)
                </button>
                <button
                  className="btn ghost"
                  onClick={() => act((st) => recusarJob(st, j.id))}
                >
                  Recusar
                </button>
              </div>
            )}

            {(!j.precisaReboque || j.reboqueFeito) && (
            <div className="row-btns">
              <button
                className="btn primary"
                disabled={falta.length > 0 || semBaia || semMec}
                onClick={() => onEscolher(j)}
              >
                {falta.length
                  ? 'Falta stock'
                  : semBaia
                    ? 'Baias cheias'
                    : semMec
                      ? 'Sem mecânico livre'
                      : 'Aceitar'}
              </button>
              <button className="btn ghost" onClick={() => act((st) => recusarJob(st, j.id))}>
                Recusar
              </button>
            </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function SheetMecanico({
  s, job, onFechar, onEscolher,
}: {
  s: GameState;
  job: Job;
  onFechar: () => void;
  onEscolher: (id: string) => void;
}) {
  const svc = SERVICES[job.servico];
  return (
    <div className="sheet-bg" onClick={onFechar}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h3>
          {svc.icone} {svc.nome} — {job.veiculo.icone} {job.veiculo.nome}
        </h3>
        <p className="sub">
          Escolhe o mecânico. Nível alto e energia cheia = trabalho mais rápido.
        </p>
        {s.mecanicos.map((m) => {
          const ocupado = !!m.jobId;
          const est = Math.round(
            job.duracao /
              ((0.75 + m.nivel * 0.25) *
                (1 + (s.upgrades.ferramentas - 1) * 0.12) *
                (m.energia > 25 ? 1 : 0.5)),
          );
          return (
            <button
              className="pick"
              key={m.id}
              disabled={ocupado}
              onClick={() => onEscolher(m.id)}
            >
              <span className="mec-av">{m.avatar}</span>
              <div className="mec-info">
                <b>{m.nome}</b>{' '}
                <span className="stars">{'★'.repeat(m.nivel)}</span>
                <small>
                  {ocupado ? 'Ocupado noutro veículo' : `≈ ${est}s · energia ${Math.round(m.energia)}%`}
                </small>
                <div className="energia">
                  <i
                    style={{
                      width: `${m.energia}%`,
                      background: m.energia > 30 ? 'var(--ok)' : 'var(--bad)',
                    }}
                  />
                </div>
              </div>
            </button>
          );
        })}
        <button className="btn" onClick={onFechar} style={{ marginTop: 6 }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Equipa({
  s, act,
}: { s: GameState; act: (f: (st: GameState) => string | null | void) => void }) {
  const custo = custoMecanicoNovo(s);
  const folha = s.mecanicos.reduce((a, m) => a + m.salario, 0);
  return (
    <>
      <h2>Equipa ({s.mecanicos.length}/6)</h2>
      {s.mecanicos.map((m) => {
        const job = s.ativos.find((j) => j.id === m.jobId);
        return (
          <div className="card" key={m.id}>
            <div className="mec-row">
              <span className="mec-av">{m.avatar}</span>
              <div className="mec-info">
                <b>{m.nome}</b> <span className="stars">{'★'.repeat(m.nivel)}</span>
                <small>
                  {job
                    ? `🔧 ${SERVICES[job.servico].nome} (${job.veiculo.icone})`
                    : '💤 Disponível'}{' '}
                  · {m.salario} Kz/dia
                </small>
                <div className="energia">
                  <i
                    style={{
                      width: `${m.energia}%`,
                      background: m.energia > 30 ? 'var(--ok)' : 'var(--bad)',
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="row-btns">
              <button className="btn sm" onClick={() => act((st) => cafe(st, m.id))}>
                ☕ Café (50 Kz)
              </button>
              <button
                className="btn sm danger"
                onClick={() => act((st) => despedir(st, m.id))}
              >
                Despedir
              </button>
            </div>
          </div>
        );
      })}

      <div className="card">
        <div className="mec-row">
          <span className="mec-av">➕</span>
          <div className="mec-info">
            <b>Contratar mecânico</b>
            <small>
              Novo colaborador nível 1. Folha atual: {folha} Kz/dia.
            </small>
          </div>
        </div>
        <div className="row-btns">
          <button
            className="btn primary"
            disabled={s.dinheiro < custo || s.mecanicos.length >= 6}
            onClick={() => act(contratar)}
          >
            Contratar — {kz(custo)} Kz
          </button>
        </div>
      </div>
    </>
  );
}

function Loja({
  s, act,
}: { s: GameState; act: (f: (st: GameState) => string | null | void) => void }) {
  const cap = capacidadeArmazem(s);
  return (
    <>
      <h2>Armazém — máx. {cap} por peça</h2>
      <div className="grid2">
        {Object.values(PARTS).map((p) => {
          const locked = p.nivel > s.nivel;
          return (
            <div className={`part ${locked ? 'locked' : ''}`} key={p.id}>
              <div className="ic">{locked ? '🔒' : p.icone}</div>
              <b>{p.nome}</b>
              <div className="qt">
                <em>{s.stock[p.id]}</em>/{cap} · {p.custo} Kz
              </div>
              {locked ? (
                <div style={{ fontSize: 11, color: 'var(--dim)' }}>Nível {p.nivel}</div>
              ) : (
                <div style={{ display: 'flex', gap: 5 }}>
                  <button
                    className="btn sm"
                    onClick={() => act((st) => venderPeca(st, p.id, 1))}
                  >
                    −
                  </button>
                  <button
                    className="btn sm primary"
                    onClick={() => act((st) => comprarPeca(st, p.id, 1))}
                  >
                    +1
                  </button>
                  <button
                    className="btn sm primary"
                    onClick={() => act((st) => comprarPeca(st, p.id, 5))}
                  >
                    +5
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p style={{ color: 'var(--dim)', fontSize: 11.5, marginTop: 10, lineHeight: 1.5 }}>
        💡 Vender peças devolve apenas 60% do valor. Compra conforme os serviços
        que aparecem na fila.
      </p>
    </>
  );
}

function Melhorias({
  s, act, onReset,
}: {
  s: GameState;
  act: (f: (st: GameState) => string | null | void) => void;
  onReset: () => void;
}) {
  const [confirmar, setConfirmar] = useState(false);
  const lucro = s.stats.faturacao - s.stats.gastos;
  return (
    <>
      <h2>Melhorias da oficina</h2>
      {UPGRADES.map((u) => {
        const n = s.upgrades[u.id];
        const max = n >= u.max;
        const custo = custoUpgrade(u, n);
        return (
          <div className="card" key={u.id}>
            <div className="upg">
              <span className="ic">{u.icone}</span>
              <div className="upg-info">
                <b>{u.nome}</b>
                <small>{u.desc}</small>
                <small style={{ color: 'var(--acc)' }}>Agora: {u.efeito(n)}</small>
                <div className="pips">
                  {Array.from({ length: u.max }).map((_, i) => (
                    <i key={i} className={i < n ? 'on' : ''} />
                  ))}
                </div>
              </div>
            </div>
            <div className="row-btns">
              <button
                className="btn primary"
                disabled={max || s.dinheiro < custo}
                onClick={() => act((st) => comprarUpgrade(st, u.id))}
              >
                {max ? 'Máximo atingido' : `Melhorar — ${kz(custo)} Kz`}
              </button>
            </div>
          </div>
        );
      })}

      <h2 style={{ marginTop: 16 }}>Estatísticas</h2>
      <div className="card">
        <Linha k="Serviços concluídos" v={`${s.stats.concluidos}`} />
        <Linha k="Clientes perdidos" v={`${s.stats.perdidos}`} />
        <Linha k="Faturação total" v={`${kz(s.stats.faturacao)} Kz`} />
        <Linha k="Despesas totais" v={`${kz(s.stats.gastos)} Kz`} />
        <Linha
          k="Lucro"
          v={`${kz(lucro)} Kz`}
          cor={lucro >= 0 ? 'var(--ok)' : 'var(--bad)'}
        />
      </div>

      <div className="row-btns">
        {confirmar ? (
          <>
            <button className="btn danger" onClick={onReset}>
              Sim, apagar tudo
            </button>
            <button className="btn" onClick={() => setConfirmar(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <button className="btn danger" onClick={() => setConfirmar(true)}>
            🗑️ Reiniciar jogo
          </button>
        )}
      </div>
    </>
  );
}

function Linha({ k, v, cor }: { k: string; v: string; cor?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 13,
        padding: '5px 0',
      }}
    >
      <span style={{ color: 'var(--dim)' }}>{k}</span>
      <b style={{ color: cor }}>{v}</b>
    </div>
  );
}

function Diario({ s }: { s: GameState }) {
  const dicas = useMemo(
    () => [
      'Compra peças ANTES de aceitar o trabalho — sem stock não podes aceitar.',
      'Cada baia extra permite reparar mais um veículo em simultâneo.',
      'Mecânicos cansados trabalham a metade da velocidade. Dá-lhes café ☕.',
      'Reputação alta atrai clientes com serviços mais bem pagos.',
      'No fim de cada dia pagas salários e renda. Não fiques sem caixa!',
    ],
    [],
  );
  return (
    <>
      <h2>Dica do dia</h2>
      <div className="card" style={{ fontSize: 12.5, lineHeight: 1.55 }}>
        💡 {dicas[s.dia % dicas.length]}
      </div>
      <h2 style={{ marginTop: 14 }}>Diário de bordo</h2>
      {s.log.length === 0 && <div className="empty">Sem registos ainda.</div>}
      {s.log.map((l) => (
        <div className={`log-item ${l.tipo}`} key={l.id}>
          {l.texto}
        </div>
      ))}
    </>
  );
}
