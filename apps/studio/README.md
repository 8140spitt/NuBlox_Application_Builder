%% NuBlox – High-level Architecture (Mermaid)
flowchart LR
  subgraph Platform
    direction TB
    users["Users (`users`, `user_profiles`, `user_sessions`, `user_verifications`)"]
    ws["Workspaces (`workspaces`, `workspace_members`, `roles`, `role_permissions`, `feature_flags`, `locales`, `translations`)"]
    ba["Business & Billing (`business_accounts`, `plans`, `subscriptions`, `invoices`, `usage_records`)"]
  end
  subgraph Studios
    direction TB
    sqlstudio["SQL Studio"]
    uistudio["UI Studio"]
    logicstudio["Logic Studio"]
    apistudio["API Studio"]
  end
  subgraph Project_Scope["Project Scope"]
    direction TB
    proj["Projects (`projects`, `project_members`)"]
    envs["Environments (`environments`, `env_vars`)"]
    apis["APIs (`api_collections`, `api_endpoints`, `api_policies`, `api_keys`)"]
    ui["UI (`ui_pages`, `ui_page_versions`, `ui_components_library`, `ui_assets`)"]
    workflows["Workflows (`workflows`, `workflow_versions`, `workflow_runs`, `workflow_triggers`, `workflow_webhooks`)"]
    data["Data Sources (`data_sources`, `db_connections`)"]
    build["Builds/Deploys (`builds`, `deployments`)"]
    storage["Storage (`storage_buckets`, `storage_objects`, `secrets`)"]
    audit["Audit (`audit_events`)"]
    notify["Notifications (`notification_templates`, `notification_events`, `notification_deliveries`)"]
    saved["Saved Objects (`saved_queries`, `saved_views`, `data_exports`, `data_imports`)"]
  end
  subgraph Engines
    direction TB
    sqlx["@nublox/sqlx (SQLX Engine)"]
    auth["AuthN/Z (roles, ACL, permissions)"]
  end
  users --> ws
  users --> proj
  ws --> proj
  ba --> ws
  proj --> envs
  proj --> apis
  proj --> ui
  proj --> workflows
  proj --> data
  proj --> build
  proj --> storage
  proj --> audit
  proj --> notify
  proj --> saved
  sqlstudio --> sqlx
  apistudio --> apis
  uistudio --> ui
  logicstudio --> workflows
  sqlx --> data
  auth --> ws
  auth --> proj
  classDef group fill:#0e1526,stroke:#234,stroke-width:1px,color:#e7eef7,rounded:8px;
  class Platform,Studios,Project_Scope,Engines group;
