import { useEffect, useRef, useState } from 'react';
import { CAMERAS, Jogo3D } from './sim/scene';
import type { CameraId, Missao, Telemetria } from './sim/scene';

interface Props {
  missao: Missao | null;
  onCarregado: (m: Missao) => void;
  onEntregue: (m: Missao) => void;
  onSair: () => void;
}

export default function Drive({ missao, onCarregado, onEntregue, onSair }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const jogoRef = useRef<Jogo3D | null>(null);
  const [tel, setTel] = useState<Telemetria>({
    kmh: 0, rpm: 700, marcha: 1, distancia: 0,
    fase: 'sem-missao', carregado: false, seta: 0,
  });
  const [cam, setCam] = useState<CameraId>('perseguicao');
  const [noite, setNoite] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [re, setRe] = useState(false);
  const [pronto, setPronto] = useState(false);

  // ---- Arranque da cena ----
  useEffect(() => {
    if (!canvasRef.current) return;
    const j = new Jogo3D(canvasRef.current);
    jogoRef.current = j;
    j.onTelemetria = setTel;
    j.onEvento = (tipo, m) => {
      if (tipo === 'carregado') onCarregado(m);
      else onEntregue(m);
    };
    j.iniciar();
    setPronto(true);
    const onR = () => j.resize();
    window.addEventListener('resize', onR);
    window.addEventListener('orientationchange', onR);
    return () => {
      window.removeEventListener('resize', onR);
      window.removeEventListener('orientationchange', onR);
      j.destruir();
      jogoRef.current = null;
    };
  }, [onCarregado, onEntregue]);

  // ---- Carregar missão na cena ----
  useEffect(() => {
    if (pronto && missao && jogoRef.current) jogoRef.current.definirMissao(missao);
  }, [missao, pronto]);

  // ---- Teclado (para testar no browser) ----
  useEffect(() => {
    const c = () => jogoRef.current?.controls;
    const down = (e: KeyboardEvent) => {
      const ct = c();
      if (!ct) return;
      if (e.key === 'ArrowUp' || e.key === 'w') ct.acelerador = 1;
      if (e.key === 'ArrowDown' || e.key === 's') ct.travao = 1;
      if (e.key === 'ArrowLeft' || e.key === 'a') ct.volante = -1;
      if (e.key === 'ArrowRight' || e.key === 'd') ct.volante = 1;
      if (e.key === ' ') ct.travaoMao = true;
      if (e.key === 'r') { ct.marchaAtras = !ct.marchaAtras; setRe(ct.marchaAtras); }
      if (e.key === 'c') setCam(jogoRef.current!.proximaCamera());
    };
    const up = (e: KeyboardEvent) => {
      const ct = c();
      if (!ct) return;
      if (e.key === 'ArrowUp' || e.key === 'w') ct.acelerador = 0;
      if (e.key === 'ArrowDown' || e.key === 's') ct.travao = 0;
      if (['ArrowLeft', 'a', 'ArrowRight', 'd'].includes(e.key)) ct.volante = 0;
      if (e.key === ' ') ct.travaoMao = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 2000);
    return () => clearTimeout(t);
  }, [aviso]);

  const ctl = () => jogoRef.current?.controls;
  const setC = (k: 'acelerador' | 'travao', v: number) => {
    const c = ctl();
    if (c) c[k] = v;
  };

  // ---- Volante por arrasto ----
  const volanteRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: number; x0: number } | null>(null);
  const [angVol, setAngVol] = useState(0);

  const onDown = (e: React.PointerEvent) => {
    dragRef.current = { id: e.pointerId, x0: e.clientX };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    const v = Math.max(-1, Math.min(1, dx / 95));
    const c = ctl();
    if (c) c.volante = v;
    setAngVol(v * 115);
  };
  const onUp = (e: React.PointerEvent) => {
    if (dragRef.current?.id !== e.pointerId) return;
    dragRef.current = null;
    const c = ctl();
    if (c) c.volante = 0;
    setAngVol(0);
  };

  const acao = () => {
    const j = jogoRef.current;
    if (!j) return;
    const err = j.temCarga ? j.tentarEntregar() : j.tentarGuinchar();
    if (err) setAviso(err);
  };

  const perto = tel.distancia < (tel.carregado ? 12 : 9);
  const rpmPct = Math.min(100, ((tel.rpm - 500) / 2100) * 100);

  return (
    <div className="drive">
      <canvas ref={canvasRef} className="cv" />

      {/* ---------- HUD topo ---------- */}
      <div className="d-top">
        <button className="d-chip" onClick={onSair}>✕ Oficina</button>
        <div className="d-missao">
          {missao ? (
            <>
              <b>
                {tel.carregado ? '🏭 Levar à oficina' : '🚨 Ir buscar o carro'}
              </b>
              <span>
                {missao.cliente} · {missao.servico} · {missao.pagamento} Kz
              </span>
            </>
          ) : (
            <b>Passeio livre</b>
          )}
        </div>
        <button
          className="d-chip"
          onClick={() => {
            const n = !noite;
            setNoite(n);
            jogoRef.current?.definirNoite(n);
          }}
        >
          {noite ? '🌙' : '☀️'}
        </button>
      </div>

      {/* ---------- Bússola / seta para o alvo ---------- */}
      {missao && (
        <div className="d-nav">
          <div className="d-seta" style={{ transform: `rotate(${tel.seta}rad)` }}>
            ⬆
          </div>
          <b>{Math.round(tel.distancia)} m</b>
        </div>
      )}

      {/* ---------- Seletor de câmara ---------- */}
      <div className="d-cams">
        {CAMERAS.map((c) => (
          <button
            key={c.id}
            className={`d-cam ${cam === c.id ? 'on' : ''}`}
            onClick={() => {
              jogoRef.current?.mudarCamera(c.id);
              setCam(c.id);
            }}
            title={c.nome}
          >
            {c.icone}
          </button>
        ))}
      </div>

      {aviso && <div className="d-aviso">{aviso}</div>}

      {/* ---------- Painel de instrumentos ---------- */}
      <div className="d-painel">
        <div className="d-vel">
          <b>{Math.round(tel.kmh)}</b>
          <span>km/h</span>
        </div>
        <div className="d-rpm">
          <div className="d-rpm-bar">
            <i
              style={{
                width: `${rpmPct}%`,
                background: rpmPct > 82 ? 'var(--bad)' : 'var(--acc)',
              }}
            />
          </div>
          <span>
            {re ? 'R' : tel.marcha} · {Math.round(tel.rpm)} rpm
            {tel.carregado ? ' · 🚗 carga' : ''}
          </span>
        </div>
      </div>

      {/* ---------- Controlos ---------- */}
      <div className="d-ctl">
        <div
          className="d-volante"
          ref={volanteRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <div className="d-vol-img" style={{ transform: `rotate(${angVol}deg)` }}>
            <div className="d-vol-aro" />
            <div className="d-vol-h" />
            <div className="d-vol-v" />
            <div className="d-vol-c" />
          </div>
          <small>arrasta</small>
        </div>

        <div className="d-pedais">
          <button
            className={`d-acao ${perto && missao ? 'on' : ''}`}
            disabled={!missao || !perto}
            onClick={acao}
          >
            {tel.carregado ? '📥 Descarregar' : '🪝 Guinchar'}
          </button>

          <div className="d-p-row">
            <button
              className={`d-re ${re ? 'on' : ''}`}
              onClick={() => {
                const c = ctl();
                if (c) { c.marchaAtras = !c.marchaAtras; setRe(c.marchaAtras); }
              }}
            >
              {re ? 'R' : 'D'}
            </button>
            <button
              className="d-pedal travao"
              onPointerDown={() => setC('travao', 1)}
              onPointerUp={() => setC('travao', 0)}
              onPointerLeave={() => setC('travao', 0)}
              onPointerCancel={() => setC('travao', 0)}
            >
              🛑
            </button>
            <button
              className="d-pedal gas"
              onPointerDown={() => setC('acelerador', 1)}
              onPointerUp={() => setC('acelerador', 0)}
              onPointerLeave={() => setC('acelerador', 0)}
              onPointerCancel={() => setC('acelerador', 0)}
            >
              ⛽
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
