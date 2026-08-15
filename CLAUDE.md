# CLAUDE.md

# Video Editor Client Portal — Prototype

This repository is a rapid prototype for a client portal used by a freelance video editor.

Read these files before making architectural or implementation decisions:

* @docs/PROTOTYPE.md
* @docs/IMPLEMENTATION.md

## Current Objective

The objective is NOT to build the production system.

The objective is to quickly prove this workflow:

Customer enters portal
→ creates a Project
→ Project appears in Airtable
→ Dropbox project folders are created
→ customer can upload a small test file
→ uploaded filename can be reflected in Airtable
→ editor changes workflow status
→ customer portal reflects the change

We are testing whether the workflow and user experience make sense.

## Prototype Architecture

Use:

* Next.js
* TypeScript
* Airtable
* Dropbox API
* local/stubbed authentication

Do NOT use Supabase in this prototype.

Airtable may temporarily act as the prototype database.

This is intentional.

## Authentication

Do NOT implement real authentication.

Stub a current customer.

For example:

```ts
const currentUser = {
  id: "demo-client",
  name: "Demo Client",
  email: "client@example.com",
  role: "CUSTOMER",
}
```

If useful, create a simple development-only customer selector.

Do not build:

* passwords
* sessions
* OAuth login
* Supabase Auth
* RLS
* customer invitations
* role-management infrastructure

## Airtable

For this prototype, Airtable may hold the Project and Deliverable records.

This is NOT the intended production source-of-truth architecture.

Do not create a generic synchronization framework.

Use server-side Airtable API calls.

Never expose Airtable credentials to browser code.

## Dropbox

Use Dropbox as the file-storage integration.

The development Dropbox account may be a free account.

Use small test files.

Do NOT attempt to prove 25 GB uploads in this prototype.

The purpose is to prove:

* API connectivity
* folder provisioning
* File Request or upload workflow
* file discovery
* filenames/metadata flowing into Airtable

Never expose the developer's Dropbox access token in browser JavaScript.

Dropbox credentials must remain server-side.

## Canonical Domain Vocabulary

Use these terms consistently:

### Customer

The video editor's client.

### Project

A body of client work.

A Project may represent one editing job or a container containing multiple Deliverables.

### Deliverable

A separately trackable client-facing output inside a Project.

Examples:

* Game 14 Highlights
* Short #3
* Episode 17
* Social Cutdown #4

Do NOT call Deliverables "Project Items" in code.

### Project File

A file associated with a Project.

For the prototype, actual file metadata may be represented simply in Airtable.

### Review

The customer-facing stage where completed work is presented for feedback.

The prototype does not need a complete ReviewRound implementation yet.

## Tracking Modes

A Project may conceptually use:

```text
PROJECT
MULTI_DELIVERABLE
```

### PROJECT

Used when tracking child Deliverables would create unnecessary administration.

Example:

```text
Project:
YouTube Episode 17

Status:
IN_PRODUCTION
```

Do not create a fake Deliverable just to normalize the database.

### MULTI_DELIVERABLE

Used when many independently trackable outputs exist.

Example:

```text
Project:
2026 Basketball Season

Deliverables:
- Game 1 Highlights
- Game 2 Highlights
- Game 3 Highlights
...
```

Deliverables are architecturally valid, but the first vertical prototype does not need the complete multi-deliverable workflow before the project-level flow works.

## Prototype Project Statuses

Use a deliberately small status set:

```text
DRAFT
SUBMITTED
IN_PRODUCTION
READY_FOR_REVIEW
CHANGES_REQUESTED
COMPLETED
```

Do not design a configurable workflow engine.

## Source / Review / Final

Use this Dropbox structure where practical:

```text
/Prototype Clients/
  /{customer-id}/
    /{project-id}/
      /01-Source/
      /02-Review/
      /03-Final/
      /99-Internal/
```

Meaning:

* `01-Source` — customer-provided material
* `02-Review` — files intentionally presented for customer review
* `03-Final` — delivered final output
* `99-Internal` — editor-only material; never surfaced to customer

Do not build a folders table.

## Critical Prototype Rule

Do not confuse file upload with project submission.

A customer may upload files and still be preparing the job.

The prototype should have an explicit:

**Submit Project**

action.

## Scope Discipline

Do NOT add these unless explicitly requested:

* Supabase
* real authentication
* database migrations beyond what the prototype needs
* multi-tenant SaaS architecture
* billing
* payments
* SMS
* queues
* background workers
* transactional outbox
* reconciliation engine
* Dropbox webhooks
* broad Airtable webhook synchronization
* generic integration framework
* frame-accurate video comments
* task management
* production analytics
* notifications infrastructure
* customer invitations
* multiple video-editor organizations
* weighted progress
* reusable workflow engine
* complex review-round history

If a future production requirement is obvious, leave a short TODO or document it.

Do not build it merely because it will probably be needed later.

## Engineering Style

Prefer:

* simple vertical slices
* readable TypeScript
* server-side integration wrappers
* explicit domain vocabulary
* small components
* clear error states
* environment-variable validation
* minimal dependencies

Avoid:

* speculative abstractions
* generic repositories
* unnecessary service layers
* premature interfaces
* complex state-management libraries
* creating abstractions after only one use

Duplicate a small amount of prototype code before introducing an unnecessary abstraction.

## Secrets

Expected secrets may include:

```text
AIRTABLE_TOKEN
AIRTABLE_BASE_ID
DROPBOX_ACCESS_TOKEN
```

Potential additional integration IDs should also live in environment variables.

Never commit real credentials.

Provide `.env.example`.

## When I Say "Do the Next Thing"

When I say:

**do the next thing**

you must:

1. Read `docs/IMPLEMENTATION.md`.
2. Find the first unchecked implementation slice whose prerequisites are complete.
3. Implement that slice completely.
4. Keep the change limited to that slice.
5. Run lint.
6. Run relevant tests if tests exist.
7. Run the production build.
8. Fix failures caused by the change.
9. Update `docs/IMPLEMENTATION.md`.
10. Review the diff.
11. Commit the completed slice with a descriptive commit message.
12. Push to `origin main` if configured and all checks pass.
13. Report briefly:

* what changed
* what was tested
* what remains next

Do not ask for permission to:

* edit files
* create normal project files
* install ordinary dependencies
* run lint
* run tests
* run builds
* commit completed work
* push completed work to `origin main`

when those actions are part of an already-defined implementation slice.

## Stop Conditions

Stop instead of guessing if:

* a required Airtable credential is missing
* a required Dropbox credential is missing
* an external account must be manually configured before code can continue
* continuing would delete real Dropbox/Airtable data
* a requested action requires exposing a secret client-side
* requirements contradict `PROTOTYPE.md`

Otherwise make a reasonable implementation decision and continue.

## Definition of Done for a Slice

A slice is complete when:

* the feature works as defined
* error handling is reasonable for a prototype
* credentials remain server-side
* lint passes
* production build passes
* implementation checklist is updated
* work is committed
* work is pushed when a remote exists

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
