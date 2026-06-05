// Low-level Figma helpers shared by the token, component, and page builders.
// Everything here is idempotent: re-running an action finds the existing node
// by name and updates it in place instead of creating a duplicate.

export const COLLECTION_NAME = "Pico";
export const MODE_LIGHT = "Light";
export const MODE_DARK = "Dark";

export const COMPONENTS_PAGE = "Pico / Components";
export const ICONS_PAGE = "Pico / Icons";
export const PLACEHOLDER_PAGE = "Pico / Placeholder";
export const PAGES_PAGE = "Pico / Pages";

let fontsReady = false;

/** Load the fonts the plugin draws with. Falls back to Inter if unavailable. */
export async function ensureFonts(): Promise<{
  display: FontName;
  body: FontName;
  bold: FontName;
  mono: FontName;
}> {
  const tryLoad = async (family: string, style: string): Promise<FontName | null> => {
    try {
      const f = { family, style };
      await figma.loadFontAsync(f);
      return f;
    } catch {
      return null;
    }
  };
  const display =
    (await tryLoad("Platypi", "ExtraBold")) ||
    (await tryLoad("Platypi", "Bold")) ||
    (await tryLoad("Bricolage Grotesque", "ExtraBold")) ||
    (await tryLoad("Inter", "Black")) ||
    (await tryLoad("Inter", "Bold")) || { family: "Inter", style: "Bold" };
  const body =
    (await tryLoad("DM Sans", "Regular")) || { family: "Inter", style: "Regular" };
  const bold =
    (await tryLoad("DM Sans", "Bold")) ||
    (await tryLoad("Inter", "Bold")) || { family: "Inter", style: "Bold" };
  const mono =
    (await tryLoad("Menlo", "Regular")) ||
    (await tryLoad("Roboto Mono", "Regular")) || { family: "Inter", style: "Regular" };
  fontsReady = true;
  return { display, body, bold, mono };
}

export function assertFontsReady() {
  if (!fontsReady) throw new Error("Fonts not loaded — call ensureFonts() first.");
}

// ---- Variable collection / variables ------------------------------------

export async function getOrCreateCollection(): Promise<VariableCollection> {
  const all = await figma.variables.getLocalVariableCollectionsAsync();
  let collection = all.find((c) => c.name === COLLECTION_NAME);
  if (!collection) {
    collection = figma.variables.createVariableCollection(COLLECTION_NAME);
  }
  // Ensure Light + Dark modes exist (first mode is renamed to Light).
  const modeByName = new Map(collection.modes.map((m) => [m.name, m.modeId]));
  if (!modeByName.has(MODE_LIGHT)) {
    collection.renameMode(collection.modes[0].modeId, MODE_LIGHT);
  }
  const refreshed = collection.modes.map((m) => m.name);
  if (!refreshed.includes(MODE_DARK)) {
    collection.addMode(MODE_DARK);
  }
  return collection;
}

export function getModeId(collection: VariableCollection, name: string): string {
  const mode = collection.modes.find((m) => m.name === name);
  if (!mode) throw new Error(`Mode ${name} not found`);
  return mode.modeId;
}

export async function getOrCreateVariable(
  name: string,
  collection: VariableCollection,
  type: VariableResolvedDataType,
): Promise<Variable> {
  const existing = await figma.variables.getLocalVariablesAsync();
  const found = existing.find(
    (v) => v.name === name && v.variableCollectionId === collection.id,
  );
  if (found) return found;
  return figma.variables.createVariable(name, collection, type);
}

// Cache of spacing FLOAT variables keyed by their px value, so page
// reconstruction can bind auto-layout gap/padding to a Pico space token when the
// captured pixel value matches one exactly.
let spaceVarCache: Map<number, Variable> | null = null;

