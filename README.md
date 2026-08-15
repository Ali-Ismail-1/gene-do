# Gene Do — Video Editor Client Portal (Prototype)

A rapid prototype for a client portal used by a freelance video editor. See
[`docs/PROTOTYPE.md`](docs/PROTOTYPE.md) for the goals and scope, and
[`docs/IMPLEMENTATION.md`](docs/IMPLEMENTATION.md) for the implementation
plan.

This is a prototype, not a production system. Authentication is stubbed and
Airtable is temporarily used as the database. See `CLAUDE.md` for the full
set of intentional constraints.

## Getting Started

Install dependencies:

```bash
npm install
```

Copy the environment template and fill in credentials as later slices
require them:

```bash
cp .env.example .env.local
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev     # start the development server
npm run build   # production build
npm run start   # run the production build
npm run lint    # lint the project
```

## Environment Variables

See [`.env.example`](.env.example) for the full list. Server-side
integration modules validate required variables at call time and throw a
clear error if one is missing — no secrets are ever sent to the browser.

## Airtable Setup

Create a base with a **Projects** table (name it to match
`AIRTABLE_PROJECTS_TABLE`) and a personal access token scoped to that base
with `data.records:read` and `data.records:write`. Set:

```text
AIRTABLE_TOKEN=<personal access token>
AIRTABLE_BASE_ID=<base id, starts with "app">
AIRTABLE_PROJECTS_TABLE=Projects
```

The full recommended field list is documented in
[`docs/PROTOTYPE.md`](docs/PROTOTYPE.md#airtable-prototype-model). At
minimum the table must exist for the connectivity check to succeed;
fields are added as later slices need them (Project ID, Customer,
Project Name, Portal Status, etc.).

With `AIRTABLE_TOKEN`/`AIRTABLE_BASE_ID`/`AIRTABLE_PROJECTS_TABLE` set in
`.env.local`, visit
[http://localhost:3000/dev/airtable](http://localhost:3000/dev/airtable)
in development to verify connectivity. This route 404s outside
development.
