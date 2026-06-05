// Pico Figma plugin — code entry. Runs in the Figma sandbox (Figma API, no
// DOM/fetch). Receives messages from the UI and dispatches to the builders.

import type { UiToCode, CodeToUi } from "../shared/messages";
import { syncTokens } from "./tokens";
import { generateComponents } from "./components";
import { generateIcons } from "./icons";
import { reconstructPage } from "./page";

figma.showUI(__html__, { width: 340, height: 640, themeColors: false });

function send(msg: CodeToUi) {
  figma.ui.postMessage(msg);
}

function status(level: "info" | "success" | "error", message: string) {
  send({ type: "status", level, message });
}

function makeLogger(): (msg: string) => void {
  const lines: string[] = [];
  return (msg: string) => {
    lines.push(msg);
    status("info", lines.join("\n"));
  };
}

figma.ui.onmessage = async (msg: UiToCode) => {
  try {
    switch (msg.type) {
      case "sync-tokens": {
        const log = makeLogger();
        const source = msg.sourceLabel || "bundled tokens";
        const r = await syncTokens(log, msg.tokens);
        status(
          "success",
          `Tokens synced from ${source} — ${r.colors} colors, ${r.radius} radii, ${r.spacing} spacing, ${r.shadows} shadows, ${r.text} text styles.`,
        );
        break;
      }
      case "generate-components": {
        const log = makeLogger();
        const n = await generateComponents(log);
        status("success", `Generated ${n} Pico components / sets.`);
        break;
      }
      case "sync-icons": {
        const log = makeLogger();
        const n = await generateIcons(log);
        status("success", `Synced ${n} icon components on the Pico / Icons page.`);
        break;
      }
      case "reconstruct-page": {
        const log = makeLogger();
        const r = await reconstructPage(msg.page, msg.device, log);
        status(
          r.missing.length ? "info" : "success",
          r.missing.length
            ? `Page rebuilt. Missing components: ${r.missing.join(", ")}. Run "Generate components" first for full one-to-one mapping.`
            : `Page rebuilt — ${r.instances} component instances, ${r.frames} frames.`,
        );
        break;
      }
      default: {
        const _exhaustive: never = msg;
        void _exhaustive;
      }
    }
  } catch (e) {
    status("error", `Error: ${(e as Error).message}`);
  }
};
