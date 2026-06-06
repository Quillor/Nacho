import { useEffect } from "react";

type Mode = "sign-in" | "sign-up";

// Clerk's prebuilt <SignIn>/<SignUp> components render their email/password
// inputs without `autocomplete` attributes on some steps, which triggers a
// browser console warning ("Input elements should have autocomplete
// attributes") and blocks password-manager autofill. Clerk exposes no prop for
// this, so we set sensible values once the inputs mount and re-apply whenever
// Clerk swaps form steps.
export function useClerkAutocomplete(mode: Mode) {
  useEffect(() => {
    const apply = () => {
      const inputs = document.querySelectorAll<HTMLInputElement>(
        ".cl-formFieldInput",
      );
      inputs.forEach((input) => {
        if (input.getAttribute("autocomplete")) return;
        const name = (input.name || "").toLowerCase();
        const type = (input.type || "").toLowerCase();
        if (type === "password" || name.includes("password")) {
          input.setAttribute(
            "autocomplete",
            mode === "sign-up" ? "new-password" : "current-password",
          );
        } else if (
          type === "email" ||
          name.includes("email") ||
          name === "identifier"
        ) {
          input.setAttribute(
            "autocomplete",
            mode === "sign-up" ? "email" : "username",
          );
        }
      });
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [mode]);
}
