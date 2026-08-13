import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { login as dbLogin } from "../lib/db";
import {
  clearSession,
  getSession,
  saveSession,
  type SessionUser,
} from "../lib/session";
import { seedIfNeeded } from "../lib/db";

type AuthCtx = {
  user: SessionUser | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await seedIfNeeded();
        setUser(getSession());
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const u = await dbLogin(username, password);
      if (!u) return { ok: false as const, error: "Credenciais inválidas" };
      const session = saveSession(u);
      setUser(session);
      return { ok: true as const };
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : "Erro ao iniciar sessão",
      };
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, logout }),
    [user, ready, login, logout]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
