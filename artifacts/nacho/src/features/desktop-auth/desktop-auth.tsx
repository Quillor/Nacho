import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { desktopBridge } from "@/lib/desktop";
import { DESKTOP_API_URL, setDesktopTokenGetter } from "@/lib/desktop-api";
import { randomVerifier, challengeFromVerifier, randomState } from "./pkce";

export interface DesktopUser {
  id: string;
  email: string | null;
  name: string | null;
}

type Status = "loading" | "signed-out" | "signed-in";

interface DesktopAuthValue {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: DesktopUser | null;
  signIn: () => Promise<void>;
  signOut: () => void;
}

const REFRESH_KEY = "nacho.desktop.refreshToken";
const Ctx = createContext<DesktopAuthValue | null>(null);

export function useDesktopAuth(): DesktopAuthValue {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("useDesktopAuth must be used within DesktopAuthProvider");
  }
  return v;
}

const api = (path: string) => `${DESKTOP_API_URL}${path}`;

export function DesktopAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<DesktopUser | null>(null);

  // Token state lives in refs so getToken() can read it without re-renders.
  const accessRef = useRef<string | null>(null);
  const accessExpRef = useRef<number>(0); // epoch ms
  const refreshRef = useRef<string | null>(
    typeof localStorage !== "undefined"
      ? localStorage.getItem(REFRESH_KEY)
      : null,
  );
  const verifierRef = useRef<string | null>(null);
  const stateRef = useRef<string | null>(null);

  const setRefresh = (t: string | null) => {
    refreshRef.current = t;
    if (t) localStorage.setItem(REFRESH_KEY, t);
    else localStorage.removeItem(REFRESH_KEY);
  };

  const refreshAccess = useCallback(async (): Promise<string | null> => {
    const rt = refreshRef.current;
    if (!rt) return null;
    try {
      const r = await fetch(api("/api/desktop/token/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!r.ok) {
        setRefresh(null);
        accessRef.current = null;
        return null;
      }
      const data = (await r.json()) as {
        accessToken: string;
        expiresIn: number;
      };
      accessRef.current = data.accessToken;
      accessExpRef.current = Date.now() + (data.expiresIn ?? 3600) * 1000;
      return data.accessToken;
    } catch {
      return null;
    }
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (accessRef.current && Date.now() < accessExpRef.current - 60_000) {
      return accessRef.current;
    }
    return refreshAccess();
  }, [refreshAccess]);

  const fetchMe = useCallback(async (): Promise<DesktopUser | null> => {
    const token = await getToken();
    if (!token) return null;
    try {
      const r = await fetch(api("/api/desktop/me"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return null;
      return (await r.json()) as DesktopUser;
    } catch {
      return null;
    }
  }, [getToken]);

  // Expose the token getter to the API layer (publish + generated hooks).
  useEffect(() => {
    setDesktopTokenGetter(getToken);
    return () => setDesktopTokenGetter(null);
  }, [getToken]);

  // Restore an existing session on launch.
  useEffect(() => {
    let active = true;
    void (async () => {
      if (!refreshRef.current) {
        if (active) setStatus("signed-out");
        return;
      }
      const me = await fetchMe();
      if (!active) return;
      if (me) {
        setUser(me);
        setStatus("signed-in");
      } else {
        setRefresh(null);
        setStatus("signed-out");
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchMe]);

  // Handle the nacho://auth deep-link returned by the browser sign-in.
  useEffect(() => {
    const bridge = desktopBridge;
    if (!bridge) return;
    return bridge.onAuthCallback(async (url) => {
      let code: string | null = null;
      let state: string | null = null;
      try {
        const parsed = new URL(url);
        code = parsed.searchParams.get("code");
        state = parsed.searchParams.get("state");
      } catch {
        return;
      }
      if (
        !code ||
        !state ||
        state !== stateRef.current ||
        !verifierRef.current
      ) {
        return;
      }
      try {
        const r = await fetch(api("/api/desktop/token"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, codeVerifier: verifierRef.current }),
        });
        if (!r.ok) return;
        const data = (await r.json()) as {
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
        };
        accessRef.current = data.accessToken;
        accessExpRef.current = Date.now() + (data.expiresIn ?? 3600) * 1000;
        setRefresh(data.refreshToken);
        verifierRef.current = null;
        stateRef.current = null;
        const me = await fetchMe();
        setUser(me);
        setStatus("signed-in");
      } catch {
        /* ignore — user can retry */
      }
    });
  }, [fetchMe]);

  const signIn = useCallback(async () => {
    const bridge = desktopBridge;
    if (!bridge) return;
    const verifier = randomVerifier();
    const state = randomState();
    verifierRef.current = verifier;
    stateRef.current = state;
    const challenge = await challengeFromVerifier(verifier);
    const url =
      `${DESKTOP_API_URL}/api/desktop/login` +
      `?state=${encodeURIComponent(state)}` +
      `&code_challenge=${encodeURIComponent(challenge)}`;
    await bridge.openExternal(url);
  }, []);

  const signOut = useCallback(() => {
    setRefresh(null);
    accessRef.current = null;
    accessExpRef.current = 0;
    setUser(null);
    setStatus("signed-out");
  }, []);

  const value: DesktopAuthValue = {
    isLoaded: status !== "loading",
    isSignedIn: status === "signed-in",
    user,
    signIn,
    signOut,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
