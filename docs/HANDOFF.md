# HANDOFF.md

Notes for whoever picks this prototype up next — current architecture
caveats and anything that isn't obvious from the code.

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
