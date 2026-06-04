import { CodeBlock } from "@workspace/pico-ui/code-block";

export default function FigmaPlugin() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-[0.9] text-foreground uppercase">
          Figma Plugin
        </h1>
        <p className="text-xl max-w-2xl font-medium leading-relaxed text-foreground/80">
          A companion Figma plugin that turns Pico into a living design source —
          it syncs the tokens into Figma variables and styles, generates the
          component library as real Figma components, and reconstructs a page
          from a URL using those components and tokens.
        </p>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-3xl font-display font-black uppercase">What It Does</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border-4 border-foreground rounded-sm p-6 bg-card shadow-md space-y-2">
              <h3 className="text-xl font-display font-black uppercase">Sync Tokens</h3>
              <p className="font-medium text-foreground/80">
                Reads <code className="bg-foreground/10 px-1 rounded-sm">tokens.json</code> and
                creates a <strong>Pico</strong> variable collection with Light and
                Dark modes for every color, float variables for radius, effect
                styles for shadows, and text styles for the type scale.
              </p>
            </div>
            <div className="border-4 border-foreground rounded-sm p-6 bg-card shadow-md space-y-2">
              <h3 className="text-xl font-display font-black uppercase">Generate Components</h3>
              <p className="font-medium text-foreground/80">
                Builds the Pico components — Button, Badge, Card, Input, Alert,
                Label, Switch, Checkbox, Separator, Avatar, Textarea, Tooltip,
                Progress, Skeleton, Spinner — as real Figma components with
                variants, auto-layout, and fills bound to the synced variables
                and effect styles.
              </p>
            </div>
            <div className="border-4 border-foreground rounded-sm p-6 bg-card shadow-md space-y-2">
              <h3 className="text-xl font-display font-black uppercase">Page From URL</h3>
              <p className="font-medium text-foreground/80">
                Paste a URL and pick a device size. The plugin reads the rendered
                page, maps each <code className="bg-foreground/10 px-1 rounded-sm">data-pico-*</code> instrumented
                element to a component instance, and rebuilds the layout at the
                chosen frame size with token-bound styling.
              </p>
            </div>
            <div className="border-4 border-foreground rounded-sm p-6 bg-card shadow-md space-y-2">
              <h3 className="text-xl font-display font-black uppercase">Placeholder Pages</h3>
              <p className="font-medium text-foreground/80">
                Generates a ready-made sample layout from real instances and
                tokens. Auth-walled URLs (sign-in redirects, 401/403) are routed
                to a dedicated <strong>Pico / Placeholder</strong> page instead of
                blocking the flow.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-display font-black uppercase">Build & Load</h2>
          <p className="font-medium text-foreground/80">
            The plugin lives in the workspace at{" "}
            <code className="bg-foreground/10 px-1 rounded-sm">lib/pico-figma-plugin</code>.
            Build it, then load the generated manifest in Figma's desktop app.
          </p>
          <CodeBlock code={`# From the repo root
pnpm --filter @workspace/pico-figma-plugin run build

# Produces:
#   lib/pico-figma-plugin/dist/code.js
#   lib/pico-figma-plugin/dist/ui.html
#   lib/pico-figma-plugin/manifest.json`} />
          <ol className="list-decimal list-inside space-y-2 font-medium text-foreground/80">
            <li>Open the Figma desktop app (plugins in development require it).</li>
            <li>
              Go to <strong>Plugins → Development → Import plugin from manifest…</strong>
            </li>
            <li>
              Select <code className="bg-foreground/10 px-1 rounded-sm">lib/pico-figma-plugin/manifest.json</code>.
            </li>
            <li>
              Run <strong>Pico</strong> from <strong>Plugins → Development</strong>.
            </li>
          </ol>
          <p className="font-medium text-foreground/80">
            During active work you can keep esbuild watching for changes:
          </p>
          <CodeBlock code={`pnpm --filter @workspace/pico-figma-plugin run watch`} />
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-display font-black uppercase">Recommended Order</h2>
          <p className="font-medium text-foreground/80">
            Each action is idempotent — re-running updates existing variables,
            styles, and components in place rather than duplicating them. For a
            fresh file, run them top to bottom:
          </p>
          <div className="border-4 border-foreground rounded-sm overflow-hidden bg-background">
            <table className="w-full text-left text-sm">
              <thead className="bg-foreground text-background uppercase font-bold text-xs tracking-wider">
                <tr>
                  <th className="p-4 border-b-4 border-foreground">Step</th>
                  <th className="p-4 border-b-4 border-foreground">Action</th>
                  <th className="p-4 border-b-4 border-foreground">Why first</th>
                </tr>
              </thead>
              <tbody className="divide-y-4 divide-foreground">
                <tr>
                  <td className="p-4 font-mono bg-primary/10">1</td>
                  <td className="p-4 font-bold uppercase">Sync Tokens</td>
                  <td className="p-4 font-medium">Variables &amp; styles must exist before components can bind to them.</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono">2</td>
                  <td className="p-4 font-bold uppercase">Generate Components</td>
                  <td className="p-4 font-medium">Page reconstruction maps elements to these component instances.</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono bg-primary/10">3</td>
                  <td className="p-4 font-bold uppercase">Page From URL</td>
                  <td className="p-4 font-medium">Rebuilds a real layout using the synced tokens and components.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-display font-black uppercase">How Page-From-URL Works</h2>
          <p className="font-medium text-foreground/80">
            Figma can't run a browser, so the plugin uses a fetch step to obtain
            the page's HTML and then walks the DOM looking for the same
            instrumentation the Pico site emits:
          </p>
          <ul className="list-disc list-inside space-y-2 font-medium text-foreground/80">
            <li>
              <code className="bg-foreground/10 px-1 rounded-sm">data-pico-component</code> — the canonical component name, mapped to a generated Figma component.
            </li>
            <li>
              <code className="bg-foreground/10 px-1 rounded-sm">data-pico-&lt;axis&gt;</code> — variant axes (e.g. variant, size) used to pick the matching component variant.
            </li>
            <li>
              <code className="bg-foreground/10 px-1 rounded-sm">data-pico-section</code> — landmark sections that become named auto-layout frames.
            </li>
          </ul>
          <p className="font-medium text-foreground/80">
            Elements without instrumentation become token-bound auto-layout
            frames inferred from their styling. Pages behind a login wall can't be
            read, so they're routed to a placeholder instead. The result lands on a{" "}
            <strong>Pico / Pages</strong> page, sized to your chosen device
            (presets plus a custom width/height option).
          </p>
          <p className="font-medium text-foreground/80">
            Each component the plugin recognizes is placed as a real instance —
            resolved from the components in the current file <em>or</em> from an
            externally published Pico library linked into the file (any instance
            of a library component lets the plugin spin up more). Token colors
            bind to the matching <strong>Pico</strong> variables, again looked up
            locally first and then in a linked library.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-display font-black uppercase">Render Service (Optional)</h2>
          <p className="font-medium text-foreground/80">
            The plugin iframe can fetch URLs directly, but browsers block most
            cross-origin requests (CORS), and server-rendered markup is what the
            reader needs. The <strong>API Server</strong> artifact ships a small
            companion endpoint that fetches a URL server-side and returns its
            HTML, sidestepping CORS. Paste its base URL into the optional{" "}
            <strong>Render service</strong> field in the panel.
          </p>
          <CodeBlock code={`# The endpoint (mounted by the API Server artifact):
GET /api/render?url=<page-url>
# → { finalUrl, status, html }
# Private / loopback / cloud-metadata addresses are refused (SSRF guard).`} />
          <p className="font-medium text-foreground/80">
            A Figma plugin still can't execute a page's JavaScript, so a purely
            client-rendered single-page app returns its empty shell. Use the
            render service against server-rendered or static pages whose delivered
            HTML already carries the <code className="bg-foreground/10 px-1 rounded-sm">data-pico-*</code>{" "}
            instrumentation.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-display font-black uppercase">Contrast Rules Apply</h2>
          <p className="font-medium text-foreground/80">
            Generated components follow the Pico contrast rules: the yellow
            primary is always a <strong>fill</strong> with brown text on top —
            never yellow text on a light surface. Readable text on cream and card
            surfaces uses <code className="bg-foreground/10 px-1 rounded-sm">foreground</code>, so
            everything the plugin produces stays legible and on-brand.
          </p>
        </section>
      </div>
    </div>
  );
}
