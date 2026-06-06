import { CodeBlock } from "@workspace/pico-ui/code-block";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";

const PLUGIN_DOWNLOAD_URL = `${import.meta.env.BASE_URL}pico-figma-plugin.zip`;
const PLUGIN_VERSION_URL = `${import.meta.env.BASE_URL}pico-figma-plugin.version.json`;

type PluginVersion = {
  version: string;
  builtAt: string;
  label: string;
  filename: string;
};

export default function FigmaPlugin() {
  const [pluginVersion, setPluginVersion] = useState<PluginVersion | null>(null);

  useEffect(() => {
    let active = true;
    fetch(PLUGIN_VERSION_URL, { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<PluginVersion>) : null))
      .then((data) => {
        if (active) setPluginVersion(data);
      })
      .catch(() => {
        if (active) setPluginVersion(null);
      });
    return () => {
      active = false;
    };
  }, []);

  // Cache-bust so a freshly-shipped zip is never served from a stale cache,
  // and save the file under the versioned name so designers can see which
  // build they have.
  const downloadHref = pluginVersion
    ? `${PLUGIN_DOWNLOAD_URL}?v=${encodeURIComponent(pluginVersion.builtAt)}`
    : PLUGIN_DOWNLOAD_URL;
  const downloadName = pluginVersion?.filename ?? "pico-figma-plugin.zip";

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight leading-[0.9] text-foreground uppercase">
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
          <h2 className="text-3xl font-display font-extrabold uppercase">What It Does</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border-4 border-foreground rounded-sm p-6 bg-card shadow-md space-y-2">
              <h3 className="text-xl font-display font-extrabold uppercase">Sync Tokens</h3>
              <p className="font-medium text-foreground/80">
                Reads <code className="bg-foreground/10 px-1 rounded-sm">tokens.json</code> and
                creates a <strong>Pico</strong> variable collection with Light and
                Dark modes for every color, float variables for radius, effect
                styles for shadows, and text styles for the type scale.
              </p>
            </div>
            <div className="border-4 border-foreground rounded-sm p-6 bg-card shadow-md space-y-2">
              <h3 className="text-xl font-display font-extrabold uppercase">Generate Components</h3>
              <p className="font-medium text-foreground/80">
                Builds the Pico components — Button, Badge, Card, Input, Alert,
                Label, Switch, Checkbox, Separator, Avatar, Textarea, Tooltip,
                Progress, Skeleton, Spinner — as real Figma components with
                variants, auto-layout, and fills bound to the synced variables
                and effect styles.
              </p>
            </div>
            <div className="border-4 border-foreground rounded-sm p-6 bg-card shadow-md space-y-2">
              <h3 className="text-xl font-display font-extrabold uppercase">Page From URL</h3>
              <p className="font-medium text-foreground/80">
                Paste a URL and pick a device size. The plugin reads the rendered
                page, maps each <code className="bg-foreground/10 px-1 rounded-sm">data-pico-*</code> instrumented
                element to a component instance, and rebuilds the layout at the
                chosen frame size with token-bound styling.
              </p>
            </div>
            <div className="border-4 border-foreground rounded-sm p-6 bg-card shadow-md space-y-2">
              <h3 className="text-xl font-display font-extrabold uppercase">Placeholder Pages</h3>
              <p className="font-medium text-foreground/80">
                Generates a ready-made sample layout from real instances and
                tokens. Auth-walled URLs (sign-in redirects, 401/403) are routed
                to a dedicated <strong>Pico / Placeholder</strong> page instead of
                blocking the flow.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-3xl font-display font-extrabold uppercase">Get the plugin</h2>
          <p className="font-medium text-foreground/80">
            No terminal, no build step. Download the ready-to-use package,
            import it into the Figma desktop app once, and you're set. The
            download is rebuilt from the latest plugin source every time this
            site ships, so it never goes stale.
          </p>
          <a
            href={downloadHref}
            download={downloadName}
            className="inline-flex items-center gap-3 border-4 border-foreground rounded-sm bg-accent px-6 py-4 font-display font-extrabold uppercase tracking-wide text-accent-foreground shadow-md transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Download className="h-5 w-5" strokeWidth={2.5} />
            Download plugin
          </a>
          <p className="text-sm font-bold text-foreground/70">
            {pluginVersion ? (
              <>
                Latest build:{" "}
                <code className="bg-foreground/10 px-1 rounded-sm">
                  {pluginVersion.label}
                </code>
              </>
            ) : (
              <span className="text-foreground/50">Checking latest build…</span>
            )}
          </p>
          <p className="text-sm font-medium text-foreground/60">
            Downloads{" "}
            <code className="bg-foreground/10 px-1 rounded-sm">{downloadName}</code> — a
            prebuilt bundle (manifest + code + UI). Nothing to compile. The
            filename and timestamp match the version shown inside the plugin
            panel, so you can confirm you have the latest.
          </p>

          <div className="border-4 border-foreground rounded-sm p-6 bg-card shadow-md space-y-3">
            <h3 className="text-xl font-display font-extrabold uppercase">Install in Figma</h3>
            <ol className="list-decimal list-inside space-y-2 font-medium text-foreground/80">
              <li>Download the zip above and <strong>unzip</strong> it.</li>
              <li>
                Open the <strong>Figma desktop app</strong> — importing a plugin
                from a manifest requires it (the browser version can't).
              </li>
              <li>
                Go to <strong>Plugins → Development → Import plugin from manifest…</strong>
              </li>
              <li>
                Pick <code className="bg-foreground/10 px-1 rounded-sm">manifest.json</code> from
                the unzipped <code className="bg-foreground/10 px-1 rounded-sm">pico-figma-plugin</code> folder.
              </li>
              <li>
                Run <strong>Pico</strong> from <strong>Plugins → Development</strong>.
              </li>
            </ol>
          </div>
          <p className="text-sm font-medium text-foreground/60">
            One day Pico may live in the Figma Community for a true zero-step,
            one-click install. Until then, the import-from-manifest flow above is
            the no-terminal path.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-display font-extrabold uppercase">Configure it</h2>
          <p className="font-medium text-foreground/80">
            All setup happens inside the plugin's own panel — there's nothing to
            configure on disk. For most designers the defaults just work, so you
            can skip straight to running an action.
          </p>
          <div className="border-4 border-foreground rounded-sm p-6 bg-card shadow-md space-y-3">
            <div>
              <h3 className="text-lg font-display font-extrabold uppercase">Tokens URL <span className="text-foreground/50 normal-case font-medium">(optional)</span></h3>
              <p className="font-medium text-foreground/80">
                Leave it <strong>empty</strong> to sync the tokens bundled inside
                the plugin — that's the default and matches this site. Only set a
                URL if you want the plugin to pull a newer{" "}
                <code className="bg-foreground/10 px-1 rounded-sm">tokens.json</code> live
                from a deployed Pico.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-display font-extrabold uppercase">Render service <span className="text-foreground/50 normal-case font-medium">(optional)</span></h3>
              <p className="font-medium text-foreground/80">
                Used only by <strong>Page From URL</strong> to fetch a page's HTML
                server-side (sidestepping CORS). The download ships with this
                pointed at the deployed Pico API server, so it's prefilled — clear
                or change it if you host your own.
              </p>
            </div>
          </div>
          <p className="font-medium text-foreground/80">
            So the whole story is just two steps: <strong>1. Download</strong> and
            import, <strong>2. Configure in the plugin</strong> (usually nothing
            to change).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-display font-extrabold uppercase">Recommended Order</h2>
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
                  <td className="p-4 font-mono bg-accent/10">1</td>
                  <td className="p-4 font-bold uppercase">Sync Tokens</td>
                  <td className="p-4 font-medium">Variables &amp; styles must exist before components can bind to them.</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono">2</td>
                  <td className="p-4 font-bold uppercase">Generate Components</td>
                  <td className="p-4 font-medium">Page reconstruction maps elements to these component instances.</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono bg-accent/10">3</td>
                  <td className="p-4 font-bold uppercase">Page From URL</td>
                  <td className="p-4 font-medium">Rebuilds a real layout using the synced tokens and components.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-display font-extrabold uppercase">How Page-From-URL Works</h2>
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
          <h2 className="text-3xl font-display font-extrabold uppercase">Render Service (Optional)</h2>
          <p className="font-medium text-foreground/80">
            The plugin iframe can fetch URLs directly, but browsers block most
            cross-origin requests (CORS), and server-rendered markup is what the
            reader needs. The <strong>API Server</strong> artifact ships a small
            companion endpoint that fetches a URL server-side and returns its
            HTML, sidestepping CORS. The downloaded plugin ships with the{" "}
            <strong>Render service</strong> field prefilled to the deployed Pico
            API server, so this usually works out of the box — point it at your
            own host only if you self-host.
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
          <h2 className="text-3xl font-display font-extrabold uppercase">Contrast Rules Apply</h2>
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