export async function findSpaceVariable(px: number): Promise<Variable | null> {
  if (!Number.isFinite(px) || px <= 0) return null;
  if (!spaceVarCache) {
    spaceVarCache = new Map();
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const pico = collections.find((c) => c.name === COLLECTION_NAME);
    const all = await figma.variables.getLocalVariablesAsync();
    for (const v of all) {
      if (v.resolvedType !== "FLOAT" || !v.name.startsWith("space/")) continue;
      if (pico && v.variableCollectionId !== pico.id) continue;
      const modeId = pico
        ? pico.modes[0].modeId
        : Object.keys(v.valuesByMode)[0];
      const val = v.valuesByMode[modeId];
      if (typeof val === "number" && !spaceVarCache.has(val)) {
        spaceVarCache.set(val, v);
      }
    }
  }
  return spaceVarCache.get(px) ?? null;
}

// Cache of library color-variable keys by name, and of variables imported from
// a linked library, so token-attach can bind against an externally published
// Pico library when the variable isn't defined locally.
let libColorKeys: Map<string, string> | null = null;
const importedLibVars = new Map<string, Variable>();

async function findLibraryColorVariable(name: string): Promise<Variable | null> {
  if (importedLibVars.has(name)) return importedLibVars.get(name) ?? null;
  try {
    if (!libColorKeys) {
      libColorKeys = new Map();
      const collections =
        await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
      for (const col of collections) {
        const vars =
          await figma.teamLibrary.getVariablesInLibraryCollectionAsync(col.key);
        for (const v of vars) {
          if (v.resolvedType === "COLOR" && !libColorKeys.has(v.name)) {
            libColorKeys.set(v.name, v.key);
          }
        }
      }
    }
    const key = libColorKeys.get(name);
    if (!key) return null;
    const imported = await figma.variables.importVariableByKeyAsync(key);
    importedLibVars.set(name, imported);
    return imported;
  } catch {
    // Team-library APIs are unavailable in some contexts (e.g. no linked
    // library / insufficient permission); fall back to "not found".
    return null;
  }
}

/**
 * Find a color variable by its Pico name (e.g. "primary" → "color/primary").
 * Resolves against the local file first, then any externally published Pico
 * library linked into the file.
 */
export async function findColorVariable(
  tokenName: string,
): Promise<Variable | null> {
  const name = `color/${tokenName}`;
  const all = await figma.variables.getLocalVariablesAsync();
  const local = all.find(
    (v) => v.name === name && v.resolvedType === "COLOR",
  );
  if (local) return local;
  return findLibraryColorVariable(name);
}

// ---- Paints / fills ------------------------------------------------------

export function solidPaint(rgb: { r: number; g: number; b: number }): SolidPaint {
  return { type: "SOLID", color: rgb, opacity: 1 };
}

/** A solid paint bound to a Pico color variable (so it stays in sync). */
export function boundPaint(variable: Variable): SolidPaint {
  const base = solidPaint({ r: 0, g: 0, b: 0 });
  return figma.variables.setBoundVariableForPaint(base, "color", variable);
}

/** Set a node's fills to a bound variable when available, else a raw color. */
export async function applyFill(
  node: GeometryMixin & { fills: ReadonlyArray<Paint> | typeof figma.mixed },
  tokenName: string | undefined,
  fallbackRgb?: { r: number; g: number; b: number },
) {
  if (tokenName) {
    const variable = await findColorVariable(tokenName);
    if (variable) {
      node.fills = [boundPaint(variable)];
      return;
    }
  }
  if (fallbackRgb) {
    node.fills = [solidPaint(fallbackRgb)];
  }
}

export async function applyStroke(
  node: MinimalStrokesMixin,
  tokenName: string | undefined,
  weight: number,
  fallbackRgb?: { r: number; g: number; b: number },
) {
  if (tokenName) {
    const variable = await findColorVariable(tokenName);
    if (variable) {
      node.strokes = [boundPaint(variable)];
      node.strokeWeight = weight;
      return;
    }
  }
  if (fallbackRgb) {
    node.strokes = [solidPaint(fallbackRgb)];
    node.strokeWeight = weight;
  }
}

// ---- Effect styles (chunky shadows) -------------------------------------

export async function getOrCreateEffectStyle(name: string): Promise<EffectStyle> {
  const styles = await figma.getLocalEffectStylesAsync();
  const found = styles.find((s) => s.name === name);
  if (found) return found;
  const style = figma.createEffectStyle();
  style.name = name;
  return style;
}

