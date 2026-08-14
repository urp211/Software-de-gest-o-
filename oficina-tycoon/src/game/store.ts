import { useCallback, useEffect, useRef, useState } from 'react';
import { estadoInicial, tick } from './engine';
import type { GameState } from './types';

const KEY = 'oficina-tycoon-save-v1';

function carregar(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return estadoInicial();
    const s = JSON.parse(raw) as GameState;
    if (!s || s.version !== 1) return estadoInicial();
    // Progresso offline limitado a 2 minutos de simulação
    const offline = Math.min(120, (Date.now() - (s.ultimoTick ?? Date.now())) / 1000);
    if (offline > 3) tick(s, offline);
    s.ultimoTick = Date.now();
    return s;
  } catch {
    return estadoInicial();
  }
}

export function useGame() {
  const [state, setState] = useState<GameState>(carregar);
  const [toast, setToast] = useState<string | null>(null);
  const [pausado, setPausado] = useState(false);
  const pausaRef = useRef(pausado);
  pausaRef.current = pausado;

  // Loop principal
  useEffect(() => {
    const int = setInterval(() => {
      if (pausaRef.current) return;
      setState((prev) => {
        const s: GameState = structuredClone(prev);
        tick(s, 0.5);
        s.ultimoTick = Date.now();
        return s;
      });
    }, 500);
    return () => clearInterval(int);
  }, []);

  // Auto-save
  useEffect(() => {
    const int = setInterval(() => {
      setState((prev) => {
        localStorage.setItem(KEY, JSON.stringify(prev));
        return prev;
      });
    }, 3000);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  /** Executa uma acção que muta o estado; devolve msg de erro para toast. */
  const act = useCallback((fn: (s: GameState) => string | null | void) => {
    setState((prev) => {
      const s: GameState = structuredClone(prev);
      const err = fn(s);
      if (err) {
        setToast(err);
        return prev;
      }
      return s;
    });
  }, []);

  const reiniciar = useCallback(() => {
    localStorage.removeItem(KEY);
    setState(estadoInicial());
  }, []);

  return { state, act, toast, setToast, pausado, setPausado, reiniciar };
}
