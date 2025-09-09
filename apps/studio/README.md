NuBlox Application Builder is a visual full-stack platform. At the top you have Platform (global controls), inside that Workspaces (tenants), inside those Projects (apps). Each project includes five first-class tools (“Studios”): SQL STUDIO, UI STUDIO, API STUDIO, LOGIC STUDIO, and DEVOPS STUDIO.

Layers

Platform

Platform Management – global administration (plans, billing, flags, auditing).

User Management – accounts, auth, org-wide policies.

Workspace

Members / Settings / etc. – tenant boundary: users, roles, secrets, feature flags, storage.

Projects – individual applications that ship together.

Inside a Project (Tools)

SQL STUDIO – the source of truth for data.

Visual ERD, DDL/DQL/DML/DCL/TCL, migrations, diffs, and reverse-engineering.

Feeds schemas to UI, API, and Logic.

UI STUDIO – build the front end visually.

Data-bound components, forms, lists, and layouts backed by the SQL model.

API STUDIO – define, secure, and test endpoints.

Instant CRUD per table/view, versioned routes, policies (auth, roles, rate limits).

LOGIC STUDIO – automation and workflows.

Triggers (events, schedules, webhooks), conditions/loops, actions (CRUD, notify, call API).

DEVOPS STUDIO – environments and delivery.

Dev/Test/Stage/Prod, secrets/config, builds, deployments, and rollbacks.

How the Studios Connect

SQL → UI: UI components bind to tables/views defined in SQL STUDIO.

SQL → API: API STUDIO scaffolds CRUD and custom endpoints from the schema.

SQL → Logic: workflows react to DB changes and execute transactional steps.

UI ↔ API: the UI calls APIs; APIs enforce policies and return typed data.

API ↔ Logic: endpoints can emit events to workflows; workflows can call internal/external APIs.

DEVOPS → All: environments, secrets, builds, and deploys apply across every studio.

Lifecycle (from idea to deploy)

Create Workspace & Project in Platform/Workspace.

Model data in SQL STUDIO (ERD, constraints, migrations).

Generate endpoints in API STUDIO (CRUD + custom, auth/rate limits).

Build screens in UI STUDIO (bind lists/forms to queries and endpoints).

Automate in LOGIC STUDIO (on submit, on schedule, on DB change).

Configure environments in DEVOPS STUDIO (secrets, build, deploy, promote).

Data & Multi-Tenancy

Platform owns global users & policies.

Workspace is the tenant boundary (members, roles, secrets, buckets).

Project is the deployable unit within a workspace.

Environments (per project) isolate runtime configuration and data endpoints.

Security & Governance

Centralized User Management, Roles/Permissions, Feature Flags, Audit Events.

API policies (auth required, role gates, CORS, rate limits).

Secrets/keys are scoped (workspace/project/connection) and managed centrally.