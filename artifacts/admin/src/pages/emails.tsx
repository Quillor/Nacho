import { useListEmailPreviews } from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/pico-ui/card";
import { Skeleton } from "@workspace/pico-ui/skeleton";
import { Mail, AlertCircle, Shield } from "lucide-react";

export default function Emails() {
  const { data: emails, isLoading, isError } = useListEmailPreviews();

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Emails</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review the design of every email Nacho sends. These are rendered with
          sample data — opening this page never sends a real email.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-6">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full max-w-md mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg p-6 border bg-destructive/10 border-destructive/20 flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-destructive mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg">Couldn't load email previews</h3>
            <p className="text-sm mt-1 text-muted-foreground">
              Try refreshing the page.
            </p>
          </div>
        </div>
      )}

      {emails && emails.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No system emails are configured.
          </CardContent>
        </Card>
      )}

      {emails?.map((email) => (
        <Card key={email.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  {email.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  {email.description}
                </CardDescription>
              </div>
              {email.source === "clerk" && (
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  Clerk
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-border bg-muted/40 px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Subject
              </span>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {email.subject}
              </p>
            </div>
            <div className="rounded-md border border-border overflow-hidden bg-white">
              <iframe
                title={`${email.name} preview`}
                srcDoc={email.html}
                sandbox=""
                className="w-full h-[260px] border-0 bg-white"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
