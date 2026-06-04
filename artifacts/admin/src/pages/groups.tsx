import { useState } from "react";
import {
  useListGroups,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  getListGroupsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/pico-ui/table";
import { Button } from "@workspace/pico-ui/button";
import { Input } from "@workspace/pico-ui/input";
import { Textarea } from "@workspace/pico-ui/textarea";
import { Label } from "@workspace/pico-ui/label";
import { Skeleton } from "@workspace/pico-ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/pico-ui/dialog";
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
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/format";

type GroupDialogMode = "create" | "edit" | null;

export default function Groups() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: groups, isLoading } = useListGroups();
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();

  const [dialogMode, setDialogMode] = useState<GroupDialogMode>(null);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleOpenCreate = () => {
    setFormData({ name: "", description: "" });
    setDialogMode("create");
  };

  const handleOpenEdit = (group: any) => {
    setFormData({ name: group.name, description: group.description || "" });
    setActiveGroupId(group.id);
    setDialogMode("edit");
  };

  const handleOpenDelete = (id: number) => {
    setActiveGroupId(id);
    setDeleteOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (dialogMode === "create") {
      createGroup.mutate({ data: { name: formData.name, description: formData.description } }, {
        onSuccess: () => {
          toast({ title: "Group created" });
          setDialogMode(null);
          queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey() });
        },
        onError: () => toast({ title: "Failed to create group", variant: "destructive" })
      });
    } else if (dialogMode === "edit" && activeGroupId) {
      updateGroup.mutate({ groupId: activeGroupId, data: { name: formData.name, description: formData.description } }, {
        onSuccess: () => {
          toast({ title: "Group updated" });
          setDialogMode(null);
          queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey() });
        },
        onError: () => toast({ title: "Failed to update group", variant: "destructive" })
      });
    }
  };

  const handleDelete = () => {
    if (!activeGroupId) return;
    deleteGroup.mutate({ groupId: activeGroupId }, {
      onSuccess: () => {
        toast({ title: "Group deleted" });
        setDeleteOpen(false);
        queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to delete group", variant: "destructive" });
        setDeleteOpen(false);
      }
    });
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Members</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : groups?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No groups have been created yet.
                </TableCell>
              </TableRow>
            ) : (
              groups?.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium text-foreground">{group.name}</TableCell>
                  <TableCell className="text-muted-foreground">{group.description || "—"}</TableCell>
                  <TableCell className="text-center font-medium">{group.memberCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(group.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(group)}>
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(group.id)}>
                        <Trash2 className="h-4 w-4 text-destructive opacity-70 hover:opacity-100" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!dialogMode} onOpenChange={(open) => !open && setDialogMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "create" ? "Create Group" : "Edit Group"}</DialogTitle>
            <DialogDescription>
              {dialogMode === "create" ? "Create a new user group." : "Update the group's details."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Beta Testers"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What is this group for?"
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.name.trim() || createGroup.isPending || updateGroup.isPending}
            >
              {createGroup.isPending || updateGroup.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this group? This action cannot be undone. Users in this group will not be deleted, but they will be removed from the group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteGroup.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteGroup.isPending}
            >
              {deleteGroup.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
