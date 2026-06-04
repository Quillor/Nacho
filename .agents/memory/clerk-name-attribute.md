---
name: Clerk display name via unsafeMetadata
description: Why Nacho stores a display name in Clerk unsafeMetadata instead of first_name/last_name.
---

# Clerk display name in this project

The Replit-managed Clerk instance has the `first_name` and `last_name` attributes **disabled** (only `email_address` + `password` are enabled). Calling `user.update({ firstName, lastName })` from the client therefore fails with a Clerk `form_param_unknown` error whose message is just `"is unknown"`.

**Decision:** Store the user-editable display name in `user.unsafeMetadata.displayName` (client-writable) instead of the native name attributes. Read it everywhere via a shared `getDisplayName(unsafeMetadata)` helper, falling back to `fullName`/`firstName`/email prefix.

**Why:** Enabling `first_name`/`last_name` requires toggling attributes in the Auth pane (a user action) — there is no public Clerk Backend API to flip them. `unsafeMetadata` works immediately, needs no instance reconfig, and a display name is not security-sensitive (so "unsafe"/client-writable is fine).

**How to apply:**
- To inspect which attributes an instance has enabled: mint a dev-browser token (`POST https://<FAPI>/v1/dev_browser`, FAPI = base64-decoded publishable key minus the `pk_test_`/`pk_live_` prefix and trailing `$`), then `GET /v1/environment?_clerk_js_version=5.0.0&__clerk_db_jwt=<token>` and read `user_settings.attributes`. Do NOT send both `Origin` and `Authorization` headers — Clerk rejects that.
- Email change and password change DO work natively (those attributes are enabled): `user.createEmailAddress` → `prepareVerification`/`attemptVerification` → set `primaryEmailAddressId`; `user.updatePassword`.
