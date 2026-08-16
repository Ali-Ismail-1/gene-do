# PROTOTYPE.md

# Video Editor Client Portal Prototype

## Why We Are Building This

A freelance video editor currently uses Dropbox for files and wants Airtable to manage his work.

The hypothesis is that a lightweight client portal could make the handoff between customer and editor significantly easier.

Instead of customers sending footage and instructions through scattered messages, the portal gives each customer one place to:

1. create a Project;
2. provide instructions;
3. upload source material;
4. explicitly submit work;
5. see project status;
6. eventually receive completed work for review.

The editor should continue working primarily through Dropbox and Airtable.

The portal should fit around his workflow rather than force him to adopt a new project-management system.

---

# What This Prototype Must Prove

The first prototype needs to answer:

> Can a simple customer portal successfully connect a client-facing workflow to Airtable and Dropbox in a way that feels useful?

Specifically, prove:

```text
Stub Customer
     ↓
Create Project
     ↓
Airtable Project appears
     ↓
Dropbox Project folders exist
     ↓
Customer uploads test source file
     ↓
Customer submits Project
     ↓
Airtable contains source filename(s)
     ↓
Editor changes status
     ↓
Portal reflects editor status
```

If this interaction works and feels useful, production infrastructure can be added later.

---

# Not a Production System

This prototype intentionally does NOT solve:

* real authentication
* authorization
* customer data isolation
* durable integration retry
* production email delivery
* production Dropbox upload limits
* complete review history
* audit history
* multi-editor tenancy
* billing
* production monitoring

Those concerns have already been considered conceptually.

They should not interfere with validating the core experience.

---

# Personas

## Customer

A client who sends material to the video editor.

Prototype behavior:

* enters through a stubbed login/customer selector;
* sees their prototype projects;
* creates a Project;
* uploads files;
* explicitly submits the Project;
* sees current Project status.

## Editor

The freelance video editor.

Prototype behavior:

* primarily uses Airtable;
* opens Dropbox when working with files;
* sees Projects in Airtable;
* changes Project status in Airtable;
* may later manage Deliverables in Airtable.

The prototype does not require a full editor portal.

---

# Domain Model

## Customer

Represents the editor's client.

Prototype minimum:

```text
id
name
email
```

The Customer does not need its own Airtable table unless implementation convenience clearly justifies it.

---

## Project

Represents a body of editing work.

Prototype fields:

```text
id
customer_id
customer_name
title
description
due_date
tracking_mode
turnaround
status
dropbox_source_folder
dropbox_review_folder
dropbox_final_folder
source_files
show_progress_to_customer
created_at
```

Prototype tracking modes:

```text
PROJECT
MULTI_DELIVERABLE
```

