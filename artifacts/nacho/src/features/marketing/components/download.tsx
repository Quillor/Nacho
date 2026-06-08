import { Link } from "wouter";
import { useGetDesktopRelease } from "@workspace/api-client-react";
import { Button } from "@workspace/pico-ui/button";
import { Apple, Download as DownloadIcon, ShieldCheck } from "lucide-react";
import { formatBytes } from "@workspace/shared";
import { Logo } from "@/components/logo";

const INSTALL_STEPS = [
  "Open the downloaded Nacho-x.x.x.dmg file.",
  "Drag the Nacho icon into your Applications folder.",
  "Open Applications, right-click Nacho, and choose Open.",
  'In the dialog that appears, click Open again to confirm. You only need to do this the first time.',
];

function InstallGuide() {
  return (
    <div className="mt-8 border-2 border-foreground bg-card p-8 rounded-lg">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="h-6 w-6 text-foreground" />
        <h2 className="text-xl font-black">How to open Nacho on your Mac</h2>
      </div>
      <p className="text-foreground/70 mb-6">
        Nacho isn&apos;t in the App Store yet, so macOS asks you to confirm the
        first time you open it. Here&apos;s how:
      </p>
      <ol className="space-y-4">
        {INSTALL_STEPS.map((step, i) => (
          <li key={i} className="flex gap-4 items-start">
            <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-black border-2 border-foreground">
              {i + 1}
            </span>
            <span className="pt-1 text-foreground/80">{step}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6 pt-6 border-t-2 border-foreground/10 text-sm text-foreground/70">
        <p className="font-bold text-foreground/80 mb-1">
          Still says Nacho is &ldquo;damaged&rdquo; or can&apos;t be opened?
        </p>
        <p>
          Open the Terminal app and run this command, then try opening Nacho
          again:
        </p>
        <code className="mt-2 block w-full overflow-x-auto rounded-md border-2 border-foreground/15 bg-background px-3 py-2 font-mono text-foreground">
          xattr -cr /Applications/Nacho.app
        </code>
      </div>
    </div>
  );
}

export function Download() {
  const { data, isLoading } = useGetDesktopRelease();
  const hasRelease = Boolean(data?.version && data?.downloadUrl);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="py-6 px-6 md:px-12 border-b-2 border-foreground">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="Nacho home">
            <Logo className="h-9" />
          </Link>
          <Link
            href="/"
            className="font-bold text-foreground/80 hover:text-foreground hover:underline transition-colors"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 py-16 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 text-foreground/70 font-bold mb-4">
            <Apple className="h-6 w-6" />
            <span>macOS</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Download Nacho for Mac
          </h1>
          <p className="mt-4 text-lg text-foreground/70 max-w-xl">
            Record your screen, camera, and mic right from your desktop. Native,
            fast, and built for Mac.
          </p>

          {isLoading ? (
            <p className="mt-10 text-foreground/70">Loading latest release…</p>
          ) : hasRelease && data ? (
            <div className="mt-10 border-2 border-foreground bg-card p-8 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-foreground/60">
                    Latest version
                  </p>
                  <p className="text-2xl font-black">v{data.version}</p>
                  {data.fileSize ? (
                    <p className="text-sm text-foreground/60 mt-1">
                      {formatBytes(data.fileSize)} · Apple silicon &amp; Intel
                    </p>
                  ) : null}
                </div>
                <Button asChild variant="brand" size="lg">
                  <a href={data.downloadUrl ?? "#"}>
                    <DownloadIcon className="mr-2 h-5 w-5" />
                    Download for Mac
                  </a>
                </Button>
              </div>

              {data.notes.trim() ? (
                <div className="mt-8 pt-6 border-t-2 border-foreground/10">
                  <p className="text-sm font-bold uppercase tracking-wide text-foreground/60 mb-3">
                    Release notes
                  </p>
                  <p className="whitespace-pre-line text-foreground/80">
                    {data.notes}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-10 border-2 border-foreground/20 bg-card p-8 rounded-lg">
              <p className="text-foreground/70">
                The Mac app isn&apos;t available for download yet. Check back
                soon!
              </p>
            </div>
          )}

          {hasRelease ? <InstallGuide /> : null}
        </div>
      </main>
    </div>
  );
}
