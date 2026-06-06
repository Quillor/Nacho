import { Link } from "wouter";
import { useGetAdminSummary } from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/pico-ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/pico-ui/avatar";
import { Badge } from "@workspace/pico-ui/badge";
import { Skeleton } from "@workspace/pico-ui/skeleton";
import { Users, Video, Eye, ArrowRight } from "lucide-react";
import { formatDate, formatNumber } from "@workspace/shared";

export default function Dashboard() {
  const { data: summary, isLoading, isError } = useGetAdminSummary();

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-destructive/50 p-6 text-center text-destructive">
          Failed to load dashboard summary.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(summary.totalUsers)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recordings</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(summary.totalRecordings)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(summary.totalViews)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Signups</CardTitle>
          <CardDescription>The latest users to join Nacho</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {summary.recentSignups.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No recent signups.</div>
          ) : (
            <div className="divide-y divide-border border-t border-border">
              {summary.recentSignups.map((user) => (
                <Link key={user.id} href={`/users/${user.id}`}>
                  <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.imageUrl || undefined} />
                        <AvatarFallback>{user.displayName?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.displayName || "Unknown"}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {user.role === "super_admin" && (
                        <Badge variant="secondary" className="text-[10px]">Admin</Badge>
                      )}
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
