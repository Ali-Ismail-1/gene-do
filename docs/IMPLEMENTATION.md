# IMPLEMENTATION.md

# Prototype Implementation Plan

Implement in vertical slices.

When instructed to **do the next thing**, complete the first unchecked slice whose prerequisites are satisfied.

Do not implement later slices early merely because they appear straightforward.

---

# Slice 1 — Bootstrap the Application

Goal:

A clean Next.js application starts successfully and clearly identifies itself as the Video Editor Client Portal prototype.

* [x] Create or configure Next.js with TypeScript.
* [x] Add basic application shell.
* [x] Add simple navigation.
* [x] Add prototype warning/banner in development:

  * `Prototype — authentication and production security are not implemented.`
* [x] Create `.env.example`.
* [x] Add environment-variable validation.
* [x] Add basic README startup instructions.
* [x] Verify lint.
* [x] Verify production build.

Expected output:

```text
/
```

renders the prototype.

---

# Slice 2 — Stub Customer Identity

Goal:

Allow development without real authentication.

* [x] Create a stub Demo Customer.
* [x] Create `getCurrentUser()` or equivalent abstraction.
* [x] Current user includes:

  * id
  * customer id
  * name
  * email
  * role
* [x] Display current customer in portal.
* [x] Add logout only if needed for the stub experience. (Not needed — single stub customer, no session to end.)
* [x] Do not implement real authentication.
* [x] Verify build.

Expected result:

```text
Logged in as:
Demo Client
client@example.com
```

---

# Slice 3 — Airtable Connectivity

Goal:

Prove the application can communicate with Airtable server-side.

Required configuration:

```text
AIRTABLE_TOKEN
AIRTABLE_BASE_ID
AIRTABLE_PROJECTS_TABLE
```

* [x] Create a server-only Airtable integration module.
* [x] Add a simple connectivity operation.
* [x] Never send Airtable token to browser.
* [x] Provide useful configuration error when credentials are missing.
* [x] Add a development-only connectivity check if useful.
* [x] Document required Airtable fields.
* [x] Verify lint/build.

Expected result:

Application can read/write the configured Airtable base.

Stop if required Airtable configuration does not exist.

---

# Slice 4 — Project List from Airtable

Goal:

Use Airtable as the temporary prototype Project database.

* [x] Implement Project domain type.
* [x] Add `/projects`.
* [x] Query Airtable Projects server-side.
* [x] Filter/display Demo Customer projects.
* [x] Show:

  * title
  * status
  * due date
* [x] Add empty state.
* [x] Add basic error state.
* [x] Verify build.

Expected screen:

```text
Projects

Game 14 Highlights
Submitted
Due Aug 25

Podcast Episode 17
In Production
Due Aug 27
```

---

# Slice 5 — Create Project in Airtable

Goal:

A customer creates a Project through the portal.

* [x] Add `/projects/new`.
* [x] Fields:

  * Project Name
  * Description / Instructions
  * Due Date optional
  * Tracking Mode
* [x] Tracking options:

  * Project only
  * Multiple deliverables
* [x] Generate Project UUID in application.
* [x] Create Airtable Project row.
* [x] Store:

  * Project ID
  * Customer ID
  * Customer
  * Project Name
  * Description
  * Due Date
  * Tracking Mode
  * Portal Status = DRAFT
  * Created At
* [x] Redirect to Project detail page after creation. (Minimal `/projects/[id]` page added as the redirect target; Slice 8 will expand it into the full project workspace.)
* [x] Prevent accidental duplicate submission where easy. (Submit button disables while the server action is pending.)
* [x] Verify build.

Expected result:

Creating a Project in portal immediately creates a corresponding Airtable row.

---

# Slice 6 — Dropbox Connectivity

Goal:

Prove server-side Dropbox API access works with the development account.

Required configuration:

```text
DROPBOX_ACCESS_TOKEN
```

* [x] Install/use appropriate Dropbox SDK or API client. (Plain fetch wrapper, consistent with the Airtable module — no extra SDK dependency.)
* [x] Create server-only Dropbox integration module.
* [x] Never expose Dropbox access token to browser.
* [x] Add simple account/connectivity check.
* [x] Handle missing token cleanly.
* [x] Verify build.

Expected result:

Application can call Dropbox using the developer's account.

Do not upload a large file.

---

# Slice 7 — Provision Project Dropbox Folders

Goal:

Creating a Project provisions its Dropbox workspace.

Desired structure:

```text
/Prototype Clients/
  /{customer-id}/
    /{project-id}/
      /01-Source/
      /02-Review/
      /03-Final/
      /99-Internal/
```

