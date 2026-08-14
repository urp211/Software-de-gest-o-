import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { login as dbLogin, seedIfNeeded } from "../lib/db";
import {
  clearSession,
  getSession,
  saveSession,
  type SessionUser,
} from "../lib/session";
import { can as roleCan, type Permission } from "../lib/roles";
import { ensureOrgTracking } from "../lib/sync";

type AuthCtx = {
  user: SessionUser | null;
  ready: boolean;
  login: (
    username: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  can: (permission: Permission) => boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await seedIfNeeded();
        const s = getSession();
        setUser(s);
        if (s) {
          try {
            await ensureOrgTracking();
          } catch {
            /* ignore */
          }
        }
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
      try {
        await ensureOrgTracking();
      } catch {
        /* ignore */
      }
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

  const canFn = useCallback(
    (permission: Permission) => roleCan(user?.role, permission, user?.extraPermissions as Permission[] | undefined),
    [user]
  );

  const value = useMemo(
    () => ({ user, ready, login, logout, can: canFn }),
    [user, ready, login, logout, canFn]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
