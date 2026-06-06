import { useState } from "react";
import { useListGroups, useSendNotification } from "@workspace/api-client-react";
import { Button } from "@workspace/pico-ui/button";
import { Input } from "@workspace/pico-ui/input";
import { Textarea } from "@workspace/pico-ui/textarea";
import { Label } from "@workspace/pico-ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/pico-ui/card";
import { RadioGroup, RadioGroupItem } from "@workspace/pico-ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/pico-ui/select";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

export default function Notifications() {
  const { toast } = useToast();
  const { data: groups } = useListGroups();
  const sendNotification = useSendNotification();

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "group">("all");
  const [groupId, setGroupId] = useState<string>("");
  const [result, setResult] = useState<{ sent: number; failed: number; total: number; message?: string | null } | null>(null);

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) return;
    if (audience === "group" && !groupId) return;

    sendNotification.mutate(
      { 
        data: { 
          subject, 
          body, 
          audience, 
          groupId: audience === "group" ? parseInt(groupId, 10) : undefined 
        } 
      },
      {
        onSuccess: (res) => {
          setResult(res);
          toast({ title: "Notifications processed" });
          setSubject("");
          setBody("");
        },
        onError: () => {
          toast({ title: "Failed to send notifications", variant: "destructive" });
        }
      }
    );
  };

  const isReady = subject.trim() && body.trim() && (audience === "all" || (audience === "group" && groupId));

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight">System Notifications</h1>
      
      {result && (
        <div className={`rounded-lg p-6 border ${result.failed > 0 ? "bg-destructive/10 border-destructive/20" : "bg-accent/10 border-primary/20"} flex items-start gap-4`}>
          {result.failed > 0 ? (
            <AlertCircle className="h-6 w-6 text-destructive mt-0.5" />
          ) : (
            <CheckCircle2 className="h-6 w-6 text-foreground mt-0.5" />
          )}
          <div>
            <h3 className="font-semibold text-lg">{result.failed > 0 ? "Completed with errors" : "Successfully sent"}</h3>
            <p className="text-sm mt-1">Sent: {result.sent} / Total: {result.total}</p>
            {result.failed > 0 && <p className="text-sm text-destructive mt-1">Failed: {result.failed}</p>}
            {result.message && <p className="text-sm mt-2 text-muted-foreground">{result.message}</p>}
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setResult(null)}>Dismiss</Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Compose Broadcast</CardTitle>
          <CardDescription>Send an email notification to users. This will be sent immediately.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Audience</Label>
            <RadioGroup value={audience} onValueChange={(val: "all" | "group") => setAudience(val)} className="flex flex-col space-y-2 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="font-normal">All Users</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="group" id="group" />
                <Label htmlFor="group" className="font-normal">Specific Group</Label>
              </div>
            </RadioGroup>
          </div>

          {audience === "group" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label>Select Group</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Select a group..." />
                </SelectTrigger>
                <SelectContent>
                  {groups?.map(g => (
                    <SelectItem key={g.id} value={g.id.toString()}>
                      {g.name} ({g.memberCount} members)
                    </SelectItem>
                  ))}
                  {groups?.length === 0 && (
                    <SelectItem value="none" disabled>No groups available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input 
              id="subject" 
              placeholder="e.g. Important update regarding your Nacho account" 
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message Body (Text)</Label>
            <Textarea 
              id="body" 
              placeholder="Write your message here..." 
              className="min-h-[200px]"
              value={body}
              onChange={e => setBody(e.target.value)}
            />
          </div>

          <Button 
            className="w-full sm:w-auto" 
            onClick={handleSend}
            disabled={!isReady || sendNotification.isPending}
          >
            <Send className="mr-2 h-4 w-4" />
            {sendNotification.isPending ? "Sending..." : "Send Broadcast"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
