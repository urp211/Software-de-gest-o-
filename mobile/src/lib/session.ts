export type SessionUser = {
  id: number;
  username: string;
  name: string;
  role: string;
  autoLogoutTime: number | null;
  loggedAt: number;
  extraPermissions?: string[] | null;
};

const KEY = "makina_session_v2";

export function saveSession(user: Omit<SessionUser, "loggedAt">) {
  const payload: SessionUser = { ...user, loggedAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(payload));
  // migrate clear old key
  try {
    localStorage.removeItem("makina_session_v1");
  } catch {
    /* ignore */
  }
  return payload;
}

export function getSession(): SessionUser | null {
  try {
    const raw =
      localStorage.getItem(KEY) || localStorage.getItem("makina_session_v1");
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
  localStorage.removeItem("makina_session_v1");
}
