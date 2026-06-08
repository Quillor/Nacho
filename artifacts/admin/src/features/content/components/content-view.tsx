import { Button } from "@workspace/pico-ui/button";
import { Textarea } from "@workspace/pico-ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/pico-ui/card";
import { Skeleton } from "@workspace/pico-ui/skeleton";
import { Save } from "lucide-react";
import { formatDateTime } from "@workspace/shared";
import { useTosEditor } from "../hooks/use-tos-editor";
import { DesktopReleaseSection } from "./desktop-release-section";

export function ContentView() {
  const { tos, isLoading, content, setContent, hasChanges, isSaving, save } =
    useTosEditor();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content</h1>
          {tos && (
            <p className="text-sm text-muted-foreground mt-1">
              Terms last updated: {formatDateTime(tos.updatedAt)}
            </p>
          )}
        </div>
        <Button
          onClick={save}
          disabled={!hasChanges || isSaving}
          className="shrink-0"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
          <CardDescription>
            This content is displayed publicly to all users. Supports Markdown formatting.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[400px] font-mono text-sm resize-y focus-visible:ring-primary/20"
            placeholder="Enter the Terms of Service here..."
          />
        </CardContent>
      </Card>

      <DesktopReleaseSection />
    </div>
  );
}
