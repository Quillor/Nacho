/** Which dialog the groups view is showing, or null when closed. */
export type GroupDialogMode = "create" | "edit" | null;

/** Form state shared by the create and edit group dialogs. */
export interface GroupFormData {
  name: string;
  description: string;
}
