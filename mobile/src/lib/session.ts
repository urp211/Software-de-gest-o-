export type SessionUser = {
  id: number;
  username: string;
  name: string;
  role: "ADMIN" | "OPERATOR";
  autoLogoutTime: number | null;
  loggedAt: number;
};

const KEY = "makina_session_v1";

export function saveSession(user: Omit<SessionUser, "loggedAt">) {
  const payload: SessionUser = { ...user, loggedAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(payload));
  return payload;
}

export function getSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SessionUser;
    if (data.autoLogoutTime) {
      const expires = data.loggedAt + data.autoLogoutTime * 60 * 1000;
      if (Date.now() > expires) {
        clearSession();
        return null;
      }
    }
    return data;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(KEY);
}
