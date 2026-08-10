import { shadcn } from "@clerk/themes";

/**
 * Clerk appearance config shared by the sign-in/sign-up surfaces, styled to
 * the Pico brand. `routerBase`/`basePath` come from App (they depend on the
 * build's BASE_PATH), so this is a factory rather than a constant.
 */
export function buildClerkAppearance(routerBase: string, basePath: string) {
  return {
    theme: shadcn,
    cssLayerName: "clerk",
    options: {
      logoPlacement: "inside" as const,
      logoLinkUrl: routerBase || "/",
      logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
      socialButtonsPlacement: "bottom" as const,
    },
    variables: {
      colorPrimary: "hsl(var(--primary))",
      colorForeground: "hsl(var(--foreground))",
      colorMutedForeground: "hsl(var(--muted-foreground))",
      colorDanger: "hsl(var(--destructive))",
      colorBackground: "hsl(var(--background))",
      colorInput: "hsl(var(--background))",
      colorInputForeground: "hsl(var(--foreground))",
      colorNeutral: "hsl(var(--foreground))",
      fontFamily: "var(--app-font-sans)",
      borderRadius: "var(--radius)",
    },
    elements: {
      rootBox: "w-full flex justify-center",
      cardBox:
        "bg-background border-2 border-foreground shadow-md rounded-md w-[440px] max-w-full overflow-hidden",
      card: "!shadow-none !border-0 !bg-transparent !rounded-none",
      footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
      headerTitle:
        "text-foreground font-display font-extrabold tracking-tight text-2xl",
      headerSubtitle: "text-muted-foreground font-medium",
      socialButtonsBlockButtonText: "text-foreground font-bold",
      formFieldLabel: "text-foreground font-bold",
      footerActionLink:
        "text-foreground font-bold underline hover:text-foreground/70",
      footerActionText: "text-muted-foreground",
      resendCodeText: "text-foreground",
      dividerText: "text-muted-foreground",
      identityPreviewEditButton: "text-foreground",
      formFieldSuccessText: "text-foreground",
      alertText: "text-foreground",
      logoBox: "h-10",
      logoImage: "h-10",
      socialButtonsBlockButton: "border border-foreground hover:bg-muted",
      // Background + text color are forced to the Pico accent in index.css (the
      // shadcn theme reassigns `--accent` inside the Clerk card, so utility
      // classes can't reach the brand yellow here). These classes own the border,
      // weight, and the chunky press animation that match the in-app brand button.
      formButtonPrimary:
        "!border-2 !border-foreground !font-bold uppercase tracking-wide !shadow-sm !py-2.5 transition-all hover:translate-y-[2px] hover:!shadow-xs active:translate-y-[2px] active:!shadow-none",
      formFieldInput: "border border-foreground",
      footerAction: "",
      dividerLine: "bg-foreground",
      otpCodeFieldInput: "border border-foreground",
    },
  };
}
