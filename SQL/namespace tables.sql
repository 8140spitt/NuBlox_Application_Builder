-- ==========================================================
-- NuBlox — Fresh Install DDL (Studios: platform, sql, api, ui, workflow, devops)
-- MySQL 8.0+
-- ==========================================================

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

DROP SCHEMA IF EXISTS `platform`;
DROP SCHEMA IF EXISTS `sql`;
DROP SCHEMA IF EXISTS `api`;
DROP SCHEMA IF EXISTS `ui`;
DROP SCHEMA IF EXISTS `workflow`;
DROP SCHEMA IF EXISTS `devops`;

-- Schemas
CREATE SCHEMA IF NOT EXISTS `platform`  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE SCHEMA IF NOT EXISTS `sql`       DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE SCHEMA IF NOT EXISTS `api`       DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE SCHEMA IF NOT EXISTS `ui`        DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE SCHEMA IF NOT EXISTS `workflow`  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE SCHEMA IF NOT EXISTS `devops`    DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- =======================
-- PLATFORM (core)
-- =======================

CREATE TABLE IF NOT EXISTS platform.users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(190) NOT NULL,
  status        ENUM('active','inactive','banned') NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.business_accounts (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id      BIGINT UNSIGNED NOT NULL,
  name               VARCHAR(255) NOT NULL,
  tax_id             VARCHAR(50) NULL DEFAULT NULL,
  address_line1      VARCHAR(255) NOT NULL,
  address_line2      VARCHAR(255) NULL DEFAULT NULL,
  city               VARCHAR(100) NOT NULL,
  postal_code        VARCHAR(20) NOT NULL,
  country_code       CHAR(2) NOT NULL,
  currency_code      CHAR(3) NOT NULL DEFAULT 'USD',
  vat_exempt         TINYINT(1) NOT NULL DEFAULT 0,
  contact_email      VARCHAR(190) NOT NULL,
  payment_provider   VARCHAR(50) NOT NULL,
  payment_provider_id VARCHAR(255) NOT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at         TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_business_owner (owner_user_id),
  CONSTRAINT fk_business_owner FOREIGN KEY (owner_user_id) REFERENCES platform.users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.workspaces (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_id            BIGINT UNSIGNED NOT NULL,
  name                VARCHAR(255) NOT NULL,
  slug                VARCHAR(190) NOT NULL,
  tier                ENUM('free','pro','enterprise') NOT NULL DEFAULT 'free',
  business_account_id BIGINT UNSIGNED NULL DEFAULT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_workspace_slug (slug, deleted_at),
  KEY idx_ws_owner (owner_id),
  KEY idx_ws_business (business_account_id),
  CONSTRAINT chk_ws_slug_lower CHECK (slug = LOWER(slug)),
  CONSTRAINT fk_ws_business FOREIGN KEY (business_account_id) REFERENCES platform.business_accounts(id),
  CONSTRAINT fk_ws_owner    FOREIGN KEY (owner_id) REFERENCES platform.users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.projects (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workspace_id BIGINT UNSIGNED NOT NULL,
  name         VARCHAR(255) NOT NULL,
  slug         VARCHAR(190) NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_project_slug (workspace_id, slug, deleted_at),
  KEY idx_proj_wsid (workspace_id),
  CONSTRAINT chk_proj_slug_lower CHECK (slug = LOWER(slug)),
  CONSTRAINT fk_proj_wsid FOREIGN KEY (workspace_id) REFERENCES platform.workspaces(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.permissions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  key_name    VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_perm_key (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.roles (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workspace_id BIGINT UNSIGNED NOT NULL,
  name         VARCHAR(100) NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_role_name (workspace_id, name),
  KEY idx_roles_ws (workspace_id),
  CONSTRAINT fk_roles_ws FOREIGN KEY (workspace_id) REFERENCES platform.workspaces(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.role_permissions (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_id       BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_role_perm (role_id, permission_id),
  KEY idx_rp_role (role_id),
  KEY idx_rp_perm (permission_id),
  CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES platform.roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rp_perm FOREIGN KEY (permission_id) REFERENCES platform.permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.workspace_members (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workspace_id  BIGINT UNSIGNED NOT NULL,
  user_id       BIGINT UNSIGNED NOT NULL,
  role          VARCHAR(100) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_workspace_member (workspace_id, user_id, deleted_at),
  KEY idx_wsmem_uid (user_id),
  KEY idx_wsmem_wsid (workspace_id),
  CONSTRAINT fk_wsmem_wsid FOREIGN KEY (workspace_id) REFERENCES platform.workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_wsmem_uid  FOREIGN KEY (user_id) REFERENCES platform.users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.project_members (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id  BIGINT UNSIGNED NOT NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_project_member (project_id, user_id, deleted_at),
  KEY idx_pm_uid (user_id),
  KEY idx_pm_pid (project_id),
  CONSTRAINT fk_pm_pid FOREIGN KEY (project_id) REFERENCES platform.projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_pm_uid FOREIGN KEY (user_id) REFERENCES platform.users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.user_profiles (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  prefix       VARCHAR(10)  NULL DEFAULT NULL,
  first_name   VARCHAR(100) NOT NULL,
  middle_name  VARCHAR(100) NULL DEFAULT NULL,
  last_name    VARCHAR(100) NOT NULL,
  bio          TEXT NULL DEFAULT NULL,
  avatar_url   VARCHAR(255) NULL DEFAULT NULL,
  email        VARCHAR(190) NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_profiles_user (user_id, deleted_at),
  UNIQUE KEY uq_user_profiles_email (email, deleted_at),
  KEY idx_up_user (user_id),
  CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES platform.users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.user_roles (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id   BIGINT UNSIGNED NOT NULL,
  role      VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_role (user_id, role),
  KEY idx_ur_uid (user_id),
  CONSTRAINT fk_ur_uid FOREIGN KEY (user_id) REFERENCES platform.users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.user_sessions (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  session_token CHAR(64) NOT NULL,
  expires_at    TIMESTAMP NOT NULL,
  ip            VARCHAR(64) NULL DEFAULT NULL,
  user_agent    VARCHAR(255) NULL DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_session_token (session_token),
  KEY idx_usess_uid (user_id),
  CONSTRAINT fk_usess_uid FOREIGN KEY (user_id) REFERENCES platform.users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.user_verifications (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  identifier VARCHAR(190) NOT NULL,
  token_hash BINARY(32) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_verification_identifier (identifier),
  KEY idx_usver_uid (user_id),
  CONSTRAINT fk_usver_uid FOREIGN KEY (user_id) REFERENCES platform.users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.plans (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  key_name    VARCHAR(100) NOT NULL,
  name        VARCHAR(190) NOT NULL,
  price_cents INT UNSIGNED NOT NULL DEFAULT 0,
  currency    CHAR(3) NOT NULL DEFAULT 'USD',
  meta_json   JSON NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_plan_key (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.subscriptions (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  business_account_id BIGINT UNSIGNED NOT NULL,
  plan_id             BIGINT UNSIGNED NOT NULL,
  status              ENUM('trialing','active','past_due','canceled') NOT NULL DEFAULT 'active',
  trial_end_at        TIMESTAMP NULL DEFAULT NULL,
  renews_at           TIMESTAMP NULL DEFAULT NULL,
  external_ref        VARCHAR(255) NULL DEFAULT NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sub (business_account_id, plan_id, status),
  KEY idx_sub_ba (business_account_id),
  KEY idx_sub_plan (plan_id),
  CONSTRAINT fk_sub_ba   FOREIGN KEY (business_account_id) REFERENCES platform.business_accounts(id),
  CONSTRAINT fk_sub_plan FOREIGN KEY (plan_id)            REFERENCES platform.plans(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.invoices (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subscription_id BIGINT UNSIGNED NOT NULL,
  amount_cents    INT UNSIGNED NOT NULL,
  currency        CHAR(3) NOT NULL,
  due_at          TIMESTAMP NOT NULL,
  paid_at         TIMESTAMP NULL DEFAULT NULL,
  external_id     VARCHAR(255) NULL DEFAULT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inv_sub (subscription_id),
  CONSTRAINT fk_inv_sub FOREIGN KEY (subscription_id) REFERENCES platform.subscriptions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.locales (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workspace_id BIGINT UNSIGNED NOT NULL,
  code         VARCHAR(20) NOT NULL,
  name         VARCHAR(100) NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_locale (workspace_id, code),
  KEY idx_loc_ws (workspace_id),
  CONSTRAINT fk_loc_ws FOREIGN KEY (workspace_id) REFERENCES platform.workspaces(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.translations (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workspace_id BIGINT UNSIGNED NOT NULL,
  locale_id    BIGINT UNSIGNED NOT NULL,
  namespace    VARCHAR(100) NOT NULL,
  key_name     VARCHAR(255) NOT NULL,
  value_text   LONGTEXT NOT NULL,
  updated_by   BIGINT UNSIGNED NULL DEFAULT NULL,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tr (workspace_id, locale_id, namespace, key_name),
  KEY idx_tr_loc (locale_id),
  KEY idx_tr_user (updated_by),
  CONSTRAINT fk_tr_loc FOREIGN KEY (locale_id) REFERENCES platform.locales(id),
  CONSTRAINT fk_tr_user FOREIGN KEY (updated_by) REFERENCES platform.users(id) ON DELETE SET NULL,
  CONSTRAINT fk_tr_ws FOREIGN KEY (workspace_id) REFERENCES platform.workspaces(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.meta_registry (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workspace_id BIGINT UNSIGNED NOT NULL,
  object_type  VARCHAR(40) NOT NULL,
  object_id    BIGINT UNSIGNED NOT NULL,
  name         VARCHAR(255) NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at   TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_mr_ws (workspace_id),
  KEY idx_mr_type_obj (object_type, object_id),
  CONSTRAINT fk_mr_ws FOREIGN KEY (workspace_id) REFERENCES platform.workspaces(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.notification_templates (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workspace_id  BIGINT UNSIGNED NOT NULL,
  key_name      VARCHAR(190) NOT NULL,
  channel       ENUM('email','sms','inapp','webhook') NOT NULL,
  subject       VARCHAR(255) NULL DEFAULT NULL,
  body_markdown LONGTEXT NULL DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_nt_key (workspace_id, key_name, deleted_at),
  KEY idx_nt_ws (workspace_id),
  CONSTRAINT fk_nt_ws FOREIGN KEY (workspace_id) REFERENCES platform.workspaces(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.notification_events (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id   BIGINT UNSIGNED NOT NULL,
  template_id  BIGINT UNSIGNED NULL DEFAULT NULL,
  channel      ENUM('email','sms','inapp','webhook') NOT NULL,
  payload_json JSON NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ne_proj (project_id),
  KEY idx_ne_tpl (template_id),
  CONSTRAINT fk_ne_proj FOREIGN KEY (project_id) REFERENCES platform.projects(id),
  CONSTRAINT fk_ne_tpl  FOREIGN KEY (template_id) REFERENCES platform.notification_templates(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.notification_deliveries (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id      BIGINT UNSIGNED NOT NULL,
  to_address    VARCHAR(255) NULL DEFAULT NULL,
  status        ENUM('queued','sent','failed') NOT NULL DEFAULT 'queued',
  provider      VARCHAR(100) NULL DEFAULT NULL,
  provider_ref  VARCHAR(255) NULL DEFAULT NULL,
  error_message TEXT NULL DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_nd_event (event_id),
  CONSTRAINT fk_nd_event FOREIGN KEY (event_id) REFERENCES platform.notification_events(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.credentials (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id               BIGINT UNSIGNED NOT NULL,
  credential_type       ENUM('password','oauth','api_key','webauthn') NOT NULL DEFAULT 'password',
  credential_value_hash VARBINARY(255) NULL DEFAULT NULL,
  salt                  VARBINARY(64) NULL DEFAULT NULL,
  secret_ref            VARCHAR(255) NULL DEFAULT NULL,
  meta                  JSON NULL DEFAULT NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at            TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_cred_uid (user_id),
  CONSTRAINT fk_cred_uid FOREIGN KEY (user_id) REFERENCES platform.users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.secrets (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  scope_type ENUM('workspace','project','connection','user','global') NOT NULL,
  scope_id   BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(190) NOT NULL,
  ciphertext VARBINARY(4096) NOT NULL,
  created_by BIGINT UNSIGNED NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_secret (scope_type, scope_id, name, deleted_at),
  KEY idx_secret_scope (scope_type, scope_id),
  KEY idx_secret_user (created_by),
  CONSTRAINT fk_secret_user FOREIGN KEY (created_by) REFERENCES platform.users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.storage_buckets (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workspace_id BIGINT UNSIGNED NOT NULL,
  name         VARCHAR(190) NOT NULL,
  provider     ENUM('local','s3','gcs','azure') NOT NULL DEFAULT 'local',
  config_json  LONGTEXT NULL DEFAULT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bucket (workspace_id, name),
  KEY idx_bucket_ws (workspace_id),
  CONSTRAINT fk_bucket_ws FOREIGN KEY (workspace_id) REFERENCES platform.workspaces(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.storage_objects (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  bucket_id    BIGINT UNSIGNED NOT NULL,
  key_name     VARCHAR(255) NOT NULL,
  content_type VARCHAR(190) NULL DEFAULT NULL,
  size_bytes   BIGINT UNSIGNED NULL DEFAULT NULL,
  checksum     BINARY(32) NULL,
  created_by   BIGINT UNSIGNED NULL DEFAULT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at   TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_object (bucket_id, key_name, deleted_at),
  KEY idx_obj_bucket (bucket_id),
  KEY idx_obj_user (created_by),
  CONSTRAINT fk_obj_bucket FOREIGN KEY (bucket_id) REFERENCES platform.storage_buckets(id),
  CONSTRAINT fk_obj_user    FOREIGN KEY (created_by) REFERENCES platform.users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.feature_flags (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workspace_id   BIGINT UNSIGNED NOT NULL,
  key_name       VARCHAR(100) NOT NULL,
  enabled_default TINYINT(1) NOT NULL DEFAULT 0,
  rules_json     JSON NULL DEFAULT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ff (workspace_id, key_name),
  KEY idx_ff_ws (workspace_id),
  CONSTRAINT fk_ff_ws FOREIGN KEY (workspace_id) REFERENCES platform.workspaces(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.tasks (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id  BIGINT UNSIGNED NOT NULL,
  parent_id   BIGINT UNSIGNED NULL DEFAULT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT NULL DEFAULT NULL,
  assignee_id BIGINT UNSIGNED NULL DEFAULT NULL,
  due_date    DATETIME NULL DEFAULT NULL,
  priority    ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'low',
  status      ENUM('todo','in_progress','blocked','done','archived') NOT NULL DEFAULT 'todo',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_tasks_project (project_id),
  KEY idx_tasks_parent (parent_id),
  KEY idx_tasks_status_priority (status, priority),
  KEY idx_tasks_assignee (assignee_id),
  CONSTRAINT fk_tasks_pid    FOREIGN KEY (project_id) REFERENCES platform.projects(id),
  CONSTRAINT fk_tasks_parent FOREIGN KEY (parent_id)  REFERENCES platform.tasks(id),
  CONSTRAINT fk_tasks_aid    FOREIGN KEY (assignee_id) REFERENCES platform.users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.task_attachments (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id    BIGINT UNSIGNED NOT NULL,
  user_id    BIGINT UNSIGNED NOT NULL,
  file_path  VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_tatt_tid (task_id),
  KEY idx_tatt_uid (user_id),
  CONSTRAINT fk_tatt_tid FOREIGN KEY (task_id) REFERENCES platform.tasks(id),
  CONSTRAINT fk_tatt_uid FOREIGN KEY (user_id) REFERENCES platform.users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.task_comments (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id    BIGINT UNSIGNED NOT NULL,
  user_id    BIGINT UNSIGNED NOT NULL,
  comment    TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_tcom_tid (task_id),
  KEY idx_tcom_uid (user_id),
  CONSTRAINT fk_tcom_tid FOREIGN KEY (task_id) REFERENCES platform.tasks(id),
  CONSTRAINT fk_tcom_uid FOREIGN KEY (user_id) REFERENCES platform.users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.audit_events (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workspace_id  BIGINT UNSIGNED NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL DEFAULT NULL,
  action        VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id   BIGINT UNSIGNED NOT NULL,
  metadata_json JSON NULL DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_ws_created (workspace_id, created_at),
  KEY idx_audit_resource (resource_type, resource_id),
  KEY idx_audit_user (actor_user_id),
  CONSTRAINT fk_audit_ws   FOREIGN KEY (workspace_id)  REFERENCES platform.workspaces(id),
  CONSTRAINT fk_audit_user FOREIGN KEY (actor_user_id) REFERENCES platform.users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.usage_records (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subscription_id  BIGINT UNSIGNED NOT NULL,
  metric_key       VARCHAR(100) NOT NULL,
  quantity         BIGINT UNSIGNED NOT NULL,
  period_start     TIMESTAMP NOT NULL,
  period_end       TIMESTAMP NOT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_usage_sub (subscription_id, metric_key, period_start),
  CONSTRAINT fk_usage_sub FOREIGN KEY (subscription_id) REFERENCES platform.subscriptions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform.db_migrations (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  version   VARCHAR(190) NOT NULL,
  up_sql    LONGTEXT NOT NULL,
  down_sql  LONGTEXT NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dbmig_ver (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =======================
-- DEVOPS
-- =======================
CREATE TABLE IF NOT EXISTS devops.environments (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id  BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL,
  kind        ENUM('dev','test','stage','prod','preview') NOT NULL DEFAULT 'dev',
  base_url    VARCHAR(255) NULL DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_env_slug (project_id, slug, deleted_at),
  KEY idx_env_project (project_id),
  CONSTRAINT chk_env_slug_lower CHECK (slug = LOWER(slug)),
  CONSTRAINT fk_env_project FOREIGN KEY (project_id) REFERENCES platform.projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS devops.env_vars (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  environment_id BIGINT UNSIGNED NOT NULL,
  key_name       VARCHAR(190) NOT NULL,
  value_plain    TEXT NULL DEFAULT NULL,
  secret_ref     VARCHAR(255) NULL DEFAULT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at     TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_envvar (environment_id, key_name, deleted_at),
  KEY idx_envvar_env (environment_id),
  CONSTRAINT chk_envvar_one_of CHECK ((value_plain IS NULL) <> (secret_ref IS NULL)),
  CONSTRAINT fk_envvar_env FOREIGN KEY (environment_id) REFERENCES devops.environments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS devops.builds (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id   BIGINT UNSIGNED NOT NULL,
  version      VARCHAR(50) NOT NULL,
  commit_sha   CHAR(40) NULL DEFAULT NULL,
  artifact_url VARCHAR(255) NULL DEFAULT NULL,
  created_by   BIGINT UNSIGNED NULL DEFAULT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_build_version (project_id, version),
  KEY idx_build_proj (project_id),
  KEY idx_build_user (created_by),
  CONSTRAINT fk_build_proj FOREIGN KEY (project_id) REFERENCES platform.projects(id),
  CONSTRAINT fk_build_user FOREIGN KEY (created_by) REFERENCES platform.users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS devops.deployments (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  environment_id BIGINT UNSIGNED NOT NULL,
  build_id       BIGINT UNSIGNED NOT NULL,
  status         ENUM('pending','running','succeeded','failed','canceled') NOT NULL DEFAULT 'pending',
  started_at     TIMESTAMP NULL DEFAULT NULL,
  finished_at    TIMESTAMP NULL DEFAULT NULL,
  logs_url       VARCHAR(255) NULL DEFAULT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_dep_env (environment_id),
  KEY idx_dep_build (build_id),
  CONSTRAINT fk_dep_env   FOREIGN KEY (environment_id) REFERENCES devops.environments(id),
  CONSTRAINT fk_dep_build FOREIGN KEY (build_id) REFERENCES devops.builds(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =======================
-- API
-- =======================
CREATE TABLE IF NOT EXISTS api.collections (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id  BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(190) NOT NULL,
  description TEXT NULL DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_api_coll (project_id, name),
  KEY idx_api_coll_proj (project_id),
  CONSTRAINT fk_api_coll_proj FOREIGN KEY (project_id) REFERENCES platform.projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS api.endpoints (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id    BIGINT UNSIGNED NOT NULL,
  collection_id BIGINT UNSIGNED NULL DEFAULT NULL,
  method        ENUM('GET','POST','PUT','PATCH','DELETE','OPTIONS') NOT NULL,
  path          VARCHAR(255) NOT NULL,
  handler_type  ENUM('crud','workflow','custom') NOT NULL,
  config_json   JSON NOT NULL,
  version       INT UNSIGNED NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_api_endpoint (project_id, method, path, version, deleted_at),
  KEY idx_api_ep_proj (project_id),
  KEY idx_api_ep_coll (collection_id),
  CONSTRAINT fk_api_ep_proj FOREIGN KEY (project_id) REFERENCES platform.projects(id),
  CONSTRAINT fk_api_ep_coll FOREIGN KEY (collection_id) REFERENCES api.collections(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS api.policies (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  endpoint_id       BIGINT UNSIGNED NOT NULL,
  auth_required     TINYINT(1) NOT NULL DEFAULT 1,
  role_requirements JSON NULL DEFAULT NULL,
  rate_limit_per_min INT UNSIGNED NULL DEFAULT NULL,
  cors_json         JSON NULL DEFAULT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_api_policy (endpoint_id),
  KEY idx_api_policy_ep (endpoint_id),
  CONSTRAINT fk_api_policy_ep FOREIGN KEY (endpoint_id) REFERENCES api.endpoints(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS api.keys (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id  BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(190) NOT NULL,
  key_hash    BINARY(32) NOT NULL,
  scopes_json JSON NULL DEFAULT NULL,
  expires_at  TIMESTAMP NULL DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_apikey (project_id, name),
  UNIQUE KEY uq_api_keys_hash (project_id, key_hash),
  KEY idx_apikey_proj (project_id),
  CONSTRAINT fk_apikey_proj FOREIGN KEY (project_id) REFERENCES platform.projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS api.tests (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  collection_id BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(190) NOT NULL,
  request_json  JSON NOT NULL,
  expect_json   JSON NOT NULL,
  last_status   ENUM('pass','fail','unknown') NOT NULL DEFAULT 'unknown',
  last_run_at   TIMESTAMP NULL DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_api_test (collection_id, name),
  KEY idx_api_test_coll (collection_id),
  CONSTRAINT fk_api_test_coll FOREIGN KEY (collection_id) REFERENCES api.collections(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS api.request_logs (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  endpoint_id      BIGINT UNSIGNED NOT NULL,
  environment_id   BIGINT UNSIGNED NULL DEFAULT NULL,
  method           VARCHAR(10) NOT NULL,
  path             VARCHAR(255) NOT NULL,
  status_code      INT NOT NULL,
  duration_ms      INT NULL DEFAULT NULL,
  ip_hash          BINARY(32) NULL DEFAULT NULL,
  req_headers_json JSON NULL DEFAULT NULL,
  req_body_json    JSON NULL DEFAULT NULL,
  res_headers_json JSON NULL DEFAULT NULL,
  res_body_json    JSON NULL DEFAULT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_api_log_ep (endpoint_id, created_at),
  KEY idx_api_log_env (environment_id, created_at),
  CONSTRAINT fk_api_log_ep  FOREIGN KEY (endpoint_id)    REFERENCES api.endpoints(id),
  CONSTRAINT fk_api_log_env FOREIGN KEY (environment_id) REFERENCES devops.environments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =======================
-- UI
-- =======================
CREATE TABLE IF NOT EXISTS ui.pages (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id   BIGINT UNSIGNED NOT NULL,
  name         VARCHAR(190) NOT NULL,
  route_path   VARCHAR(255) NOT NULL,
  is_home      TINYINT(1) NOT NULL DEFAULT 0,
  created_by   BIGINT UNSIGNED NULL DEFAULT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ui_route (project_id, route_path, deleted_at),
  KEY idx_ui_pages_proj (project_id),
  KEY idx_ui_pages_user (created_by),
  CONSTRAINT fk_ui_pages_proj FOREIGN KEY (project_id) REFERENCES platform.projects(id),
  CONSTRAINT fk_ui_pages_user FOREIGN KEY (created_by) REFERENCES platform.users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS ui.page_versions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  page_id     BIGINT UNSIGNED NOT NULL,
  version     INT UNSIGNED NOT NULL,
  tree_json   JSON NOT NULL,
  notes       VARCHAR(255) NULL DEFAULT NULL,
  created_by  BIGINT UNSIGNED NULL DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ui_page_ver (page_id, version),
  KEY idx_ui_pv_page (page_id),
  KEY idx_ui_pv_user (created_by),
  CONSTRAINT fk_ui_pv_page FOREIGN KEY (page_id) REFERENCES ui.pages(id),
  CONSTRAINT fk_ui_pv_user FOREIGN KEY (created_by) REFERENCES platform.users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS ui.components_library (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id      BIGINT UNSIGNED NOT NULL,
  name            VARCHAR(190) NOT NULL,
  definition_json JSON NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ui_clib (project_id, name, deleted_at),
  KEY idx_ui_clib_proj (project_id),
  CONSTRAINT fk_ui_clib_proj FOREIGN KEY (project_id) REFERENCES platform.projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS ui.assets (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id   BIGINT UNSIGNED NOT NULL,
  kind         ENUM('image','font','icon','file','svg') NOT NULL,
  name         VARCHAR(255) NOT NULL,
  storage_key  VARCHAR(255) NOT NULL,
  content_type VARCHAR(190) NULL DEFAULT NULL,
  size_bytes   BIGINT UNSIGNED NULL DEFAULT NULL,
  created_by   BIGINT UNSIGNED NULL DEFAULT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at   TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_ui_assets_proj (project_id),
  KEY idx_ui_assets_user (created_by),
  CONSTRAINT fk_ui_assets_proj FOREIGN KEY (project_id) REFERENCES platform.projects(id),
  CONSTRAINT fk_ui_assets_user FOREIGN KEY (created_by) REFERENCES platform.users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =======================
-- WORKFLOW
-- =======================
CREATE TABLE IF NOT EXISTS workflow.workflows (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id  BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(190) NOT NULL,
  description TEXT NULL DEFAULT NULL,
  is_enabled  TINYINT(1) NOT NULL DEFAULT 1,
  created_by  BIGINT UNSIGNED NULL DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wf_name (project_id, name, deleted_at),
  KEY idx_wf_proj (project_id),
  KEY idx_wf_user (created_by),
  CONSTRAINT fk_wf_proj FOREIGN KEY (project_id) REFERENCES platform.projects(id),
  CONSTRAINT fk_wf_user FOREIGN KEY (created_by) REFERENCES platform.users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS workflow.versions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workflow_id BIGINT UNSIGNED NOT NULL,
  version     INT UNSIGNED NOT NULL,
  graph_json  JSON NOT NULL,
  created_by  BIGINT UNSIGNED NULL DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wf_ver (workflow_id, version),
  KEY idx_wfv_wf (workflow_id),
  KEY idx_wfv_user (created_by),
  CONSTRAINT fk_wfv_wf   FOREIGN KEY (workflow_id) REFERENCES workflow.workflows(id),
  CONSTRAINT fk_wfv_user FOREIGN KEY (created_by) REFERENCES platform.users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS workflow.triggers (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workflow_id BIGINT UNSIGNED NOT NULL,
  kind        ENUM('event','schedule','webhook','db_change') NOT NULL,
  config_json JSON NOT NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wft_wf (workflow_id),
  CONSTRAINT fk_wft_wf FOREIGN KEY (workflow_id) REFERENCES workflow.workflows(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS workflow.runs (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workflow_id       BIGINT UNSIGNED NOT NULL,
  version           INT UNSIGNED NOT NULL,
  status            ENUM('queued','running','succeeded','failed','canceled') NOT NULL DEFAULT 'queued',
  trigger_kind      ENUM('event','schedule','webhook','manual') NOT NULL,
  trigger_payload_json LONGTEXT NULL DEFAULT NULL,
  started_at        TIMESTAMP NULL DEFAULT NULL,
  finished_at       TIMESTAMP NULL DEFAULT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wfr_wf (workflow_id, created_at),
  CONSTRAINT fk_wfr_wf FOREIGN KEY (workflow_id) REFERENCES workflow.workflows(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS workflow.run_nodes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  run_id      BIGINT UNSIGNED NOT NULL,
  node_id     VARCHAR(190) NOT NULL,
  node_type   VARCHAR(100) NOT NULL,
  status      ENUM('pending','running','succeeded','failed','skipped') NOT NULL DEFAULT 'pending',
  started_at  TIMESTAMP NULL DEFAULT NULL,
  finished_at TIMESTAMP NULL DEFAULT NULL,
  output_json LONGTEXT NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_wfrn_run (run_id),
  CONSTRAINT fk_wfrn_run FOREIGN KEY (run_id) REFERENCES workflow.runs(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS workflow.webhooks (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  workflow_id  BIGINT UNSIGNED NOT NULL,
  secret_ref   VARCHAR(255) NULL DEFAULT NULL,
  last_used_at TIMESTAMP NULL DEFAULT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wf_webhook (workflow_id),
  CONSTRAINT fk_wfh_wf FOREIGN KEY (workflow_id) REFERENCES workflow.workflows(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =======================
-- SQL (NuBlox SQL Studio)
-- =======================
CREATE TABLE IF NOT EXISTS sql.connections (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name            VARCHAR(190) NOT NULL,
  host            VARCHAR(255) NOT NULL,
  port            INT UNSIGNED NOT NULL,
  username        VARCHAR(190) NOT NULL,
  secret_ref      VARCHAR(255) NULL DEFAULT NULL,
  enc_credentials VARBINARY(2048) NULL DEFAULT NULL,
  dbms            ENUM('mysql','postgresql','sqlite','sqlserver','oracle') NOT NULL DEFAULT 'mysql',
  db_name         VARCHAR(255) NULL DEFAULT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dbconn_name (name),
  KEY idx_dbc_host_port (host, port)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.roles (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name      VARCHAR(190) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_db_role_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.users (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_connection_id BIGINT UNSIGNED NOT NULL,
  username         VARCHAR(190) NOT NULL,
  secret_ref       VARCHAR(255) NULL DEFAULT NULL,
  credential_hash  VARBINARY(255) NULL DEFAULT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at       TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dbu_user_per_conn (db_connection_id, username, deleted_at),
  KEY idx_dbu_cid (db_connection_id),
  CONSTRAINT fk_dbu_cid FOREIGN KEY (db_connection_id) REFERENCES sql.connections(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.role_assignments (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_user_id BIGINT UNSIGNED NOT NULL,
  db_role_id BIGINT UNSIGNED NOT NULL,
  granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_role_assignment (db_user_id, db_role_id),
  KEY idx_dbra_user (db_user_id),
  KEY idx_dbra_role (db_role_id),
  CONSTRAINT fk_dbra_user FOREIGN KEY (db_user_id) REFERENCES sql.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_dbra_role FOREIGN KEY (db_role_id) REFERENCES sql.roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.privileges (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_name  VARCHAR(190) NOT NULL,
  privilege  VARCHAR(190) NOT NULL,
  table_name VARCHAR(255) NULL DEFAULT NULL,
  granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_dbp_user (user_name),
  KEY idx_dbp_table (table_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.schemas (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_connection_id BIGINT UNSIGNED NOT NULL,
  name             VARCHAR(190) NOT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at       TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_schema_per_conn (db_connection_id, name, deleted_at),
  KEY idx_dbsch_cid (db_connection_id),
  CONSTRAINT fk_dbsch_cid FOREIGN KEY (db_connection_id) REFERENCES sql.connections(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.schema_exports (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_schema_id BIGINT UNSIGNED NOT NULL,
  format       ENUM('sql','json','yaml','xml','png','svg') NOT NULL,
  filename     VARCHAR(255) NULL DEFAULT NULL,
  user_id      BIGINT UNSIGNED NULL DEFAULT NULL,
  exported_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_dbsex_schema (db_schema_id),
  CONSTRAINT fk_dbsex_schema FOREIGN KEY (db_schema_id) REFERENCES sql.schemas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.schema_procedures (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_schema_id  BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(190) NOT NULL,
  definition_sql LONGTEXT NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_proc_per_schema (db_schema_id, name, deleted_at),
  KEY idx_dbproc_sid (db_schema_id),
  CONSTRAINT fk_dbproc_sid FOREIGN KEY (db_schema_id) REFERENCES sql.schemas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.schema_tables (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_schema_id BIGINT UNSIGNED NOT NULL,
  name         VARCHAR(190) NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_table_per_schema (db_schema_id, name, deleted_at),
  KEY idx_dbtab_sid (db_schema_id),
  CONSTRAINT fk_dbtab_sid FOREIGN KEY (db_schema_id) REFERENCES sql.schemas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.schema_table_columns (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_schema_table_id BIGINT UNSIGNED NOT NULL,
  name               VARCHAR(190) NOT NULL,
  data_type          VARCHAR(100) NOT NULL,
  length_val         INT UNSIGNED NULL DEFAULT NULL,
  precision_val      INT UNSIGNED NULL DEFAULT NULL,
  scale_val          INT UNSIGNED NULL DEFAULT NULL,
  default_expr       VARCHAR(255) NULL DEFAULT NULL,
  is_not_null        TINYINT(1) NOT NULL DEFAULT 0,
  is_auto_increment  TINYINT(1) NOT NULL DEFAULT 0,
  is_primary_key     TINYINT(1) NOT NULL DEFAULT 0,
  is_unique          TINYINT(1) NOT NULL DEFAULT 0,
  is_unsigned        TINYINT(1) NOT NULL DEFAULT 0,
  ref_table          VARCHAR(255) NULL DEFAULT NULL,
  ref_columns        VARCHAR(255) NULL DEFAULT NULL,
  ordinal_position   INT UNSIGNED NULL DEFAULT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at         TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_col_per_table (db_schema_table_id, name, deleted_at),
  KEY idx_dbcol_tid (db_schema_table_id),
  KEY idx_dbcol_ord (db_schema_table_id, ordinal_position),
  CONSTRAINT fk_dbcol_tid FOREIGN KEY (db_schema_table_id) REFERENCES sql.schema_tables(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.schema_table_indexes (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_schema_table_id BIGINT UNSIGNED NOT NULL,
  name               VARCHAR(190) NOT NULL,
  columns_csv        VARCHAR(255) NOT NULL,
  is_unique          TINYINT(1) NOT NULL DEFAULT 0,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at         TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_idx_per_table (db_schema_table_id, name, deleted_at),
  KEY idx_dbidx_tid (db_schema_table_id),
  CONSTRAINT fk_dbidx_tid FOREIGN KEY (db_schema_table_id) REFERENCES sql.schema_tables(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.schema_table_checks (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_schema_table_id BIGINT UNSIGNED NOT NULL,
  name               VARCHAR(190) NOT NULL,
  expression_sql     VARCHAR(255) NOT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at         TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_chk_per_table (db_schema_table_id, name, deleted_at),
  KEY idx_dbchk_tid (db_schema_table_id),
  CONSTRAINT fk_dbchk_tid FOREIGN KEY (db_schema_table_id) REFERENCES sql.schema_tables(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.schema_table_foreign_keys (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_schema_table_id BIGINT UNSIGNED NOT NULL,
  name               VARCHAR(190) NOT NULL,
  columns_csv        VARCHAR(255) NOT NULL,
  ref_table          VARCHAR(255) NOT NULL,
  ref_columns_csv    VARCHAR(255) NOT NULL,
  on_delete_action   VARCHAR(20) NOT NULL,
  on_update_action   VARCHAR(20) NOT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at         TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fk_per_table (db_schema_table_id, name, deleted_at),
  KEY idx_dbfk_tid (db_schema_table_id),
  CONSTRAINT fk_dbfk_tid FOREIGN KEY (db_schema_table_id) REFERENCES sql.schema_tables(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.schema_table_triggers (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_schema_table_id BIGINT UNSIGNED NOT NULL,
  name               VARCHAR(190) NOT NULL,
  event_type         VARCHAR(20) NOT NULL,
  timing             VARCHAR(20) NOT NULL,
  statement_sql      TEXT NOT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at         TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_trg_per_table (db_schema_table_id, name, deleted_at),
  KEY idx_dbtrg_tid (db_schema_table_id),
  CONSTRAINT fk_dbtrg_tid FOREIGN KEY (db_schema_table_id) REFERENCES sql.schema_tables(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.schema_views (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_schema_id  BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(190) NOT NULL,
  definition_sql LONGTEXT NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_view_per_schema (db_schema_id, name, deleted_at),
  KEY idx_dbview_sid (db_schema_id),
  CONSTRAINT fk_dbview_sid FOREIGN KEY (db_schema_id) REFERENCES sql.schemas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.query_logs (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_connection_id BIGINT UNSIGNED NOT NULL,
  query_sql        LONGTEXT NOT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_dbql_conn_created (db_connection_id, created_at),
  CONSTRAINT fk_dbql_conn FOREIGN KEY (db_connection_id) REFERENCES sql.connections(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.query_results (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_connection_id BIGINT UNSIGNED NOT NULL,
  query_sql        LONGTEXT NOT NULL,
  result_json      LONGTEXT NOT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_dbqr_conn_created (db_connection_id, created_at),
  CONSTRAINT fk_dbqr_conn FOREIGN KEY (db_connection_id) REFERENCES sql.connections(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.query_errors (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_connection_id BIGINT UNSIGNED NOT NULL,
  error_message    TEXT NOT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_dbqe_conn_created (db_connection_id, created_at),
  CONSTRAINT fk_dbqe_conn FOREIGN KEY (db_connection_id) REFERENCES sql.connections(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.connection_errors (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_connection_id BIGINT UNSIGNED NOT NULL,
  error_message    TEXT NOT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_dbce_cid_created (db_connection_id, created_at),
  CONSTRAINT fk_dbce_cid FOREIGN KEY (db_connection_id) REFERENCES sql.connections(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.data_sources (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id    BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(190) NOT NULL,
  kind          ENUM('mysql','postgresql','sqlite','sqlserver','oracle','http','graphql') NOT NULL,
  config_json   JSON NOT NULL,
  secret_ref    VARCHAR(255) NULL DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ds_name (project_id, name, deleted_at),
  KEY idx_ds_proj (project_id),
  CONSTRAINT fk_ds_proj FOREIGN KEY (project_id) REFERENCES platform.projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.saved_queries (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id       BIGINT UNSIGNED NOT NULL,
  db_connection_id BIGINT UNSIGNED NOT NULL,
  name             VARCHAR(190) NOT NULL,
  query_sql        LONGTEXT NOT NULL,
  last_run_at      TIMESTAMP NULL DEFAULT NULL,
  created_by       BIGINT UNSIGNED NULL DEFAULT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_saved_query (project_id, name),
  KEY idx_sq_proj (project_id),
  KEY idx_sq_conn (db_connection_id),
  KEY idx_sq_user (created_by),
  CONSTRAINT fk_sq_conn FOREIGN KEY (db_connection_id) REFERENCES sql.connections(id),
  CONSTRAINT fk_sq_proj FOREIGN KEY (project_id)      REFERENCES platform.projects(id),
  CONSTRAINT fk_sq_user FOREIGN KEY (created_by)      REFERENCES platform.users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.saved_views (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id  BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(190) NOT NULL,
  config_json LONGTEXT NOT NULL,
  created_by  BIGINT UNSIGNED NULL DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_saved_view (project_id, name),
  KEY idx_sv_proj (project_id),
  KEY idx_sv_user (created_by),
  CONSTRAINT fk_sv_proj FOREIGN KEY (project_id) REFERENCES platform.projects(id),
  CONSTRAINT fk_sv_user FOREIGN KEY (created_by) REFERENCES platform.users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.data_exports (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id  BIGINT UNSIGNED NOT NULL,
  format      ENUM('csv','xlsx','json') NOT NULL,
  filename    VARCHAR(255) NULL DEFAULT NULL,
  query_ref   BIGINT UNSIGNED NULL DEFAULT NULL,
  created_by  BIGINT UNSIGNED NULL DEFAULT NULL,
  exported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_de_proj (project_id),
  KEY idx_de_user (created_by),
  KEY idx_de_query (query_ref),
  CONSTRAINT fk_de_proj  FOREIGN KEY (project_id) REFERENCES platform.projects(id),
  CONSTRAINT fk_de_query FOREIGN KEY (query_ref)  REFERENCES sql.saved_queries(id),
  CONSTRAINT fk_de_user  FOREIGN KEY (created_by) REFERENCES platform.users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.data_imports (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id   BIGINT UNSIGNED NOT NULL,
  source_type  ENUM('csv','xlsx','json','api') NOT NULL,
  file_path    VARCHAR(255) NULL DEFAULT NULL,
  status       ENUM('pending','running','succeeded','failed') NOT NULL DEFAULT 'pending',
  rows_total   BIGINT UNSIGNED NULL DEFAULT NULL,
  rows_loaded  BIGINT UNSIGNED NULL DEFAULT NULL,
  created_by   BIGINT UNSIGNED NULL DEFAULT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_di_proj (project_id),
  KEY idx_di_user (created_by),
  CONSTRAINT fk_di_proj FOREIGN KEY (project_id) REFERENCES platform.projects(id),
  CONSTRAINT fk_di_user FOREIGN KEY (created_by) REFERENCES platform.users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.table_rows (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_schema_table_id BIGINT UNSIGNED NOT NULL,
  data_json          JSON NOT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at         TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_dbrow_tid_created (db_schema_table_id, created_at),
  CONSTRAINT fk_dbrow_tid FOREIGN KEY (db_schema_table_id) REFERENCES sql.schema_tables(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.user_activity (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_user_id       BIGINT UNSIGNED NOT NULL,
  db_connection_id BIGINT UNSIGNED NOT NULL,
  activity_type    VARCHAR(100) NOT NULL,
  activity_details JSON NULL DEFAULT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_dbuact_user (db_user_id),
  KEY idx_dbuact_conn_created (db_connection_id, created_at),
  CONSTRAINT fk_dbuact_user FOREIGN KEY (db_user_id) REFERENCES sql.users(id),
  CONSTRAINT fk_dbuact_conn FOREIGN KEY (db_connection_id) REFERENCES sql.connections(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sql.user_permissions (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  db_user_id       BIGINT UNSIGNED NOT NULL,
  db_connection_id BIGINT UNSIGNED NOT NULL,
  permission       VARCHAR(100) NOT NULL,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dbup (db_user_id, db_connection_id, permission),
  KEY idx_dbup_cid (db_connection_id),
  CONSTRAINT fk_dbup_uid FOREIGN KEY (db_user_id) REFERENCES sql.users(id),
  CONSTRAINT fk_dbup_cid FOREIGN KEY (db_connection_id) REFERENCES sql.connections(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
