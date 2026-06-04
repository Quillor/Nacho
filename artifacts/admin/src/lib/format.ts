import { format, parseISO } from "date-fns";

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "Never";
  try {
    return format(parseISO(dateString), "MMM d, yyyy");
  } catch (e) {
    return dateString;
  }
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "Never";
  try {
    return format(parseISO(dateString), "MMM d, yyyy h:mm a");
  } catch (e) {
    return dateString;
  }
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("en-US").format(num);
}