These are internal/technical values only. Customer-facing UI must never
show the words `PROJECT`, `MULTI_DELIVERABLE`, or "Tracking Mode" —
present this dimension as **Project type** (or a question like "What
do you need edited?") using these labels:

```text
PROJECT           -> "One video"
                      One finished video or edit.

MULTI_DELIVERABLE -> "Multiple videos"
                      Several videos, clips, episodes, or edits that
                      should be tracked separately.
```

### Turnaround

A separate dimension from tracking mode (how the work is organized)
and due date (the requested calendar deadline) — do not combine
these. Turnaround is how urgently the customer wants the work
handled:

```text
STANDARD -> "Standard"
             Normal scheduling and turnaround.

PRIORITY -> "Priority"
             Higher-priority scheduling. Additional cost may apply.

RUSH     -> "Rush"
             Needed as soon as possible. Rush pricing and availability
             must be confirmed by the editor.
```

Rush is a request for expedited treatment, not a guaranteed deadline —
do not promise a specific turnaround time (e.g. next-day) automatically.
No pricing, invoicing, or editor-acceptance workflow exists yet for
Priority/Rush; the prototype only captures the customer's requested
service level.

A valid Project combination is therefore e.g. "Multiple videos /
Rush / due tomorrow" or "One video / Standard / due in two weeks" —
tracking mode, turnaround, and due date vary independently.

Prototype statuses:

```text
DRAFT
SUBMITTED
IN_PRODUCTION
READY_FOR_REVIEW
CHANGES_REQUESTED
COMPLETED
```

### Draft Editing

While a Project is `DRAFT`, the customer can edit its title,
description, due date, tracking mode, and turnaround from the portal
(an explicit **Edit Project** action on the Project detail page).
Edits persist directly to the existing Airtable row — no revision
history is kept.

Once a Project leaves `DRAFT` (i.e. it has been submitted), it is no
longer editable from the portal. Post-submission change requests
(scope changes after the editor has started work) are an intentionally
deferred production concern — the prototype does not build a
change-request/approval system.

---

## Deliverable

A Deliverable is an independently trackable client-facing output.

Examples:

```text
Project:
May Content Batch

Deliverables:
- Episode 17
- Short #1
- Short #2
- Short #3
```

Prototype fields:

```text
id
project_id
title
status
sort_order
```

Deliverable support is part of the domain, but it should not block proving the simple Project workflow first.

---

# Airtable Prototype Model

Use two Airtable tables.

## Projects

Recommended fields:

```text
Project ID
Customer ID
Customer
Project Name
Description
Due Date
Tracking Mode
Turnaround
Portal Status
Requested Action
Source Files
Dropbox Source
Dropbox Review
Dropbox Final
Command Result
Show Progress To Customer
Created At
```

### Project ID

This is a UUID generated by the application.

It is the stable application identifier.

Do not rely on the Airtable record ID as the domain identity.

### Portal Status

Represents the status the portal shows.

### Turnaround

Stores the customer's requested service level as Title Case values —
`Standard` / `Priority` / `Rush` — unlike Tracking Mode and Portal
Status, which store the raw internal enum. This was a deliberate
choice: earlier internal-enum writes (with `typecast: true` letting
Airtable auto-create new select options) left Portal Status with both
Title Case options (from when the field was set up by hand) and
SCREAMING_SNAKE_CASE options (auto-created by the app) — see
docs/HANDOFF.md. Turnaround avoids that duplication by having the app
map to the display value before writing.

### Requested Action

For the prototype, the editor may use a value such as:

```text
NONE
START_WORK
SEND_FOR_REVIEW
REQUEST_CHANGES
COMPLETE
```

The implementation may simplify this further if required.

Do not build a generic synchronization system.

### Source Files

For the prototype, this can simply be:

```text
camera-a.mov
audio.wav
logo.png
```

as newline-separated text.

The prototype does not need an Airtable Files table.

---

## Deliverables

Recommended fields:

```text
Deliverable ID
Project
Title
Status
Sort Order
```

Project should be an Airtable linked record.

Do not create fake Deliverables for `PROJECT` tracking mode.

Deliverable `Status` values (chosen in Slice 12, since this section
didn't specify them):

```text
NOT_STARTED
IN_PRODUCTION
READY_FOR_REVIEW
CHANGES_REQUESTED
COMPLETED
```

`DRAFT`/`SUBMITTED` are Project-level concepts (they describe the
customer's submission action) and don't apply per-Deliverable, so
`NOT_STARTED` stands in as the starting state. "Complete count" is
simply the number of Deliverables with `Status = COMPLETED`.

Deliverables are not created through the portal in the prototype —
the editor adds them directly in Airtable, linked to the relevant
Project.

---

# Dropbox Prototype Structure

Use:

```text
/Prototype Clients/
  /{customer-id}/
    /{project-id}/
      /01-Source/
      /02-Review/
      /03-Final/
      /99-Internal/
```

Prefer stable IDs in paths over customer-entered text.

The UI can still show human-friendly names.

---

# Dropbox Upload Strategy

The development Dropbox account may be free.

Use small test files.

The prototype only needs to establish that:

* Dropbox API authentication works;
* folders can be created;
* a customer upload path can be provided;
* uploaded files can be discovered;
* filenames can be reflected into Airtable.

Do not spend effort implementing or testing a 25 GB transfer.

Large-file production behavior will be handled later with the appropriate Dropbox account and production upload mechanism.

## Planned Production Upload Design (Not Implemented Yet)

The prototype's upload mechanism proxies files through the Next.js server (browser → our server → Dropbox). That does not scale to real editing footage:

* most Next.js hosting (Vercel in particular) hard-caps serverless request bodies well under what a 25 GB file needs, regardless of any Next.js config;
* routing large files through the app server at all is the wrong architecture even where it's technically possible.

The planned production approach avoids proxying the bytes through our server entirely:

```text
Browser
  → uploads directly to Dropbox (chunked upload_session API)
  → lands in a shared staging location
  → browser notifies our server the upload finished
  → our server moves the file (files/move_v2) from staging
    into the correct Project's 01-Source folder
```

Key points:

* The browser needs a Dropbox access token to upload directly, so a **second Dropbox app** is required, configured with **App Folder** access (not Full Dropbox, which is what the prototype's existing app uses — access type cannot be changed after an app is created). Our server mints short-lived tokens for that app on demand.
* The browser's token is only ever able to write into the shared staging folder, not into arbitrary customer/project paths. This limits what a leaked short-lived token can do, and gives the server a checkpoint to validate the file (extension, size, whatever else) before promoting it into the customer-visible folder.
* The actual move into `01-Source` happens server-side using the existing full-access `DROPBOX_ACCESS_TOKEN`, which can see both the staging app's storage and the `/Prototype Clients/...` tree.
* Requires new credentials distinct from `DROPBOX_ACCESS_TOKEN`: an app key/secret for the new scoped app, and a refresh token obtained via a one-time OAuth consent flow.
* Building a real chunked/resumable uploader (progress, retry on a failed chunk, recovering from a closed browser tab) is itself a non-trivial feature, separate from the staging/move design above.

**Manual prerequisite before this can be implemented:** creating the new Dropbox app in the App Console and completing the OAuth consent flow both require a human in a browser — they can't be done by an agent working in this repo. This design is documented here for when that setup happens; it is intentionally not implemented in the prototype.

---

# Project Creation Flow

## Input

Customer enters:

```text
Project Name
Description / Instructions
Due Date (optional)
Tracking Mode
```

## Output

The application:

1. generates Project UUID;
2. creates Airtable Project record;
3. creates Dropbox project directory structure;
4. returns the Project detail page;
5. displays upload instructions/action.

If Dropbox provisioning fails during the prototype, show a useful error.

Do not build durable retry infrastructure yet.

---

# Upload Flow

Customer:

1. opens Project;
2. chooses Upload;
3. uploads a small test file through the selected Dropbox prototype mechanism;
4. finishes uploading;
5. returns to Project.

Uploading alone does not change Project status to `SUBMITTED`.

---

# Submit Flow

Customer explicitly presses:

**Submit Project**

The application:

1. queries `01-Source`;
2. reads current source-file metadata;
3. places filenames in Airtable `Source Files`;
4. changes Project status to `SUBMITTED`;
5. updates portal state;
6. shows success to customer.

The prototype may skip production-grade idempotency.

Avoid obvious duplicate records where easily preventable.

---

# Editor Work Flow

The editor opens Airtable.

Example:

```text
Project:
Game 14 Highlights

Portal Status:
SUBMITTED

Requested Action:
START_WORK
```

After the editor requests work to begin:

```text
Portal Status:
IN_PRODUCTION
```

The portal should show:

```text
Game 14 Highlights
In production
```

The simplest technically workable mechanism is acceptable for the prototype.

Possible approaches include:

* explicit refresh from Airtable;
* server-side query when the page loads;
* narrow Airtable Automation callback.

Prefer simplicity.

---

# Review Prototype

After the core flow works, support:

Editor:

```text
puts review-test.mp4 into 02-Review
```

and chooses:

```text
SEND_FOR_REVIEW
```

Application:

1. verifies at least one file exists in `02-Review`;
2. changes Project status to `READY_FOR_REVIEW`;
3. exposes filename/link in the customer portal.

For the first prototype, an actual customer email is optional.

A visible application message such as:

```text
Review notification would be sent to client@example.com
```

is acceptable until the workflow is proven.

---

# Changes Requested Prototype

Customer can eventually press:

```text
Request Changes
```

and enter simple feedback.

The application can update Airtable with:

```text
Portal Status = CHANGES_REQUESTED
Latest Feedback = "Please shorten the opening."
```

Do not create complete ReviewRound history until the prototype proves the interaction.

---

# Progress

For a `MULTI_DELIVERABLE` Project:

Internal progress can be calculated as:

```text
number of completed Deliverables
/
total Deliverables
```

Customer-visible progress should be optional.

If shown, prefer:

```text
34 of 100 deliverables complete
```

rather than simply:

```text
34%
```

Do not implement weighted progress.

Project-only work should not show an invented numerical percentage.

Implemented in Slice 13 as an editor-controlled, per-project Airtable
checkbox: **Show Progress To Customer** (unchecked/absent by default —
progress starts hidden). When unchecked, the Project detail page still
lists each Deliverable's title and status, just without the aggregate
count. When checked, it shows `X of Y complete` plus an optional
computed percentage (e.g. `1 of 3 complete (33%)`) — the percentage is
just count/total rounded, not a weighted or invented figure.

---

# Explicit Prototype Non-Goals

Do not build:

* Supabase
* RLS
* passwords
* production authentication
* invitation flows
* customer memberships
* review-round database history
* project event history
* integration task queues
* cron jobs
* Dropbox webhooks
* Airtable Webhooks API consumer
* continuous file synchronization
* full Dropbox mirror
* real editor dashboard
* generic task management
* payment collection
* invoicing
* SMS
* multi-editor SaaS
* Frame.io integration
* Dropbox Replay integration
* per-frame comments
* weighted progress
* customizable workflows
* complex permissions

---

# Success Criteria

The prototype succeeds when a developer can demonstrate this locally or in a preview deployment:

1. Open the application as Demo Client.
2. Create a Project.
3. See the Project in Airtable.
4. Confirm Dropbox Project folders were created.
5. Upload a small test file.
6. Submit the Project.
7. See the filename in Airtable.
8. Change the editor workflow state.
9. Refresh/open the client portal.
10. See the updated state.

Bonus, but not required before evaluating the prototype:

11. Put a test output into Review.
12. Send it for review.
13. See the review file in the customer portal.
14. Request changes.
15. Reflect the change in Airtable.

At that point, stop adding features and evaluate the workflow.
