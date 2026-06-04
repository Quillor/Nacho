#!/usr/bin/env node
// Per-component coverage gate for Pico's Figma-readable metadata contract.
//
// Every EXPORTED Pico component that renders a DOM node must stamp its identity
// via `picoMeta(...)` so a Figma plugin can map a live DOM node back to the
// component + variants. This script parses each component file with the
// TypeScript AST, enumerates every exported component, and fails (exit 1) if any
// of them neither calls `picoMeta(` in its body nor is explicitly allowlisted.
//
// Allowlist entries are keyed "file.tsx:ComponentName" and must carry a reason.
// Only justified non-DOM components belong here: pure context/providers (Radix
// Root/Portal/Sub/Provider that render no element or whose props type rejects
// data-* attributes) and thin composers whose root is another already-stamped
// pico-ui component.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const here = dirname(fileURLToPath(import.meta.url));
const componentsDir = join(here, "..", "src", "components");

// "file:Name": reason. Only justified non-DOM components belong here.
const ALLOWLIST = {
  // Pure composers — render only other already-stamped pico-ui components.
  "toaster.tsx:Toaster": "Composes already-stamped Toast* subcomponents; no own DOM root.",
  "command.tsx:CommandDialog": "Composes already-stamped Dialog + Command; no own DOM root.",

  // Radix Root/Provider/Portal/Sub — render no DOM element (context/portal only),
  // and their prop types reject data-* attributes, so there is nothing to stamp.
  "alert-dialog.tsx:AlertDialog": "Radix AlertDialog.Root — context only, renders no DOM.",
  "alert-dialog.tsx:AlertDialogPortal": "Radix Portal — no DOM element of its own.",
  "dialog.tsx:Dialog": "Radix Dialog.Root — context only, renders no DOM.",
  "dialog.tsx:DialogPortal": "Radix Portal — no DOM element of its own.",
  "sheet.tsx:Sheet": "Alias of Dialog.Root — context only, renders no DOM.",
  "sheet.tsx:SheetPortal": "Radix Portal — no DOM element of its own.",
  "drawer.tsx:Drawer": "Wraps vaul Drawer.Root — context only, renders no DOM.",
  "drawer.tsx:DrawerPortal": "Vaul Portal — no DOM element of its own.",
  "dropdown-menu.tsx:DropdownMenu": "Radix DropdownMenu.Root — context only.",
  "dropdown-menu.tsx:DropdownMenuPortal": "Radix Portal — no DOM element of its own.",
  "dropdown-menu.tsx:DropdownMenuSub": "Radix Sub — context only, renders no DOM.",
  "context-menu.tsx:ContextMenu": "Radix ContextMenu.Root — context only.",
  "context-menu.tsx:ContextMenuPortal": "Radix Portal — no DOM element of its own.",
  "context-menu.tsx:ContextMenuSub": "Radix Sub — context only, renders no DOM.",
  "menubar.tsx:MenubarMenu": "Radix Menubar.Menu — context only, renders no DOM.",
  "menubar.tsx:MenubarPortal": "Radix Portal — no DOM element of its own.",
  "menubar.tsx:MenubarSub": "Radix Sub — context only, renders no DOM.",
  "select.tsx:Select": "Radix Select.Root — context only, renders no DOM.",
  "tooltip.tsx:Tooltip": "Radix Tooltip.Root — context only, renders no DOM.",
  "tooltip.tsx:TooltipProvider": "Radix Tooltip.Provider — context only, renders no DOM.",
  "toast.tsx:ToastProvider": "Radix Toast.Provider — context only, renders no DOM.",
  "form.tsx:Form": "react-hook-form FormProvider — context only, renders no DOM.",
  "form.tsx:FormField": "Renders a Controller — context only, no DOM of its own.",

  // Recharts config / non-visual emitters.
  "chart.tsx:ChartTooltip": "Recharts Tooltip config component — no conventional DOM root.",
  "chart.tsx:ChartLegend": "Recharts Legend config component — no conventional DOM root.",
  "chart.tsx:ChartStyle": "Injects a <style> tag — not a visual component.",
};

function isPascal(name) {
  return /^[A-Z]/.test(name);
}

function declText(node, src) {
  return src.slice(node.getStart(), node.getEnd());
}

function analyzeFile(file, src) {
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const exported = new Set();
  const decls = new Map(); // name -> { hasBody, text }

  function recordDecl(name, node, hasBody) {
    if (!isPascal(name)) return;
    decls.set(name, { hasBody, text: declText(node, src) });
  }

  for (const stmt of sf.statements) {
    const isExportedInline =
      ts.canHaveModifiers(stmt) &&
      ts.getModifiers(stmt)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

    if (ts.isFunctionDeclaration(stmt) && stmt.name) {
      recordDecl(stmt.name.text, stmt, !!stmt.body);
      if (isExportedInline) exported.add(stmt.name.text);
    } else if (ts.isVariableStatement(stmt)) {
      for (const d of stmt.declarationList.declarations) {
        if (!ts.isIdentifier(d.name)) continue;
        const init = d.initializer;
        const hasBody =
          !!init &&
          (ts.isArrowFunction(init) ||
            ts.isFunctionExpression(init) ||
            ts.isCallExpression(init)); // forwardRef(...) / memo(...)
        recordDecl(d.name.text, stmt, hasBody);
        if (isExportedInline) exported.add(d.name.text);
      }
    } else if (ts.isExportDeclaration(stmt) && stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
      for (const el of stmt.exportClause.elements) exported.add(el.name.text);
    }
  }

  const components = [];
  for (const name of exported) {
    const d = decls.get(name);
    if (!d) continue; // re-exported type or non-local symbol
    if (!isPascal(name)) continue;
    const stamped = /picoMeta\s*\(/.test(d.text);
    components.push({ name, stamped, hasBody: d.hasBody });
  }
  return components;
}

const files = readdirSync(componentsDir).filter((f) => f.endsWith(".tsx")).sort();
const offenders = [];
const inventory = [];

for (const file of files) {
  const src = readFileSync(join(componentsDir, file), "utf8");
  const comps = analyzeFile(file, src);
  for (const c of comps) {
    const key = `${file}:${c.name}`;
    const allowed = key in ALLOWLIST;
    inventory.push({ key, stamped: c.stamped, allowed, hasBody: c.hasBody });
    if (!c.stamped && !allowed) offenders.push({ key, hasBody: c.hasBody });
  }
}

if (process.argv.includes("--list")) {
  for (const i of inventory) {
    const status = i.stamped ? "OK " : i.allowed ? "ALLOW" : "MISS";
    console.log(`${status}\t${i.key}${i.hasBody ? "" : "  (alias/no-body)"}`);
  }
  console.log(`\nTotal: ${inventory.length}, missing: ${offenders.length}`);
}

if (offenders.length > 0) {
  console.error(`pico-meta coverage FAILED — ${offenders.length} exported component(s) do not emit picoMeta():`);
  for (const o of offenders) console.error(`  - ${o.key}${o.hasBody ? "" : "  (pure re-export — wrap in a function or allowlist)"}`);
  console.error(
    "\nEvery exported component that renders a DOM node must spread `picoMeta(\"Name\", { ...variants })` on its root.\n" +
      "If a component renders no DOM (pure provider/context) or only composes another already-stamped pico-ui\n" +
      "component, add it to ALLOWLIST in this script with a reason.",
  );
  process.exit(1);
}

const allowed = Object.keys(ALLOWLIST).length;
console.log(`pico-meta coverage OK: ${inventory.length - allowed} exported components stamped, ${allowed} allowlisted.`);
