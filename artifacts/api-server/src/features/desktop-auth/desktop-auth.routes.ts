import { Router, type IRouter } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { authUserId } from "../../lib/dev-auth";
import {
  createAuthCode,
  consumeAuthCode,
  issueTokens,
  accessTokenFromRefresh,
} from "./desktop-auth.service";

// API endpoints (mounted under /api). The browser-served login page below calls
// /api/desktop/authorize with the user's Clerk web session.
const router: IRouter = Router();

// Mint a one-time code for a signed-in browser session (PKCE-bound).
router.post("/desktop/authorize", (req, res): void => {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "signed_out" });
    return;
  }
  const codeChallenge =
    typeof req.body?.codeChallenge === "string" ? req.body.codeChallenge : "";
  if (codeChallenge.length < 16) {
    res.status(400).json({ error: "invalid_code_challenge" });
    return;
  }
  res.json({ code: createAuthCode(userId, codeChallenge) });
});

// Exchange a code (+PKCE verifier) for access + refresh tokens.
router.post("/desktop/token", (req, res): void => {
  const code = typeof req.body?.code === "string" ? req.body.code : "";
  const codeVerifier =
    typeof req.body?.codeVerifier === "string" ? req.body.codeVerifier : "";
  if (!code || !codeVerifier) {
    res.status(400).json({ error: "bad_request" });
    return;
  }
  const userId = consumeAuthCode(code, codeVerifier);
  if (!userId) {
    res.status(400).json({ error: "invalid_code" });
    return;
  }
  res.json(issueTokens(userId));
});

// Refresh an access token.
router.post("/desktop/token/refresh", (req, res): void => {
  const refreshToken =
    typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";
  if (!refreshToken) {
    res.status(400).json({ error: "bad_request" });
    return;
  }
  const next = accessTokenFromRefresh(refreshToken);
  if (!next) {
    res.status(401).json({ error: "invalid_refresh" });
    return;
  }
  res.json(next);
});

// Current user profile for the desktop app (Clerk or desktop token).
router.get("/desktop/me", async (req, res): Promise<void> => {
  const userId = authUserId(req);
  if (!userId) {
    res.status(401).json({ error: "signed_out" });
    return;
  }
  try {
    const user = await clerkClient.users.getUser(userId);
    res.json({
      id: userId,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
    });
  } catch {
    res.json({ id: userId, email: null, name: null });
  }
});

export default router;

// ---- Browser login page (served under /api/desktop/login) --------------------

function loginHtml(publishableKey: string): string {
  // Self-contained page: loads clerk-js (same prod instance + same-origin
  // proxy as the web app), signs the user in if needed, then mints a code and
  // bounces back to the desktop app via the nacho:// deep link.
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Connect Nacho Desktop</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Platypi:wght@500;700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  :root { --bg:#f7f3e9; --fg:#1c1917; --muted:#6b6359; }
  * { box-sizing:border-box; }
  body { font-family:"DM Sans",-apple-system,system-ui,sans-serif; background:var(--bg); color:var(--fg); margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
  .card { width:440px; max-width:100%; text-align:center; background:#fffdf7; border:2px solid var(--fg); box-shadow:6px 6px 0 var(--fg); padding:32px 28px; }
  .mascot { width:180px; height:auto; margin:0 auto 10px; display:block; }
  h1 { font-family:"Platypi",Georgia,serif; font-size:28px; font-weight:800; margin:0 0 4px; letter-spacing:-0.01em; }
  .sub { color:var(--muted); font-weight:500; margin:0 0 20px; font-size:15px; }
  #status { margin-top:16px; color:var(--muted); font-weight:600; font-size:14px; }
  #signin { margin-top:8px; display:flex; justify-content:center; }
</style>
</head>
<body>
  <div class="card">
    <img class="mascot" src="/nacho-connect.png" alt="Nacho" />
    <h1>Connect Nacho Desktop</h1>
    <p class="sub">Sign in to link the desktop app to your account.</p>
    <div id="signin"></div>
    <div id="status">Loading…</div>
  </div>
  <!-- Load clerk-js through the same-origin Clerk proxy with the publishable
       key attribute — this is what creates window.Clerk (auto-init). Loading it
       generically and calling new Clerk() does NOT define window.Clerk in v5. -->
  <script
    async
    crossorigin="anonymous"
    data-clerk-publishable-key="${publishableKey}"
    data-clerk-proxy-url="/api/__clerk"
    src="/api/__clerk/npm/@clerk/clerk-js@5/dist/clerk.browser.js"
  ></script>
  <script>
    function setStatus(m){ var el=document.getElementById("status"); if(el) el.textContent=m; }
    async function start(){
      var params=new URLSearchParams(location.search);
      var state=params.get("state")||""; var cc=params.get("code_challenge")||"";
      if(!state||!cc){ setStatus("Invalid sign-in link."); return; }
      if(!window.Clerk){ setStatus("Sign-in failed to load. Please retry."); return; }
      try{ await window.Clerk.load(); }catch(e){ setStatus("Couldn't load sign-in."); return; }
      async function authorize(){
        setStatus("Authorizing…");
        try{
          var r=await fetch("/api/desktop/authorize",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({codeChallenge:cc})});
          if(!r.ok){ setStatus("Please sign in to continue."); return false; }
          var data=await r.json();
          setStatus("Returning to Nacho…");
          location.href="nacho://auth?code="+encodeURIComponent(data.code)+"&state="+encodeURIComponent(state);
          return true;
        }catch(e){ setStatus("Something went wrong. Try again."); return false; }
      }
      if(window.Clerk.user){ authorize(); return; }
      window.Clerk.addListener(function(res){ if(res&&res.user) authorize(); });
      setStatus("Sign in to connect the desktop app.");
      window.Clerk.mountSignIn(document.getElementById("signin"), {
        appearance: {
          variables: {
            colorPrimary: "#1c1917",
            borderRadius: "0px",
            fontFamily: '"DM Sans", sans-serif',
          },
        },
      });
    }
    if(document.readyState==="complete") start(); else window.addEventListener("load", start);
  </script>
</body>
</html>`;
}

// Registered on the /api router (above) so production routes it to this backend;
// a root /desktop/login would be shadowed by the static SPA and return index.html.
router.get("/desktop/login", (req, res): void => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(loginHtml(process.env.CLERK_PUBLISHABLE_KEY ?? ""));
});
