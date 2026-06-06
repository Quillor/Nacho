import { useMemo, useState } from "react";
import type { AdminUser } from "@workspace/api-client-react";

/**
 * Client-side user search over display name + email. Kept out of the view so the
 * table stays pure presentation; filtering is case-insensitive and matches the
 * substring against either field.
 */
export function useUserSearch(users: AdminUser[] | undefined) {
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users?.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.displayName || "").toLowerCase().includes(q),
    );
  }, [users, search]);

  return { search, setSearch, filteredUsers };
}
