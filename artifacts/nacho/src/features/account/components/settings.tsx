import { Link, useRoute } from "wouter";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  HardDrive,
  Info,
  AlertTriangle,
} from "lucide-react";
import type { ComponentType } from "react";
import { AppShell } from "@/components/app-shell";
import { ProfileNameCard } from "./profile-name-card";
import { EmailCard } from "./email-card";
import { PasswordCard } from "./password-card";
import { VideosCard } from "./videos-card";
import { AboutCard } from "./about-card";
import { DangerZoneCard } from "./danger-zone-card";
import { SettingsList, type SettingsSection } from "./settings-list";

type Section = SettingsSection & { Component: ComponentType };

const SECTIONS: Section[] = [
  {
    slug: "profile",
    title: "Profile",
    description: "Your name and job title",
    icon: User,
    Component: ProfileNameCard,
  },
  {
    slug: "email",
    title: "Email",
    description: "Change your primary email address",
    icon: Mail,
    Component: EmailCard,
  },
  {
    slug: "password",
    title: "Password",
    description: "Set or change your password",
    icon: Lock,
    Component: PasswordCard,
  },
  {
    slug: "videos",
    title: "Videos",
    description: "Local storage usage and clearing recordings",
    icon: HardDrive,
    Component: VideosCard,
  },
  {
    slug: "about",
    title: "About",
    description: "App version and how Nacho works",
    icon: Info,
    Component: AboutCard,
  },
  {
    slug: "danger",
    title: "Danger zone",
    description: "Permanently delete your account",
    icon: AlertTriangle,
    danger: true,
    Component: DangerZoneCard,
  },
];

export function SettingsPage() {
  const [, params] = useRoute("/settings/:section?");
  const slug = params?.section;
  const active = slug ? SECTIONS.find((s) => s.slug === slug) : undefined;

  // Detail view: a single section's edit controls with a way back to the list.
  if (active) {
    const Detail = active.Component;
    return (
      <AppShell>
        <Link
          href="/settings"
          className="mb-6 inline-flex items-center gap-2 border-2 border-foreground bg-card px-3 py-2 font-bold uppercase tracking-wide transition-all hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" /> Settings
        </Link>
        <h1 className="mb-8 font-display text-4xl font-extrabold tracking-tight">
          {active.title}
        </h1>
        <Detail />
      </AppShell>
    );
  }

  // List view: every section as a tappable row.
  return (
    <AppShell>
      <h1 className="mb-2 font-display text-5xl font-extrabold tracking-tight">
        Settings
      </h1>
      <p className="mb-10 text-lg font-medium text-muted-foreground">
        Manage your account, videos, and see what's running.
      </p>
      <SettingsList sections={SECTIONS} />
    </AppShell>
  );
}
