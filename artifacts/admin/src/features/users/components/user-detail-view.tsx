import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/pico-ui/avatar";
import { Button } from "@workspace/pico-ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/pico-ui/card";
import { Skeleton } from "@workspace/pico-ui/skeleton";
import { Switch } from "@workspace/pico-ui/switch";
import { Label } from "@workspace/pico-ui/label";
import { Checkbox } from "@workspace/pico-ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/pico-ui/alert-dialog";
import { ArrowLeft, UserSquare, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { formatDateTime } from "@workspace/shared";
import { useUserDetail, useAssignableGroups } from "../api";
import { useUserActions } from "../hooks/use-user-actions";

export function UserDetailView({ userId }: { userId: string }) {
  const { data: user, isLoading: isLoadingUser } = useUserDetail(userId);
  const { data: allGroups } = useAssignableGroups();
  const {
    setSuperAdmin,
    toggleGroup,
    impersonateUser,
    isSettingRole,
    isSettingGroups,
    isImpersonating,
  } = useUserActions(userId);

  const [impersonateOpen, setImpersonateOpen] = useState(false);

  if (isLoadingUser) {
    return (
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <Card><CardContent className="h-48 p-6"><Skeleton className="h-full w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!user) {
    return <div className="p-8 text-center text-muted-foreground">User not found</div>;
  }

  const currentGroupIds = user.groups.map((g) => g.id);

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <Link href="/users" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Users
      </Link>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Card>
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar className="h-20 w-20 border border-border">
                <AvatarImage src={user.imageUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {user.displayName?.[0] || user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">{user.displayName || "Unknown User"}</h1>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                  <div>Joined: <span className="text-foreground">{formatDateTime(user.createdAt)}</span></div>
                  <div>Last active: <span className="text-foreground">{formatDateTime(user.lastSignInAt)}</span></div>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 flex flex-col gap-2">
                <Button variant="default" onClick={() => setImpersonateOpen(true)}>
                  <UserSquare className="mr-2 h-4 w-4" />
                  Log in as user
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissions & Groups</CardTitle>
              <CardDescription>Manage this user's role and group assignments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Super Admin</Label>
                  <p className="text-sm text-muted-foreground">
                    Grants full access to the Nacho Admin console.
                  </p>
                </div>
                <Switch
                  checked={user.role === "super_admin"}
                  onCheckedChange={setSuperAdmin}
                  disabled={isSettingRole}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold leading-none tracking-tight">User Groups</h3>
                {allGroups?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No groups exist yet.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4 border border-border p-4 rounded-lg bg-card">
                    {allGroups?.map(group => {
                      const isMember = user.groups.some(g => g.id === group.id);
                      return (
                        <div key={group.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`group-${group.id}`}
                            checked={isMember}
                            onCheckedChange={(checked) => toggleGroup(group.id, checked as boolean, currentGroupIds)}
                            disabled={isSettingGroups}
                          />
                          <Label
                            htmlFor={`group-${group.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {group.name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={impersonateOpen} onOpenChange={setImpersonateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Impersonate User
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to log in as <strong>{user.email}</strong>. This will replace your current active session and you will be redirected to the main Nacho application as this user. 
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isImpersonating}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); impersonateUser({ onError: () => setImpersonateOpen(false) }); }}
              disabled={isImpersonating}
            >
              {isImpersonating ? "Connecting..." : "Log in as user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