* [x] Add folder-provisioning function.
* [x] Make repeated provisioning reasonably safe. (Dropbox's "already exists" conflict is treated as success.)
* [x] Provision folders after Project creation.
* [x] Store relevant Dropbox path/reference fields in Airtable.
* [x] Display Dropbox setup status on Project page.
* [x] Provide useful failure error. (Surfaced via a one-time redirect query param; not persisted — no retry queue.)
* [x] Do NOT add background jobs/retry queues.
* [x] Verify build.

Expected result:

Creating a Project results in both:

```text
Airtable row
+
Dropbox folder hierarchy
```

---

# Slice 8 — Project Detail Page

Goal:

Give the customer a useful project workspace.

* [x] Add `/projects/[id]`. (Added in Slice 5 as a minimal redirect target; this slice fleshes it out.)
* [x] Load Project from Airtable.
* [x] Verify it belongs to Demo Customer.
* [x] Display:

  * Project title
  * instructions
  * due date
  * status
  * tracking mode
  * source-file area
* [x] Display Dropbox upload action/status.
* [x] Add explicit Submit Project button.
* [x] Submit button must NOT yet submit until upload discovery is implemented. (Rendered disabled, not wired to any action.)
* [x] Verify build.

---

# Slice 9 — Prototype Dropbox Upload

Goal:

Prove a small customer file can reach the Project Source area.

Choose the simplest appropriate Dropbox prototype mechanism.

Preferred order:

1. Dropbox File Request if easily supported by the free development account and API flow.
2. Otherwise a small prototype upload mechanism suitable for test files.

Constraints:

* [x] Do not proxy or test multi-gigabyte video. (20 MB cap enforced server-side.)
* [x] Never expose the developer Dropbox token. (Browser only talks to our server action; the upload is proxied server-side, not a Dropbox File Request.)
* [x] Use only small test files.
* [x] Customer can clearly identify the upload destination. (Detail page shows the Dropbox path above the upload control.)
* [x] File ends in `01-Source`.
* [x] Verify uploaded file exists using Dropbox API. (list_folder check immediately after upload, using the name Dropbox actually saved it as.)
* [x] Verify build.

Expected result:

A test file such as:

```text
test-video.mp4
```

exists in the Project Source folder.

---

# Slice 10 — Submit Project

Goal:

Make upload completion an explicit business action.

* [x] Enable `Submit Project`.
* [x] On submit:

  * query Dropbox `01-Source`
  * require at least one file
  * collect filenames
  * update Airtable `Source Files`
  * update Airtable `Portal Status = SUBMITTED`
* [x] Show success message.
* [x] Prevent obvious duplicate submission. (Server-side: refuses to resubmit a non-DRAFT project. Client-side: the form disappears once submitted.)
* [x] Display filenames on Project detail page. (Already live from Dropbox since Slice 9.)
* [x] Verify build.

Expected Airtable result:

```text
Portal Status:
SUBMITTED

Source Files:
test-video.mp4
logo.png
```

This is the first major prototype checkpoint.

STOP and review the experience after completing this slice before automatically adding substantial scope.

---

# Slice 11 — Editor Status Reflection

Goal:

Prove the editor can operate from Airtable while the customer sees status through the portal.

Use the simplest reliable prototype approach.

Possible implementation:

```text
Airtable Portal Status
→ portal reads it on page request/refresh
```

For the first prototype, do NOT build bidirectional synchronization infrastructure.

* [x] Allow editor to change approved workflow field in Airtable. (No app change needed — Portal Status is already a plain editable Airtable field.)
* [x] Portal reads updated status. (Already true structurally since Slice 4 — Airtable fetches are `cache: "no-store"`, so every page request reads live.)
* [x] Map internal status to friendly customer label.
* [x] Verify:

  * SUBMITTED → Received
  * IN_PRODUCTION → In production
  * READY_FOR_REVIEW → Ready for review
  * CHANGES_REQUESTED → Changes requested
  * COMPLETED → Complete
* [x] Verify build.

Expected proof:

Editor changes Airtable.

Customer refreshes portal.

Customer sees new state.

This satisfies the primary prototype hypothesis.

---

# Prototype Evaluation Gate

Before implementing more features, evaluate:

* [ ] Is project creation understandable?
* [ ] Does Dropbox provisioning feel useful?
* [ ] Does the upload workflow feel natural?
* [ ] Does explicit Submit make sense?
* [ ] Does the editor like seeing the Project in Airtable?
* [ ] Is changing status in Airtable convenient?
* [ ] Is the customer-facing Project page useful?
* [ ] Are we learning something worth hardening into a real product?

Do not blindly continue adding features if the workflow feels wrong.

---

# Slice 12 — Deliverables

Only implement after the project-level flow works.

Goal:

Support Projects containing many separately tracked outputs.

* [x] Configure Airtable Deliverables table. (Created via the Airtable Metadata API after the token was granted schema read/write.)
* [x] Implement Deliverable domain type.
* [x] For MULTI_DELIVERABLE Project, allow Deliverables.
* [x] Fields:

  * Deliverable ID
  * Project
  * Title
  * Status
  * Sort Order
* [x] Show Deliverables on Project page.
* [x] Do not create Deliverables for PROJECT mode. (No creation UI exists at all — Deliverables are added directly in Airtable by the editor. Section only renders for MULTI_DELIVERABLE.)
* [x] Calculate:

  * complete count
  * total count
* [x] Verify build.

---

# Increment — Draft Project Editing + Friendlier Project Options

Not a numbered slice — a focused increment requested after Slice 12,
improving the customer-facing Project experience before continuing
further down the slice list.

Goal:

Let customers edit a Project while it's still `DRAFT`, replace
developer-oriented tracking-mode labels with customer language, and
add a separate turnaround/urgency field.

* [x] Add an **Edit Project** action on the Project detail page,
      shown only while `Portal Status = DRAFT`.
* [x] Customer can edit: Project Name, Description/Instructions, Due
      Date, Project Structure (tracking mode), Turnaround.
* [x] Edits persist to the existing Airtable Project record; after
      saving, redirect to the Project detail page showing the updated
      values and a "Project updated." success message.
* [x] Non-`DRAFT` Projects do not show the Edit action. Guarded both
      in the UI (link only renders for DRAFT) and server-side
      (`updateProject()` refuses to write if status isn't DRAFT;
      navigating directly to `/projects/[id]/edit` for a non-DRAFT
      project redirects back to the detail page).
* [x] Replace customer-facing tracking-mode labels: "One video" /
      "Multiple videos" (internal `PROJECT`/`MULTI_DELIVERABLE` values
      unchanged — no data migration). Used consistently on the create
      form, edit form, and Project detail page.
* [x] Add `turnaround` field: `STANDARD` / `PRIORITY` / `RUSH`,
      customer-facing as Standard / Priority / Rush, each with the
      exact descriptions specified for this increment. Separate
      dimension from tracking mode and due date — not combined into
      one field.
* [x] Add Airtable `Turnaround` field (Projects table) storing Title
      Case values (`Standard`/`Priority`/`Rush`), created via the
      Metadata API since the token already had schema write access
      from Slice 12.
* [x] Verify lint/build.

Explicitly not built (per this increment's scope): pricing
calculations, payment collection, rush-fee invoicing, editor
acceptance of Rush, availability calendars, automatic next-day
promises, post-submission Project editing, scope-change approvals,
notification workflows.

See `docs/HANDOFF.md` for what was tested and known issues (a
pre-existing due-date timezone display bug was found during testing,
not introduced by this increment, and intentionally left unfixed here).

---

# Slice 13 — Optional Customer Progress

Goal:

Test whether aggregate progress is useful.

* [ ] Add `show_progress_to_customer` prototype setting.
* [ ] When false, hide counts.
* [ ] When true and MULTI_DELIVERABLE:

  * display `X of Y deliverables complete`
* [ ] Optional visual percentage may accompany the count.
* [ ] Do not show numeric progress for PROJECT mode.
* [ ] Do not implement weighted progress.
* [ ] Verify build.

---

# Slice 14 — Prototype Review

Goal:

Prove completed work can move back toward the customer.

* [ ] Editor places small test output in `02-Review`.
* [ ] Add editor workflow action/status `READY_FOR_REVIEW`.
* [ ] When portal loads a READY_FOR_REVIEW Project:

  * query Review folder
  * list relevant review file(s)
* [ ] Show review file to Demo Customer.
* [ ] Notification may initially be simulated.
* [ ] Do not build complete ReviewRound persistence.
* [ ] Verify build.

Expected result:

```text
Your edit is ready for review.

review-test.mp4
[View / Download]
```

---

# Slice 15 — Request Changes

Goal:

Prove feedback can flow from customer back to editor.

* [ ] Add `Request Changes`.
* [ ] Accept plain-text feedback.
* [ ] Update Airtable:

  * Portal Status = CHANGES_REQUESTED
  * Latest Feedback
* [ ] Display submitted feedback to customer.
* [ ] Editor can see it in Airtable.
* [ ] Verify build.

Do not create frame-accurate commenting.

---

# Slice 16 — Complete Prototype Loop

Goal:

Demonstrate the entire conceptual loop.

* [ ] Editor places test final file in `03-Final`.
* [ ] Editor marks Project COMPLETE.
* [ ] Portal lists final file.
* [ ] Customer can access/download it.
* [ ] Verify all core prototype flows manually.
* [ ] Record known production gaps in README/docs.
* [ ] Verify lint.
* [ ] Verify production build.

Expected demonstration:

```text
Create
→ Upload
→ Submit
→ Work
→ Review
→ Changes
→ Complete
```

---

# Explicitly Deferred to Production MVP

Do not add these during prototype implementation unless the user explicitly changes scope:

* Supabase Auth
* Supabase canonical database
* RLS
* customer memberships
* real authorization
* production ReviewRound model
* ProjectEvents
* IntegrationTasks
* retry cron
* Repair Sync
* Dropbox continuous webhooks
* Airtable Automation command system
* production email
* security hardening
* production file-retention policy
* multiple customer users
* multiple video editors
* billing
* SaaS tenancy
* direct browser-to-Dropbox large-file upload (chunked upload session + staging-folder move). Design documented in `docs/PROTOTYPE.md` under "Planned Production Upload Design" — needs a second Dropbox app (App Folder access) and a one-time OAuth setup step a human has to do, so it's blocked on that regardless of scope.

The prototype should remain easy to understand and easy to discard/refactor.
