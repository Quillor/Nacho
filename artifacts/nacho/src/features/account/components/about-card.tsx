import { Info, Tag } from "lucide-react";
import { Card } from "@workspace/pico-ui/card";
import { useGetVersion } from "@workspace/api-client-react";
import { cardClass, headingClass } from "../account";
import { ValueSkeleton } from "./settings-shared";

/** Read-only app version + a short explainer of how Nacho stores recordings. */
export function AboutCard() {
  const { data: version } = useGetVersion();

  return (
    <Card className={cardClass}>
      <div className="mb-4 flex items-center gap-2">
        <Info className="h-5 w-5" />
        <h2 className={headingClass}>About</h2>
      </div>
      <dl className="space-y-3">
        <div className="flex items-center justify-between border-b border-dashed border-foreground pb-2">
          <dt className="flex items-center gap-1 font-medium text-muted-foreground">
            <Tag className="h-4 w-4" /> Version
          </dt>
          <dd className="font-mono font-bold">
            {version ? version.version : <ValueSkeleton className="w-16" />}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="font-medium text-muted-foreground">Released</dt>
          <dd className="font-mono font-bold">
            {version ? (
              version.releaseDate
            ) : (
              <ValueSkeleton className="w-24" />
            )}
          </dd>
        </div>
      </dl>
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        Nacho records in your browser. Recordings stay on this device until you
        publish — publishing uploads a copy so anyone with the link can watch.
      </p>
    </Card>
  );
}
