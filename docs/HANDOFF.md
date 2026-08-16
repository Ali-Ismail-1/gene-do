# HANDOFF.md

Notes for whoever picks this prototype up next — current architecture
caveats and anything that isn't obvious from the code.

---

## Draft Project Editing + Friendlier Project Options (2026-08-16)

A focused increment after Slice 12: customers can now edit a Project
while it's `DRAFT`, tracking-mode labels are customer-facing instead
of technical, and a new Turnaround field captures requested urgency.

### What was implemented

* **Edit Project** — `/projects/[id]/edit`, shown as a button on the
  Project detail page only while `Portal Status = DRAFT`. Lets the
  customer edit Project Name, Description, Due Date, Project Structure
  (tracking mode), and Turnaround. Saving PATCHes the existing Airtable
  row (`updateProject()` in `src/lib/projects.ts`) and redirects to
  `/projects/[id]?updated=1`, which shows a "Project updated." message.
  Guarded server-side, not just in the UI: `updateProject()` refuses to
  write if the project's status isn't DRAFT, and the edit page itself
  redirects a non-DRAFT project back to its detail page rather than
  showing the form. So even a stale bookmark or replayed request can't
  edit a submitted project.
* **Customer-facing tracking-mode terminology** — the internal
  `PROJECT`/`MULTI_DELIVERABLE` enum is unchanged (no data migration),
  but every customer-facing surface (create form, edit form, Project
  detail page) now shows "One video" / "Multiple videos" with short
  descriptions instead of "Project only" / "Multiple deliverables."
  The words `PROJECT`, `MULTI_DELIVERABLE`, and "Tracking Mode" never
  reach customer-facing UI — the detail page's field is labeled "Type."
* **Turnaround** — new field, separate from tracking mode (how the
  work is organized) and due date (the requested deadline): `STANDARD`
  / `PRIORITY` / `RUSH`, shown to customers as Standard / Priority /
  Rush with the specified descriptions. Selectable on create and edit;
  no pricing, invoicing, or editor-acceptance logic — it only captures
  the customer's requested service level.
* Extracted `src/lib/project-options.ts` — a plain (non-`server-only`)
  module holding `TrackingMode`/`Turnaround` types and their
  label/description option lists, since client form components can't
  import from `server-only` `projects.ts`. `projects.ts` re-exports
  from it so existing server-side imports didn't need to change.
* New shared `src/components/RadioOptionGroup.tsx` (label +
  description radio group), used by both the create and edit forms for
  Project Structure and Turnaround — avoided duplicating that markup
  twice per form, four times total.

### Airtable schema change required

Added a **Turnaround** field to the Projects table (single select:
`Standard` / `Priority` / `Rush`) via the Metadata API — the token
already had schema read/write access from Slice 12. Unlike Tracking
Mode / Portal Status (which store the raw internal enum, e.g.
`IN_PRODUCTION`), Turnaround stores the Title Case display value
directly, so the app maps `STANDARD → "Standard"` etc. before writing
(`TURNAROUND_AIRTABLE_VALUES` in `project-options.ts`). This was
deliberate: Portal Status has accumulated both Title Case options (set
up by hand originally) and SCREAMING_SNAKE_CASE options (auto-created
by `typecast: true` when the app started writing raw enum values) —
12 choices for 6 conceptual states. Turnaround avoids repeating that.

No new env vars were needed — Turnaround lives on the existing
Projects table, unlike Slice 12's Deliverables table which needed its
own `AIRTABLE_DELIVERABLES_TABLE`.

### Current customer-facing terminology

```text
Project type ("What do you need edited?")
  One video       - One finished video or edit.
  Multiple videos - Several videos, clips, episodes, or edits that
                     should be tracked separately.

Turnaround
  Standard - Normal scheduling and turnaround.
  Priority - Higher-priority scheduling. Additional cost may apply.
  Rush     - Needed as soon as possible. Rush pricing and availability
             must be confirmed by the editor.
```

### Implementation decisions

* Project structure, turnaround, and due date are kept as three
  separate fields/dimensions rather than merged — see
  `docs/DECISIONS.md` if present, and `docs/PROTOTYPE.md`'s Project
  section.
* Editing is DRAFT-only by design; there is intentionally no
  post-submission change-request system yet (see docs/PROTOTYPE.md).

### Known issues

* **Pre-existing due-date timezone bug, not introduced by this
  increment.** `formatDueDate()` (used on both the detail page and
  now surfaced again via the edit flow) does `new Date(dueDate)` then
  `toLocaleDateString` in the server's local timezone. A date string
  like `"2026-09-15"` parses as UTC midnight, so on a server whose
  local timezone is behind UTC it displays as September 14. Found
  while testing this increment (editing a project and checking the
  saved due date rendered one day earlier than submitted); left
  unfixed since it's unrelated to this increment's scope. Fix: parse
  the date components directly instead of relying on `Date` + implicit
  timezone conversion, or force UTC in the formatter.
