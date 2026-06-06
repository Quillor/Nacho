// Auth feature: onboarding/profile completion plus the dev-only auth-bypass UI.
// `JobTitleCombobox` stays internal (used only by the onboarding form).
export { Onboarding } from "./components/onboarding";
export { DevModeToggle } from "./components/dev-mode-toggle";
export { TestingModeBanner } from "./components/testing-mode-banner";
export { getProfile, isProfileComplete } from "./profile";
export type { UserProfile } from "./profile";