export async function getOrCreateTextStyle(name: string): Promise<TextStyle> {
  const styles = await figma.getLocalTextStylesAsync();
  const found = styles.find((s) => s.name === name);
  if (found) return found;
  const style = figma.createTextStyle();
  style.name = name;
  return style;
}

const TEXT_ROLE_LABELS: Record<string, string> = {
  display: "Display",
  heading: "Heading",
  body: "Body",
  bold: "Body Bold",
  mono: "Mono",
};

export function textRoleLabel(role: string): string {
  return TEXT_ROLE_LABELS[role] ?? "Body";
}

/**
 * Get-or-create a shared Pico text style for a role + size (e.g. "Pico/Body/14")
 * and keep its font/size in sync. Text nodes bind to these so the type ramp
 * stays connected to named styles instead of detached ad-hoc font settings.
 */
export async function getOrCreateRoleTextStyle(
  role: string,
  size: number,
  font: FontName,
): Promise<TextStyle> {
  const style = await getOrCreateTextStyle(
    `Pico/${textRoleLabel(role)}/${size}`,
  );
  style.fontName = font;
  style.fontSize = size;
  return style;
}

/** Semantic type-scale role key → human label for named Figma text styles. */
const SCALE_ROLE_LABELS: Record<string, string> = {
  display: "Display",
  h1: "H1",
  h2: "H2",
  h3: "H3",
  h4: "H4",
  "body-lg": "Body Large",
  body: "Body",
  caption: "Caption",
};

export function scaleStyleName(roleKey: string): string {
  return `Pico/Type/${SCALE_ROLE_LABELS[roleKey] ?? roleKey}`;
}

/** CSS em letter-spacing ("-0.02em") → Figma PERCENT (1em = 100%). */
function emToPercent(letterSpacing: string): number {
  const m = letterSpacing.match(/(-?\d*\.?\d+)\s*em/);
  return m ? parseFloat(m[1]) * 100 : 0;
}

/**
 * Get-or-create a named semantic text style from a Pico type-scale role
 * (e.g. "Pico/Type/Display") with explicit size, line-height (%) and tracking,
 * so the Figma type ramp matches the documented Pico scale exactly.
 */
export async function getOrCreateScaleTextStyle(
  roleKey: string,
  role: { sizePx: number; lineHeight: number; letterSpacing: string },
  font: FontName,
): Promise<TextStyle> {
  const style = await getOrCreateTextStyle(scaleStyleName(roleKey));
  style.fontName = font;
  style.fontSize = role.sizePx;
  style.lineHeight = {
    unit: "PERCENT",
    value: Math.round(role.lineHeight * 100),
  };
  style.letterSpacing = {
    unit: "PERCENT",
    value: emToPercent(role.letterSpacing),
  };
  return style;
}

export async function findEffectStyle(name: string): Promise<EffectStyle | null> {
  const styles = await figma.getLocalEffectStylesAsync();
  return styles.find((s) => s.name === name) || null;
}

/** Bind a node's effect to a Pico shadow effect style (by shadow token key). */
export async function applyShadow(
  node: BlendMixin,
  shadowKey: string | undefined,
) {
  if (!shadowKey) return;
  const style = await findEffectStyle(effectStyleName(shadowKey));
  if (style) await node.setEffectStyleIdAsync(style.id);
}

export function effectStyleName(key: string): string {
  return `Pico/Shadow/${key === "DEFAULT" ? "base" : key}`;
}

// ---- Pages ---------------------------------------------------------------

export async function getOrCreatePage(name: string): Promise<PageNode> {
  await figma.loadAllPagesAsync();
  const found = figma.root.children.find((p) => p.name === name);
  if (found) return found;
  const page = figma.createPage();
  page.name = name;
  return page;
}

/** Find a top-level node by name on a page (for idempotent re-runs). */
export function findChildByName(parent: BaseNode & ChildrenMixin, name: string) {
  return parent.children.find((c) => c.name === name) || null;
}

export function removeChildByName(parent: BaseNode & ChildrenMixin, name: string) {
  const existing = findChildByName(parent, name);
  if (existing) existing.remove();
}