* No automated test suite exists in this project — nothing to run for
  "tests pass if relevant tests exist."

### Next remaining slice

Slice 13 — Optional Customer Progress (`X of Y deliverables complete`
shown to the customer, gated by a `show_progress_to_customer` setting).
See `docs/IMPLEMENTATION.md`.

---

## Pre-Demo Usability Pass (2026-08-15)

A UX cleanup pass only, done ahead of a demo to a prospective client.
No workflow logic, integrations, or Slice 12 work were touched.

### What changed

* **Header/navigation** — was a single flex row that ran together on
  narrow viewports. Now a CSS Grid: brand + current customer identity
  share a top row, nav (Home/Projects) sits on its own full-width row
  below on small screens, and collapses back into one row
  (brand / nav / identity) at ≥640px. No JS, no hamburger menu — just
  a media query.
* **Removed internal Dropbox path from the customer view** —
  `/projects/[id]` used to print the raw Dropbox path
  (`/Prototype Clients/{customerId}/{projectId}/01-Source`) above the
  upload control. Replaced with plain client-facing copy ("Add the
  footage, audio, graphics, and reference files needed for this
  project."). The folder-setup error banner also used to interpolate
  the raw Dropbox error string (which itself often contains that same
  path — see `provisionProjectFolders` in `src/lib/dropbox.ts`); it
  now shows a generic "contact your editor" message instead. The
  "at least one file" submit hint no longer says `01-Source`.
* **Home page copy** — replaced the internal "this is a prototype for
  validating the customer-to-editor workflow…" description with
  "Welcome, {name}" + "Submit footage, track your projects, and review
  completed work." The dev-only prototype banner (auth/security
  disclaimer) is untouched — it only renders when
  `NODE_ENV === "development"`, so it doesn't appear in a demo/
  production build anyway.

Nothing else changed. Airtable/Dropbox integration, project creation,
upload, submit, status reflection, and tracking-mode logic are all
byte-for-byte the same as before this pass — verified by re-running
the upload flow end-to-end after the edits (see Testing below).

### Testing

* `npm run lint` — clean.
* `npm run build` — clean; route output unchanged (`/projects` and
  `/projects/[id]` still dynamic, the rest still static).
* No automated test suite exists in this project (no test runner is
  configured — `package.json` has no `test` script), so there was
  nothing to run for "relevant tests."
* No visual mobile screenshot was possible — no browser automation
  tool was connected in this environment (`claude-in-chrome` was
  unavailable). Verified instead by: (a) rendering the page and
  confirming the header markup/classes are structurally correct, and
  (b) reasoning through the CSS Grid layout, which is a standard
  `grid-template-areas` + single media query pattern with no JS
  involved, so there's no interactive behavior that only shows up at
  runtime. Worth a real visual check on an actual phone before the
  demo.
* Re-ran the upload flow end-to-end after the copy/CSS changes
  (uploaded a test file to an existing draft project) to confirm
  upload behavior itself was untouched.

---

## Current Upload Architecture

**Browser → Next.js/Vercel → Dropbox.** Uploads are proxied through
the app server, not sent directly to Dropbox.

Specifically: the customer's browser submits the file to a React
server action (`uploadSourceFileAction` in
`src/app/projects/[id]/actions.ts`), which runs in the Next.js server
process, reads the file into memory, and forwards it to Dropbox's
content-upload API using the developer's server-side access token
(`src/lib/dropbox.ts`'s `uploadFile`). The token never reaches the
browser, but every byte of the file passes through the Next.js server
first.

This is capped at 20MB (`MAX_UPLOAD_BYTES` in
`src/lib/upload-limits.ts`), enforced both client-side (immediate
rejection on file selection, before any upload starts) and
server-side. Next.js's own server-action body limit is set to 25MB in
`next.config.ts` — just above the app's cap — so the app's own
error message is what a user sees for an oversized file, not a raw
framework-level rejection.

### Known Prototype Limitation

**Current prototype upload is suitable only for small test files.
Production large-file upload must send files directly to Dropbox or
use an appropriate Dropbox upload/file-request flow rather than
proxying multi-GB video through Next.js/Vercel.**

A specific direct-browser-to-Dropbox design (staging folder + a
server-side `files/move_v2` promotion step) was discussed and is
documented in `docs/PROTOTYPE.md` under "Planned Production Upload
Design." It isn't implemented — it needs a second Dropbox app (App
Folder access) and a one-time OAuth consent flow, both of which are
manual steps a human has to do in a browser.

### Confirmation: No New Workflow Scope

This pass did not add Deliverables, review rounds, notifications, new
workflow states, queues, background jobs, Dropbox webhooks, Airtable
automation architecture, Supabase, or real authentication. It did not
change Airtable integration, Dropbox integration, project creation,
file upload behavior, project submission, status reflection, or
tracking-mode logic. **Slice 12 was not started.**
