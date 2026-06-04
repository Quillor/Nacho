/**
 * Pico component metadata — single source of truth for the machine-readable
 * identity that a tool (e.g. the Pico Figma plugin) reads off a rendered page
 * to map a DOM node back to the correct Pico component and variant.
 *
 * Every instrumented component spreads `picoMeta(...)` onto its rendered root
 * element. This stamps:
 *   - `data-pico-component` — the canonical component name (e.g. "Button").
 *     These names ARE the canonical Figma component names.
 *   - `data-pico-<axis>`     — each resolved variant axis (e.g.
 *     `data-pico-variant="brand"`, `data-pico-size="lg"`). These become the
 *     Figma component's variant property values.
 *
 * Keep the names here stable: they are the contract the plugin maps against.
 */

export const PICO_COMPONENT_ATTR = "data-pico-component";

export type PicoVariantValue = string | number | boolean | null | undefined;

/**
 * Build the `data-pico-*` attribute bag for a component instance.
 *
 * @param component Canonical component name (PascalCase, e.g. "Button").
 * @param variants  Resolved variant axes. `null`/`undefined` values are skipped
 *                  so only the axes a component actually exposes are emitted.
 */
export function picoMeta(
  component: string,
  variants?: Record<string, PicoVariantValue>,
): Record<string, string> {
  const attrs: Record<string, string> = {
    [PICO_COMPONENT_ATTR]: component,
  };
  if (variants) {
    for (const [axis, value] of Object.entries(variants)) {
      // Only skip axes a component does not expose on this instance (null /
      // undefined). An explicit `false` is a resolved variant selection (e.g.
      // `inset={false}`) and is preserved as "false" so the plugin sees the
      // full variant state rather than an ambiguous absence.
      if (value === null || value === undefined) continue;
      attrs[`data-pico-${axis}`] = String(value);
    }
  }
  return attrs;
}
