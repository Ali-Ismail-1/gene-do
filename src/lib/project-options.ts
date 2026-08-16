// Plain data, no "server-only" guard — this is imported by both server
// code (src/lib/projects.ts) and client form components, which need the
// same customer-facing labels/descriptions without pulling in
// server-only Airtable logic.

export type TrackingMode = "PROJECT" | "MULTI_DELIVERABLE";

export type Turnaround = "STANDARD" | "PRIORITY" | "RUSH";

export const TURNAROUND_VALUES: Turnaround[] = ["STANDARD", "PRIORITY", "RUSH"];

type Option<T extends string> = {
  value: T;
  label: string;
  description: string;
};

// Customer-facing "Project type" (what the app internally calls tracking
// mode). Never show the words PROJECT, MULTI_DELIVERABLE, or "Tracking
// Mode" to a customer — these labels/descriptions are the only thing
// customer-facing UI should render.
export const TRACKING_MODE_OPTIONS: Option<TrackingMode>[] = [
  {
    value: "PROJECT",
    label: "One video",
    description: "One finished video or edit.",
  },
  {
    value: "MULTI_DELIVERABLE",
    label: "Multiple videos",
    description:
      "Several videos, clips, episodes, or edits that should be tracked separately.",
  },
];

export const TRACKING_MODE_LABELS: Record<TrackingMode, string> =
  Object.fromEntries(
    TRACKING_MODE_OPTIONS.map((option) => [option.value, option.label])
  ) as Record<TrackingMode, string>;

// How urgently the customer wants the work handled. Separate dimension
// from Project type (how the work is organized) and Due Date (the
// requested calendar deadline) — do not combine these.
export const TURNAROUND_OPTIONS: Option<Turnaround>[] = [
  {
    value: "STANDARD",
    label: "Standard",
    description: "Normal scheduling and turnaround.",
  },
  {
    value: "PRIORITY",
    label: "Priority",
    description: "Higher-priority scheduling. Additional cost may apply.",
  },
  {
    value: "RUSH",
    label: "Rush",
    description:
      "Needed as soon as possible. Rush pricing and availability must be confirmed by the editor.",
  },
];

export const TURNAROUND_LABELS: Record<Turnaround, string> =
  Object.fromEntries(
    TURNAROUND_OPTIONS.map((option) => [option.value, option.label])
  ) as Record<Turnaround, string>;

// The Airtable Turnaround field stores Title Case values (Standard /
// Priority / Rush), unlike Tracking Mode / Portal Status which store the
// raw enum. Keeping this mapping explicit avoids the option-name
// duplication that happened on Portal Status (see docs/HANDOFF.md).
export const TURNAROUND_AIRTABLE_VALUES: Record<Turnaround, string> = {
  STANDARD: "Standard",
  PRIORITY: "Priority",
  RUSH: "Rush",
};
