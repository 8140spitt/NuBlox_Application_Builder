SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema nublox_studio
-- -----------------------------------------------------
DROP SCHEMA IF EXISTS `nublox_studio` ;

-- -----------------------------------------------------
-- Schema nublox_studio
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `nublox_studio` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;
USE `nublox_studio` ;

-- -----------------------------------------------------
-- Table `users`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `users` ;

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(190) NOT NULL,
  `status` ENUM('active', 'inactive', 'banned') NOT NULL DEFAULT 'active',
  `last_login_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_users_username` ON `users` (`username` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `business_accounts`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `business_accounts` ;

CREATE TABLE IF NOT EXISTS `business_accounts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_user_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `tax_id` VARCHAR(50) NULL DEFAULT NULL,
  `address_line1` VARCHAR(255) NOT NULL,
  `address_line2` VARCHAR(255) NULL DEFAULT NULL,
  `city` VARCHAR(100) NOT NULL,
  `postal_code` VARCHAR(20) NOT NULL,
  `country_code` CHAR(2) NOT NULL,
  `currency_code` CHAR(3) NOT NULL DEFAULT 'USD',
  `vat_exempt` TINYINT(1) NOT NULL DEFAULT '0',
  `contact_email` VARCHAR(190) NOT NULL,
  `payment_provider` VARCHAR(50) NOT NULL,
  `payment_provider_id` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_business_owner`
    FOREIGN KEY (`owner_user_id`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_business_owner` ON `business_accounts` (`owner_user_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `workspaces`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `workspaces` ;

CREATE TABLE IF NOT EXISTS `workspaces` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(190) NOT NULL,
  `tier` ENUM('free', 'pro', 'enterprise') NOT NULL DEFAULT 'free',
  `business_account_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ws_business`
    FOREIGN KEY (`business_account_id`)
    REFERENCES `business_accounts` (`id`),
  CONSTRAINT `fk_ws_owner`
    FOREIGN KEY (`owner_id`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_workspace_slug` ON `workspaces` (`slug` ASC) VISIBLE;

CREATE INDEX `idx_ws_owner` ON `workspaces` (`owner_id` ASC) VISIBLE;

CREATE INDEX `idx_ws_business` ON `workspaces` (`business_account_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `projects`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `projects` ;

CREATE TABLE IF NOT EXISTS `projects` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workspace_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(190) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_proj_wsid`
    FOREIGN KEY (`workspace_id`)
    REFERENCES `workspaces` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_project_slug` ON `projects` (`workspace_id` ASC, `slug` ASC) VISIBLE;

CREATE INDEX `idx_proj_wsid` ON `projects` (`workspace_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `api_collections`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `api_collections` ;

CREATE TABLE IF NOT EXISTS `api_collections` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_api_coll_proj`
    FOREIGN KEY (`project_id`)
    REFERENCES `projects` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_api_coll` ON `api_collections` (`project_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_api_coll_proj` ON `api_collections` (`project_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `api_endpoints`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `api_endpoints` ;

CREATE TABLE IF NOT EXISTS `api_endpoints` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `collection_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `method` ENUM('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS') NOT NULL,
  `path` VARCHAR(255) NOT NULL,
  `handler_type` ENUM('crud', 'workflow', 'custom') NOT NULL,
  `config_json` LONGTEXT NOT NULL,
  `version` INT UNSIGNED NOT NULL DEFAULT '1',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_api_ep_coll`
    FOREIGN KEY (`collection_id`)
    REFERENCES `api_collections` (`id`),
  CONSTRAINT `fk_api_ep_proj`
    FOREIGN KEY (`project_id`)
    REFERENCES `projects` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_api_endpoint` ON `api_endpoints` (`project_id` ASC, `method` ASC, `path` ASC, `version` ASC) VISIBLE;

CREATE INDEX `idx_api_ep_proj` ON `api_endpoints` (`project_id` ASC) VISIBLE;

CREATE INDEX `idx_api_ep_coll` ON `api_endpoints` (`collection_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `api_keys`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `api_keys` ;

CREATE TABLE IF NOT EXISTS `api_keys` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `key_hash` VARBINARY(255) NOT NULL,
  `scopes_json` JSON NULL DEFAULT NULL,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_apikey_proj`
    FOREIGN KEY (`project_id`)
    REFERENCES `projects` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_apikey` ON `api_keys` (`project_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_apikey_proj` ON `api_keys` (`project_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `api_policies`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `api_policies` ;

CREATE TABLE IF NOT EXISTS `api_policies` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `endpoint_id` BIGINT UNSIGNED NOT NULL,
  `auth_required` TINYINT(1) NOT NULL DEFAULT '1',
  `role_requirements` JSON NULL DEFAULT NULL,
  `rate_limit_per_min` INT UNSIGNED NULL DEFAULT NULL,
  `cors_json` JSON NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_api_policy_ep`
    FOREIGN KEY (`endpoint_id`)
    REFERENCES `api_endpoints` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_api_policy` ON `api_policies` (`endpoint_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `environments`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `environments` ;

CREATE TABLE IF NOT EXISTS `environments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `kind` ENUM('dev', 'test', 'stage', 'prod', 'preview') NOT NULL DEFAULT 'dev',
  `base_url` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_env_project`
    FOREIGN KEY (`project_id`)
    REFERENCES `projects` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_env_slug` ON `environments` (`project_id` ASC, `slug` ASC) VISIBLE;

CREATE INDEX `idx_env_project` ON `environments` (`project_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `api_request_logs`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `api_request_logs` ;

CREATE TABLE IF NOT EXISTS `api_request_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `endpoint_id` BIGINT UNSIGNED NOT NULL,
  `environment_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `method` VARCHAR(10) NOT NULL,
  `path` VARCHAR(255) NOT NULL,
  `status_code` INT NOT NULL,
  `duration_ms` INT NULL DEFAULT NULL,
  `ip_hash` VARBINARY(64) NULL DEFAULT NULL,
  `req_headers_json` LONGTEXT NULL DEFAULT NULL,
  `req_body_json` LONGTEXT NULL DEFAULT NULL,
  `res_headers_json` LONGTEXT NULL DEFAULT NULL,
  `res_body_json` LONGTEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_api_log_env`
    FOREIGN KEY (`environment_id`)
    REFERENCES `environments` (`id`),
  CONSTRAINT `fk_api_log_ep`
    FOREIGN KEY (`endpoint_id`)
    REFERENCES `api_endpoints` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_api_log_ep` ON `api_request_logs` (`endpoint_id` ASC, `created_at` ASC) VISIBLE;

CREATE INDEX `idx_api_log_env` ON `api_request_logs` (`environment_id` ASC, `created_at` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `api_tests`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `api_tests` ;

CREATE TABLE IF NOT EXISTS `api_tests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `collection_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `request_json` LONGTEXT NOT NULL,
  `expect_json` LONGTEXT NOT NULL,
  `last_status` ENUM('pass', 'fail', 'unknown') NOT NULL DEFAULT 'unknown',
  `last_run_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_api_test_coll`
    FOREIGN KEY (`collection_id`)
    REFERENCES `api_collections` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_api_test` ON `api_tests` (`collection_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_api_test_coll` ON `api_tests` (`collection_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `audit_events`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `audit_events` ;

CREATE TABLE IF NOT EXISTS `audit_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workspace_id` BIGINT UNSIGNED NOT NULL,
  `actor_user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `resource_type` VARCHAR(50) NOT NULL,
  `resource_id` BIGINT UNSIGNED NOT NULL,
  `metadata_json` JSON NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_audit_user`
    FOREIGN KEY (`actor_user_id`)
    REFERENCES `users` (`id`),
  CONSTRAINT `fk_audit_ws`
    FOREIGN KEY (`workspace_id`)
    REFERENCES `workspaces` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_audit_ws_created` ON `audit_events` (`workspace_id` ASC, `created_at` ASC) VISIBLE;

CREATE INDEX `idx_audit_resource` ON `audit_events` (`resource_type` ASC, `resource_id` ASC) VISIBLE;

CREATE INDEX `fk_audit_user` ON `audit_events` (`actor_user_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `builds`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `builds` ;

CREATE TABLE IF NOT EXISTS `builds` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `version` VARCHAR(50) NOT NULL,
  `commit_sha` CHAR(40) NULL DEFAULT NULL,
  `artifact_url` VARCHAR(255) NULL DEFAULT NULL,
  `created_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_build_proj`
    FOREIGN KEY (`project_id`)
    REFERENCES `projects` (`id`),
  CONSTRAINT `fk_build_user`
    FOREIGN KEY (`created_by`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_build_version` ON `builds` (`project_id` ASC, `version` ASC) VISIBLE;

CREATE INDEX `idx_build_proj` ON `builds` (`project_id` ASC) VISIBLE;

CREATE INDEX `fk_build_user` ON `builds` (`created_by` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `credentials`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `credentials` ;

CREATE TABLE IF NOT EXISTS `credentials` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `credential_type` ENUM('password', 'oauth', 'api_key', 'webauthn') NOT NULL DEFAULT 'password',
  `credential_value_hash` VARBINARY(255) NULL DEFAULT NULL,
  `salt` VARBINARY(64) NULL DEFAULT NULL,
  `secret_ref` VARCHAR(255) NULL DEFAULT NULL,
  `meta` JSON NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_cred_uid`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_cred_uid` ON `credentials` (`user_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_connections`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_connections` ;

CREATE TABLE IF NOT EXISTS `db_connections` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(190) NOT NULL,
  `host` VARCHAR(255) NOT NULL,
  `port` INT UNSIGNED NOT NULL,
  `username` VARCHAR(190) NOT NULL,
  `secret_ref` VARCHAR(255) NULL DEFAULT NULL,
  `enc_credentials` VARBINARY(2048) NULL DEFAULT NULL,
  `dbms` ENUM('mysql', 'postgresql', 'sqlite', 'sqlserver', 'oracle') NOT NULL DEFAULT 'mysql',
  `db_name` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_dbconn_name` ON `db_connections` (`name` ASC) VISIBLE;

CREATE INDEX `idx_dbc_host_port` ON `db_connections` (`host` ASC, `port` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `saved_queries`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `saved_queries` ;

CREATE TABLE IF NOT EXISTS `saved_queries` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `db_connection_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `query_sql` LONGTEXT NOT NULL,
  `last_run_at` TIMESTAMP NULL DEFAULT NULL,
  `created_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_sq_conn`
    FOREIGN KEY (`db_connection_id`)
    REFERENCES `db_connections` (`id`),
  CONSTRAINT `fk_sq_proj`
    FOREIGN KEY (`project_id`)
    REFERENCES `projects` (`id`),
  CONSTRAINT `fk_sq_user`
    FOREIGN KEY (`created_by`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_saved_query` ON `saved_queries` (`project_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_sq_proj` ON `saved_queries` (`project_id` ASC) VISIBLE;

CREATE INDEX `idx_sq_conn` ON `saved_queries` (`db_connection_id` ASC) VISIBLE;

CREATE INDEX `fk_sq_user` ON `saved_queries` (`created_by` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `data_exports`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `data_exports` ;

CREATE TABLE IF NOT EXISTS `data_exports` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `format` ENUM('csv', 'xlsx', 'json') NOT NULL,
  `filename` VARCHAR(255) NULL DEFAULT NULL,
  `query_ref` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `exported_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_de_proj`
    FOREIGN KEY (`project_id`)
    REFERENCES `projects` (`id`),
  CONSTRAINT `fk_de_query`
    FOREIGN KEY (`query_ref`)
    REFERENCES `saved_queries` (`id`),
  CONSTRAINT `fk_de_user`
    FOREIGN KEY (`created_by`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_de_proj` ON `data_exports` (`project_id` ASC) VISIBLE;

CREATE INDEX `fk_de_user` ON `data_exports` (`created_by` ASC) VISIBLE;

CREATE INDEX `fk_de_query` ON `data_exports` (`query_ref` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `data_imports`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `data_imports` ;

CREATE TABLE IF NOT EXISTS `data_imports` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `source_type` ENUM('csv', 'xlsx', 'json', 'api') NOT NULL,
  `file_path` VARCHAR(255) NULL DEFAULT NULL,
  `status` ENUM('pending', 'running', 'succeeded', 'failed') NOT NULL DEFAULT 'pending',
  `rows_total` BIGINT UNSIGNED NULL DEFAULT NULL,
  `rows_loaded` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_di_proj`
    FOREIGN KEY (`project_id`)
    REFERENCES `projects` (`id`),
  CONSTRAINT `fk_di_user`
    FOREIGN KEY (`created_by`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_di_proj` ON `data_imports` (`project_id` ASC) VISIBLE;

CREATE INDEX `fk_di_user` ON `data_imports` (`created_by` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `data_sources`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `data_sources` ;

CREATE TABLE IF NOT EXISTS `data_sources` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `kind` ENUM('mysql', 'postgresql', 'sqlite', 'sqlserver', 'oracle', 'http', 'graphql') NOT NULL,
  `config_json` LONGTEXT NOT NULL,
  `secret_ref` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ds_proj`
    FOREIGN KEY (`project_id`)
    REFERENCES `projects` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_ds_name` ON `data_sources` (`project_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_ds_proj` ON `data_sources` (`project_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_connection_errors`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_connection_errors` ;

CREATE TABLE IF NOT EXISTS `db_connection_errors` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_connection_id` BIGINT UNSIGNED NOT NULL,
  `error_message` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbce_cid`
    FOREIGN KEY (`db_connection_id`)
    REFERENCES `db_connections` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_dbce_cid_created` ON `db_connection_errors` (`db_connection_id` ASC, `created_at` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_migrations`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_migrations` ;

CREATE TABLE IF NOT EXISTS `db_migrations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `version` VARCHAR(190) NOT NULL,
  `up_sql` LONGTEXT NOT NULL,
  `down_sql` LONGTEXT NOT NULL,
  `applied_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_dbmig_ver` ON `db_migrations` (`version` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_privileges`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_privileges` ;

CREATE TABLE IF NOT EXISTS `db_privileges` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_name` VARCHAR(190) NOT NULL,
  `privilege` VARCHAR(190) NOT NULL,
  `table_name` VARCHAR(255) NULL DEFAULT NULL,
  `granted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_dbp_user` ON `db_privileges` (`user_name` ASC) VISIBLE;

CREATE INDEX `idx_dbp_table` ON `db_privileges` (`table_name` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_query_errors`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_query_errors` ;

CREATE TABLE IF NOT EXISTS `db_query_errors` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_connection_id` BIGINT UNSIGNED NOT NULL,
  `error_message` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbqe_conn`
    FOREIGN KEY (`db_connection_id`)
    REFERENCES `db_connections` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_dbqe_conn_created` ON `db_query_errors` (`db_connection_id` ASC, `created_at` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_query_logs`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_query_logs` ;

CREATE TABLE IF NOT EXISTS `db_query_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_connection_id` BIGINT UNSIGNED NOT NULL,
  `query_sql` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbql_conn`
    FOREIGN KEY (`db_connection_id`)
    REFERENCES `db_connections` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_dbql_conn_created` ON `db_query_logs` (`db_connection_id` ASC, `created_at` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_query_results`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_query_results` ;

CREATE TABLE IF NOT EXISTS `db_query_results` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_connection_id` BIGINT UNSIGNED NOT NULL,
  `query_sql` LONGTEXT NOT NULL,
  `result_json` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbqr_conn`
    FOREIGN KEY (`db_connection_id`)
    REFERENCES `db_connections` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_dbqr_conn_created` ON `db_query_results` (`db_connection_id` ASC, `created_at` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_roles`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_roles` ;

CREATE TABLE IF NOT EXISTS `db_roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(190) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_db_role_name` ON `db_roles` (`name` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_users`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_users` ;

CREATE TABLE IF NOT EXISTS `db_users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_connection_id` BIGINT UNSIGNED NOT NULL,
  `username` VARCHAR(190) NOT NULL,
  `secret_ref` VARCHAR(255) NULL DEFAULT NULL,
  `credential_hash` VARBINARY(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbu_cid`
    FOREIGN KEY (`db_connection_id`)
    REFERENCES `db_connections` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_dbu_user_per_conn` ON `db_users` (`db_connection_id` ASC, `username` ASC) VISIBLE;

CREATE INDEX `idx_dbu_cid` ON `db_users` (`db_connection_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_role_assignments`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_role_assignments` ;

CREATE TABLE IF NOT EXISTS `db_role_assignments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_user_id` BIGINT UNSIGNED NOT NULL,
  `db_role_id` BIGINT UNSIGNED NOT NULL,
  `granted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbra_role`
    FOREIGN KEY (`db_role_id`)
    REFERENCES `db_roles` (`id`),
  CONSTRAINT `fk_dbra_user`
    FOREIGN KEY (`db_user_id`)
    REFERENCES `db_users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_role_assignment` ON `db_role_assignments` (`db_user_id` ASC, `db_role_id` ASC) VISIBLE;

CREATE INDEX `idx_dbra_user` ON `db_role_assignments` (`db_user_id` ASC) VISIBLE;

CREATE INDEX `idx_dbra_role` ON `db_role_assignments` (`db_role_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_schemas`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_schemas` ;

CREATE TABLE IF NOT EXISTS `db_schemas` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_connection_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbsch_cid`
    FOREIGN KEY (`db_connection_id`)
    REFERENCES `db_connections` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_schema_per_conn` ON `db_schemas` (`db_connection_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_dbsch_cid` ON `db_schemas` (`db_connection_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_schema_exports`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_schema_exports` ;

CREATE TABLE IF NOT EXISTS `db_schema_exports` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_schema_id` BIGINT UNSIGNED NOT NULL,
  `format` ENUM('sql', 'json', 'yaml', 'xml', 'png', 'svg') NOT NULL,
  `filename` VARCHAR(255) NULL DEFAULT NULL,
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `exported_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbsex_schema`
    FOREIGN KEY (`db_schema_id`)
    REFERENCES `db_schemas` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_dbsex_schema` ON `db_schema_exports` (`db_schema_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_schema_procedures`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_schema_procedures` ;

CREATE TABLE IF NOT EXISTS `db_schema_procedures` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_schema_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `definition_sql` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbproc_sid`
    FOREIGN KEY (`db_schema_id`)
    REFERENCES `db_schemas` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_proc_per_schema` ON `db_schema_procedures` (`db_schema_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_dbproc_sid` ON `db_schema_procedures` (`db_schema_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_schema_tables`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_schema_tables` ;

CREATE TABLE IF NOT EXISTS `db_schema_tables` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_schema_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbtab_sid`
    FOREIGN KEY (`db_schema_id`)
    REFERENCES `db_schemas` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_table_per_schema` ON `db_schema_tables` (`db_schema_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_dbtab_sid` ON `db_schema_tables` (`db_schema_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_schema_table_checks`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_schema_table_checks` ;

CREATE TABLE IF NOT EXISTS `db_schema_table_checks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_schema_table_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `expression_sql` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbchk_tid`
    FOREIGN KEY (`db_schema_table_id`)
    REFERENCES `db_schema_tables` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_chk_per_table` ON `db_schema_table_checks` (`db_schema_table_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_dbchk_tid` ON `db_schema_table_checks` (`db_schema_table_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_schema_table_columns`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_schema_table_columns` ;

CREATE TABLE IF NOT EXISTS `db_schema_table_columns` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_schema_table_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `data_type` VARCHAR(100) NOT NULL,
  `length_val` INT UNSIGNED NULL DEFAULT NULL,
  `precision_val` INT UNSIGNED NULL DEFAULT NULL,
  `scale_val` INT UNSIGNED NULL DEFAULT NULL,
  `default_expr` VARCHAR(255) NULL DEFAULT NULL,
  `is_not_null` TINYINT(1) NOT NULL DEFAULT '0',
  `is_auto_increment` TINYINT(1) NOT NULL DEFAULT '0',
  `is_primary_key` TINYINT(1) NOT NULL DEFAULT '0',
  `is_unique` TINYINT(1) NOT NULL DEFAULT '0',
  `is_unsigned` TINYINT(1) NOT NULL DEFAULT '0',
  `ref_table` VARCHAR(255) NULL DEFAULT NULL,
  `ref_columns` VARCHAR(255) NULL DEFAULT NULL,
  `ordinal_position` INT UNSIGNED NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbcol_tid`
    FOREIGN KEY (`db_schema_table_id`)
    REFERENCES `db_schema_tables` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_col_per_table` ON `db_schema_table_columns` (`db_schema_table_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_dbcol_tid` ON `db_schema_table_columns` (`db_schema_table_id` ASC) VISIBLE;

CREATE INDEX `idx_dbcol_ord` ON `db_schema_table_columns` (`db_schema_table_id` ASC, `ordinal_position` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_schema_table_foreign_keys`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_schema_table_foreign_keys` ;

CREATE TABLE IF NOT EXISTS `db_schema_table_foreign_keys` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_schema_table_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `columns_csv` VARCHAR(255) NOT NULL,
  `ref_table` VARCHAR(255) NOT NULL,
  `ref_columns_csv` VARCHAR(255) NOT NULL,
  `on_delete_action` VARCHAR(20) NOT NULL,
  `on_update_action` VARCHAR(20) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbfk_tid`
    FOREIGN KEY (`db_schema_table_id`)
    REFERENCES `db_schema_tables` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_fk_per_table` ON `db_schema_table_foreign_keys` (`db_schema_table_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_dbfk_tid` ON `db_schema_table_foreign_keys` (`db_schema_table_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_schema_table_indexes`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_schema_table_indexes` ;

CREATE TABLE IF NOT EXISTS `db_schema_table_indexes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_schema_table_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `columns_csv` VARCHAR(255) NOT NULL,
  `is_unique` TINYINT(1) NOT NULL DEFAULT '0',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbidx_tid`
    FOREIGN KEY (`db_schema_table_id`)
    REFERENCES `db_schema_tables` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_idx_per_table` ON `db_schema_table_indexes` (`db_schema_table_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_dbidx_tid` ON `db_schema_table_indexes` (`db_schema_table_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_schema_table_triggers`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_schema_table_triggers` ;

CREATE TABLE IF NOT EXISTS `db_schema_table_triggers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_schema_table_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `event_type` VARCHAR(20) NOT NULL,
  `timing` VARCHAR(20) NOT NULL,
  `statement_sql` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbtrg_tid`
    FOREIGN KEY (`db_schema_table_id`)
    REFERENCES `db_schema_tables` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_trg_per_table` ON `db_schema_table_triggers` (`db_schema_table_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_dbtrg_tid` ON `db_schema_table_triggers` (`db_schema_table_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_schema_views`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_schema_views` ;

CREATE TABLE IF NOT EXISTS `db_schema_views` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_schema_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `definition_sql` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbview_sid`
    FOREIGN KEY (`db_schema_id`)
    REFERENCES `db_schemas` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_view_per_schema` ON `db_schema_views` (`db_schema_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_dbview_sid` ON `db_schema_views` (`db_schema_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_table_rows`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_table_rows` ;

CREATE TABLE IF NOT EXISTS `db_table_rows` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_schema_table_id` BIGINT UNSIGNED NOT NULL,
  `data_json` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbrow_tid`
    FOREIGN KEY (`db_schema_table_id`)
    REFERENCES `db_schema_tables` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_dbrow_tid_created` ON `db_table_rows` (`db_schema_table_id` ASC, `created_at` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_user_activity`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_user_activity` ;

CREATE TABLE IF NOT EXISTS `db_user_activity` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_user_id` BIGINT UNSIGNED NOT NULL,
  `db_connection_id` BIGINT UNSIGNED NOT NULL,
  `activity_type` VARCHAR(100) NOT NULL,
  `activity_details` JSON NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbuact_conn`
    FOREIGN KEY (`db_connection_id`)
    REFERENCES `db_connections` (`id`),
  CONSTRAINT `fk_dbuact_user`
    FOREIGN KEY (`db_user_id`)
    REFERENCES `db_users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_dbuact_user` ON `db_user_activity` (`db_user_id` ASC) VISIBLE;

CREATE INDEX `idx_dbuact_conn_created` ON `db_user_activity` (`db_connection_id` ASC, `created_at` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `db_user_permissions`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `db_user_permissions` ;

CREATE TABLE IF NOT EXISTS `db_user_permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `db_user_id` BIGINT UNSIGNED NOT NULL,
  `db_connection_id` BIGINT UNSIGNED NOT NULL,
  `permission` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dbup_cid`
    FOREIGN KEY (`db_connection_id`)
    REFERENCES `db_connections` (`id`),
  CONSTRAINT `fk_dbup_uid`
    FOREIGN KEY (`db_user_id`)
    REFERENCES `db_users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_dbup` ON `db_user_permissions` (`db_user_id` ASC, `db_connection_id` ASC, `permission` ASC) VISIBLE;

CREATE INDEX `idx_dbup_cid` ON `db_user_permissions` (`db_connection_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `deployments`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `deployments` ;

CREATE TABLE IF NOT EXISTS `deployments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `environment_id` BIGINT UNSIGNED NOT NULL,
  `build_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('pending', 'running', 'succeeded', 'failed', 'canceled') NOT NULL DEFAULT 'pending',
  `started_at` TIMESTAMP NULL DEFAULT NULL,
  `finished_at` TIMESTAMP NULL DEFAULT NULL,
  `logs_url` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dep_build`
    FOREIGN KEY (`build_id`)
    REFERENCES `builds` (`id`),
  CONSTRAINT `fk_dep_env`
    FOREIGN KEY (`environment_id`)
    REFERENCES `environments` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_dep_env` ON `deployments` (`environment_id` ASC) VISIBLE;

CREATE INDEX `idx_dep_build` ON `deployments` (`build_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `env_vars`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `env_vars` ;

CREATE TABLE IF NOT EXISTS `env_vars` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `environment_id` BIGINT UNSIGNED NOT NULL,
  `key_name` VARCHAR(190) NOT NULL,
  `value_plain` TEXT NULL DEFAULT NULL,
  `secret_ref` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_envvar_env`
    FOREIGN KEY (`environment_id`)
    REFERENCES `environments` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_envvar` ON `env_vars` (`environment_id` ASC, `key_name` ASC) VISIBLE;

CREATE INDEX `idx_envvar_env` ON `env_vars` (`environment_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `feature_flags`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `feature_flags` ;

CREATE TABLE IF NOT EXISTS `feature_flags` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workspace_id` BIGINT UNSIGNED NOT NULL,
  `key_name` VARCHAR(100) NOT NULL,
  `enabled_default` TINYINT(1) NOT NULL DEFAULT '0',
  `rules_json` JSON NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ff_ws`
    FOREIGN KEY (`workspace_id`)
    REFERENCES `workspaces` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_ff` ON `feature_flags` (`workspace_id` ASC, `key_name` ASC) VISIBLE;

CREATE INDEX `idx_ff_ws` ON `feature_flags` (`workspace_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `plans`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `plans` ;

CREATE TABLE IF NOT EXISTS `plans` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key_name` VARCHAR(100) NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `price_cents` INT UNSIGNED NOT NULL DEFAULT '0',
  `currency` CHAR(3) NOT NULL DEFAULT 'USD',
  `meta_json` JSON NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_plan_key` ON `plans` (`key_name` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `subscriptions`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `subscriptions` ;

CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `business_account_id` BIGINT UNSIGNED NOT NULL,
  `plan_id` BIGINT UNSIGNED NOT NULL,
  `status` ENUM('trialing', 'active', 'past_due', 'canceled') NOT NULL DEFAULT 'active',
  `trial_end_at` TIMESTAMP NULL DEFAULT NULL,
  `renews_at` TIMESTAMP NULL DEFAULT NULL,
  `external_ref` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_sub_ba`
    FOREIGN KEY (`business_account_id`)
    REFERENCES `business_accounts` (`id`),
  CONSTRAINT `fk_sub_plan`
    FOREIGN KEY (`plan_id`)
    REFERENCES `plans` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_sub` ON `subscriptions` (`business_account_id` ASC, `plan_id` ASC, `status` ASC) VISIBLE;

CREATE INDEX `idx_sub_ba` ON `subscriptions` (`business_account_id` ASC) VISIBLE;

CREATE INDEX `fk_sub_plan` ON `subscriptions` (`plan_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `invoices`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `invoices` ;

CREATE TABLE IF NOT EXISTS `invoices` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `subscription_id` BIGINT UNSIGNED NOT NULL,
  `amount_cents` INT UNSIGNED NOT NULL,
  `currency` CHAR(3) NOT NULL,
  `due_at` TIMESTAMP NOT NULL,
  `paid_at` TIMESTAMP NULL DEFAULT NULL,
  `external_id` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_inv_sub`
    FOREIGN KEY (`subscription_id`)
    REFERENCES `subscriptions` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_inv_sub` ON `invoices` (`subscription_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `locales`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `locales` ;

CREATE TABLE IF NOT EXISTS `locales` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workspace_id` BIGINT UNSIGNED NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_loc_ws`
    FOREIGN KEY (`workspace_id`)
    REFERENCES `workspaces` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_locale` ON `locales` (`workspace_id` ASC, `code` ASC) VISIBLE;

CREATE INDEX `idx_loc_ws` ON `locales` (`workspace_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `meta_registry`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `meta_registry` ;

CREATE TABLE IF NOT EXISTS `meta_registry` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workspace_id` BIGINT UNSIGNED NOT NULL,
  `object_type` VARCHAR(40) NOT NULL,
  `object_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_mr_ws`
    FOREIGN KEY (`workspace_id`)
    REFERENCES `workspaces` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_mr_ws` ON `meta_registry` (`workspace_id` ASC) VISIBLE;

CREATE INDEX `idx_mr_type_obj` ON `meta_registry` (`object_type` ASC, `object_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `notification_templates`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `notification_templates` ;

CREATE TABLE IF NOT EXISTS `notification_templates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workspace_id` BIGINT UNSIGNED NOT NULL,
  `key_name` VARCHAR(190) NOT NULL,
  `channel` ENUM('email', 'sms', 'inapp', 'webhook') NOT NULL,
  `subject` VARCHAR(255) NULL DEFAULT NULL,
  `body_markdown` LONGTEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_nt_ws`
    FOREIGN KEY (`workspace_id`)
    REFERENCES `workspaces` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_nt_key` ON `notification_templates` (`workspace_id` ASC, `key_name` ASC) VISIBLE;

CREATE INDEX `idx_nt_ws` ON `notification_templates` (`workspace_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `notification_events`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `notification_events` ;

CREATE TABLE IF NOT EXISTS `notification_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `template_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `channel` ENUM('email', 'sms', 'inapp', 'webhook') NOT NULL,
  `payload_json` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ne_proj`
    FOREIGN KEY (`project_id`)
    REFERENCES `projects` (`id`),
  CONSTRAINT `fk_ne_tpl`
    FOREIGN KEY (`template_id`)
    REFERENCES `notification_templates` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_ne_proj` ON `notification_events` (`project_id` ASC) VISIBLE;

CREATE INDEX `idx_ne_tpl` ON `notification_events` (`template_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `notification_deliveries`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `notification_deliveries` ;

CREATE TABLE IF NOT EXISTS `notification_deliveries` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `event_id` BIGINT UNSIGNED NOT NULL,
  `to_address` VARCHAR(255) NULL DEFAULT NULL,
  `status` ENUM('queued', 'sent', 'failed') NOT NULL DEFAULT 'queued',
  `provider` VARCHAR(100) NULL DEFAULT NULL,
  `provider_ref` VARCHAR(255) NULL DEFAULT NULL,
  `error_message` TEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_nd_event`
    FOREIGN KEY (`event_id`)
    REFERENCES `notification_events` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_nd_event` ON `notification_deliveries` (`event_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `permissions`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `permissions` ;

CREATE TABLE IF NOT EXISTS `permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key_name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL DEFAULT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_perm_key` ON `permissions` (`key_name` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `project_members`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `project_members` ;

CREATE TABLE IF NOT EXISTS `project_members` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_pm_pid`
    FOREIGN KEY (`project_id`)
    REFERENCES `projects` (`id`),
  CONSTRAINT `fk_pm_uid`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_project_member` ON `project_members` (`project_id` ASC, `user_id` ASC) VISIBLE;

CREATE INDEX `idx_pm_uid` ON `project_members` (`user_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `resource_acl`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `resource_acl` ;

CREATE TABLE IF NOT EXISTS `resource_acl` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `resource_type` VARCHAR(50) NOT NULL,
  `resource_id` BIGINT UNSIGNED NOT NULL,
  `subject_type` ENUM('user', 'role') NOT NULL,
  `subject_id` BIGINT UNSIGNED NOT NULL,
  `permission_key` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_acl` ON `resource_acl` (`resource_type` ASC, `resource_id` ASC, `subject_type` ASC, `subject_id` ASC, `permission_key` ASC) VISIBLE;

CREATE INDEX `idx_acl_resource` ON `resource_acl` (`resource_type` ASC, `resource_id` ASC) VISIBLE;

CREATE INDEX `idx_acl_subject` ON `resource_acl` (`subject_type` ASC, `subject_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `roles`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `roles` ;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workspace_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_roles_ws`
    FOREIGN KEY (`workspace_id`)
    REFERENCES `workspaces` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_role_name` ON `roles` (`workspace_id` ASC, `name` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `role_permissions`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `role_permissions` ;

CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_id` BIGINT UNSIGNED NOT NULL,
  `permission_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_rp_perm`
    FOREIGN KEY (`permission_id`)
    REFERENCES `permissions` (`id`),
  CONSTRAINT `fk_rp_role`
    FOREIGN KEY (`role_id`)
    REFERENCES `roles` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_role_perm` ON `role_permissions` (`role_id` ASC, `permission_id` ASC) VISIBLE;

CREATE INDEX `idx_rp_role` ON `role_permissions` (`role_id` ASC) VISIBLE;

CREATE INDEX `fk_rp_perm` ON `role_permissions` (`permission_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `saved_views`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `saved_views` ;

CREATE TABLE IF NOT EXISTS `saved_views` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `config_json` LONGTEXT NOT NULL,
  `created_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_sv_proj`
    FOREIGN KEY (`project_id`)
    REFERENCES `projects` (`id`),
  CONSTRAINT `fk_sv_user`
    FOREIGN KEY (`created_by`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_saved_view` ON `saved_views` (`project_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_sv_proj` ON `saved_views` (`project_id` ASC) VISIBLE;

CREATE INDEX `fk_sv_user` ON `saved_views` (`created_by` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `secrets`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `secrets` ;

CREATE TABLE IF NOT EXISTS `secrets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scope_type` ENUM('workspace', 'project', 'connection', 'user', 'global') NOT NULL,
  `scope_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `ciphertext` VARBINARY(4096) NOT NULL,
  `created_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_secret_user`
    FOREIGN KEY (`created_by`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_secret` ON `secrets` (`scope_type` ASC, `scope_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_secret_scope` ON `secrets` (`scope_type` ASC, `scope_id` ASC) VISIBLE;

CREATE INDEX `fk_secret_user` ON `secrets` (`created_by` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `storage_buckets`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `storage_buckets` ;

CREATE TABLE IF NOT EXISTS `storage_buckets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workspace_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `provider` ENUM('local', 's3', 'gcs', 'azure') NOT NULL DEFAULT 'local',
  `config_json` LONGTEXT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_bucket_ws`
    FOREIGN KEY (`workspace_id`)
    REFERENCES `workspaces` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_bucket` ON `storage_buckets` (`workspace_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_bucket_ws` ON `storage_buckets` (`workspace_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `storage_objects`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `storage_objects` ;

CREATE TABLE IF NOT EXISTS `storage_objects` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `bucket_id` BIGINT UNSIGNED NOT NULL,
  `key_name` VARCHAR(255) NOT NULL,
  `content_type` VARCHAR(190) NULL DEFAULT NULL,
  `size_bytes` BIGINT UNSIGNED NULL DEFAULT NULL,
  `checksum` VARBINARY(64) NULL DEFAULT NULL,
  `created_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_obj_bucket`
    FOREIGN KEY (`bucket_id`)
    REFERENCES `storage_buckets` (`id`),
  CONSTRAINT `fk_obj_user`
    FOREIGN KEY (`created_by`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_object` ON `storage_objects` (`bucket_id` ASC, `key_name` ASC) VISIBLE;

CREATE INDEX `idx_obj_bucket` ON `storage_objects` (`bucket_id` ASC) VISIBLE;

CREATE INDEX `fk_obj_user` ON `storage_objects` (`created_by` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `tasks`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `tasks` ;

CREATE TABLE IF NOT EXISTS `tasks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `parent_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `assignee_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `due_date` DATETIME NULL DEFAULT NULL,
  `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'low',
  `status` ENUM('todo', 'in_progress', 'blocked', 'done', 'archived') NOT NULL DEFAULT 'todo',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tasks_aid`
    FOREIGN KEY (`assignee_id`)
    REFERENCES `users` (`id`),
  CONSTRAINT `fk_tasks_parent`
    FOREIGN KEY (`parent_id`)
    REFERENCES `tasks` (`id`),
  CONSTRAINT `fk_tasks_pid`
    FOREIGN KEY (`project_id`)
    REFERENCES `projects` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_tasks_project` ON `tasks` (`project_id` ASC) VISIBLE;

CREATE INDEX `idx_tasks_parent` ON `tasks` (`parent_id` ASC) VISIBLE;

CREATE INDEX `idx_tasks_status_priority` ON `tasks` (`status` ASC, `priority` ASC) VISIBLE;

CREATE INDEX `idx_tasks_assignee` ON `tasks` (`assignee_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `task_attachments`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `task_attachments` ;

CREATE TABLE IF NOT EXISTS `task_attachments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `task_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tatt_tid`
    FOREIGN KEY (`task_id`)
    REFERENCES `tasks` (`id`),
  CONSTRAINT `fk_tatt_uid`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_tatt_tid` ON `task_attachments` (`task_id` ASC) VISIBLE;

CREATE INDEX `idx_tatt_uid` ON `task_attachments` (`user_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `task_comments`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `task_comments` ;

CREATE TABLE IF NOT EXISTS `task_comments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `task_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `comment` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tcom_tid`
    FOREIGN KEY (`task_id`)
    REFERENCES `tasks` (`id`),
  CONSTRAINT `fk_tcom_uid`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_tcom_tid` ON `task_comments` (`task_id` ASC) VISIBLE;

CREATE INDEX `idx_tcom_uid` ON `task_comments` (`user_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `translations`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `translations` ;

CREATE TABLE IF NOT EXISTS `translations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workspace_id` BIGINT UNSIGNED NOT NULL,
  `locale_id` BIGINT UNSIGNED NOT NULL,
  `namespace` VARCHAR(100) NOT NULL,
  `key_name` VARCHAR(255) NOT NULL,
  `value_text` LONGTEXT NOT NULL,
  `updated_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tr_loc`
    FOREIGN KEY (`locale_id`)
    REFERENCES `locales` (`id`),
  CONSTRAINT `fk_tr_user`
    FOREIGN KEY (`updated_by`)
    REFERENCES `users` (`id`),
  CONSTRAINT `fk_tr_ws`
    FOREIGN KEY (`workspace_id`)
    REFERENCES `workspaces` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_tr` ON `translations` (`workspace_id` ASC, `locale_id` ASC, `namespace` ASC, `key_name` ASC) VISIBLE;

CREATE INDEX `idx_tr_loc` ON `translations` (`locale_id` ASC) VISIBLE;

CREATE INDEX `fk_tr_user` ON `translations` (`updated_by` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `ui_assets`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `ui_assets` ;

CREATE TABLE IF NOT EXISTS `ui_assets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `kind` ENUM('image', 'font', 'icon', 'file', 'svg') NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `storage_key` VARCHAR(255) NOT NULL,
  `content_type` VARCHAR(190) NULL DEFAULT NULL,
  `size_bytes` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ui_assets_proj`
    FOREIGN KEY (`project_id`)
    REFERENCES `projects` (`id`),
  CONSTRAINT `fk_ui_assets_user`
    FOREIGN KEY (`created_by`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_ui_assets_proj` ON `ui_assets` (`project_id` ASC) VISIBLE;

CREATE INDEX `fk_ui_assets_user` ON `ui_assets` (`created_by` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `ui_components_library`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `ui_components_library` ;

CREATE TABLE IF NOT EXISTS `ui_components_library` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `definition_json` LONGTEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ui_clib_proj`
    FOREIGN KEY (`project_id`)
    REFERENCES `projects` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_ui_clib` ON `ui_components_library` (`project_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_ui_clib_proj` ON `ui_components_library` (`project_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `ui_pages`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `ui_pages` ;

CREATE TABLE IF NOT EXISTS `ui_pages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `route_path` VARCHAR(255) NOT NULL,
  `is_home` TINYINT(1) NOT NULL DEFAULT '0',
  `created_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ui_pages_proj`
    FOREIGN KEY (`project_id`)
    REFERENCES `projects` (`id`),
  CONSTRAINT `fk_ui_pages_user`
    FOREIGN KEY (`created_by`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_ui_route` ON `ui_pages` (`project_id` ASC, `route_path` ASC) VISIBLE;

CREATE INDEX `idx_ui_pages_proj` ON `ui_pages` (`project_id` ASC) VISIBLE;

CREATE INDEX `fk_ui_pages_user` ON `ui_pages` (`created_by` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `ui_page_versions`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `ui_page_versions` ;

CREATE TABLE IF NOT EXISTS `ui_page_versions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `page_id` BIGINT UNSIGNED NOT NULL,
  `version` INT UNSIGNED NOT NULL,
  `tree_json` LONGTEXT NOT NULL,
  `notes` VARCHAR(255) NULL DEFAULT NULL,
  `created_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ui_pv_page`
    FOREIGN KEY (`page_id`)
    REFERENCES `ui_pages` (`id`),
  CONSTRAINT `fk_ui_pv_user`
    FOREIGN KEY (`created_by`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_ui_page_ver` ON `ui_page_versions` (`page_id` ASC, `version` ASC) VISIBLE;

CREATE INDEX `idx_ui_pv_page` ON `ui_page_versions` (`page_id` ASC) VISIBLE;

CREATE INDEX `fk_ui_pv_user` ON `ui_page_versions` (`created_by` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `usage_records`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `usage_records` ;

CREATE TABLE IF NOT EXISTS `usage_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `subscription_id` BIGINT UNSIGNED NOT NULL,
  `metric_key` VARCHAR(100) NOT NULL,
  `quantity` BIGINT UNSIGNED NOT NULL,
  `period_start` TIMESTAMP NOT NULL,
  `period_end` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_usage_sub`
    FOREIGN KEY (`subscription_id`)
    REFERENCES `subscriptions` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_usage_sub` ON `usage_records` (`subscription_id` ASC, `metric_key` ASC, `period_start` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `user_profiles`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `user_profiles` ;

CREATE TABLE IF NOT EXISTS `user_profiles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `prefix` VARCHAR(10) NULL DEFAULT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `middle_name` VARCHAR(100) NULL DEFAULT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `bio` TEXT NULL DEFAULT NULL,
  `avatar_url` VARCHAR(255) NULL DEFAULT NULL,
  `email` VARCHAR(190) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_user_profiles_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_user_profiles_user` ON `user_profiles` (`user_id` ASC) VISIBLE;

CREATE UNIQUE INDEX `uq_user_profiles_email` ON `user_profiles` (`email` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `user_roles`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `user_roles` ;

CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `role` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ur_uid`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_user_role` ON `user_roles` (`user_id` ASC, `role` ASC) VISIBLE;

CREATE INDEX `idx_ur_uid` ON `user_roles` (`user_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `user_sessions`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `user_sessions` ;

CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `session_token` CHAR(64) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_usess_uid`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_session_token` ON `user_sessions` (`session_token` ASC) VISIBLE;

CREATE INDEX `idx_usess_uid` ON `user_sessions` (`user_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `user_verifications`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `user_verifications` ;

CREATE TABLE IF NOT EXISTS `user_verifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `identifier` VARCHAR(190) NOT NULL,
  `token_hash` VARBINARY(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_usver_uid`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_verification_identifier` ON `user_verifications` (`identifier` ASC) VISIBLE;

CREATE INDEX `idx_usver_uid` ON `user_verifications` (`user_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `workflows`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `workflows` ;

CREATE TABLE IF NOT EXISTS `workflows` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `project_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(190) NOT NULL,
  `description` TEXT NULL DEFAULT NULL,
  `is_enabled` TINYINT(1) NOT NULL DEFAULT '1',
  `created_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_wf_proj`
    FOREIGN KEY (`project_id`)
    REFERENCES `projects` (`id`),
  CONSTRAINT `fk_wf_user`
    FOREIGN KEY (`created_by`)
    REFERENCES `users` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_wf_name` ON `workflows` (`project_id` ASC, `name` ASC) VISIBLE;

CREATE INDEX `idx_wf_proj` ON `workflows` (`project_id` ASC) VISIBLE;

CREATE INDEX `fk_wf_user` ON `workflows` (`created_by` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `workflow_runs`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `workflow_runs` ;

CREATE TABLE IF NOT EXISTS `workflow_runs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workflow_id` BIGINT UNSIGNED NOT NULL,
  `version` INT UNSIGNED NOT NULL,
  `status` ENUM('queued', 'running', 'succeeded', 'failed', 'canceled') NOT NULL DEFAULT 'queued',
  `trigger_kind` ENUM('event', 'schedule', 'webhook', 'manual') NOT NULL,
  `trigger_payload_json` LONGTEXT NULL DEFAULT NULL,
  `started_at` TIMESTAMP NULL DEFAULT NULL,
  `finished_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_wfr_wf`
    FOREIGN KEY (`workflow_id`)
    REFERENCES `workflows` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_wfr_wf` ON `workflow_runs` (`workflow_id` ASC, `created_at` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `workflow_run_nodes`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `workflow_run_nodes` ;

CREATE TABLE IF NOT EXISTS `workflow_run_nodes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `run_id` BIGINT UNSIGNED NOT NULL,
  `node_id` VARCHAR(190) NOT NULL,
  `node_type` VARCHAR(100) NOT NULL,
  `status` ENUM('pending', 'running', 'succeeded', 'failed', 'skipped') NOT NULL DEFAULT 'pending',
  `started_at` TIMESTAMP NULL DEFAULT NULL,
  `finished_at` TIMESTAMP NULL DEFAULT NULL,
  `output_json` LONGTEXT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_wfrn_run`
    FOREIGN KEY (`run_id`)
    REFERENCES `workflow_runs` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_wfrn_run` ON `workflow_run_nodes` (`run_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `workflow_triggers`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `workflow_triggers` ;

CREATE TABLE IF NOT EXISTS `workflow_triggers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workflow_id` BIGINT UNSIGNED NOT NULL,
  `kind` ENUM('event', 'schedule', 'webhook', 'db_change') NOT NULL,
  `config_json` LONGTEXT NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_wft_wf`
    FOREIGN KEY (`workflow_id`)
    REFERENCES `workflows` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX `idx_wft_wf` ON `workflow_triggers` (`workflow_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `workflow_versions`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `workflow_versions` ;

CREATE TABLE IF NOT EXISTS `workflow_versions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workflow_id` BIGINT UNSIGNED NOT NULL,
  `version` INT UNSIGNED NOT NULL,
  `graph_json` LONGTEXT NOT NULL,
  `created_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_wfv_user`
    FOREIGN KEY (`created_by`)
    REFERENCES `users` (`id`),
  CONSTRAINT `fk_wfv_wf`
    FOREIGN KEY (`workflow_id`)
    REFERENCES `workflows` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_wf_ver` ON `workflow_versions` (`workflow_id` ASC, `version` ASC) VISIBLE;

CREATE INDEX `idx_wfv_wf` ON `workflow_versions` (`workflow_id` ASC) VISIBLE;

CREATE INDEX `fk_wfv_user` ON `workflow_versions` (`created_by` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `workflow_webhooks`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `workflow_webhooks` ;

CREATE TABLE IF NOT EXISTS `workflow_webhooks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workflow_id` BIGINT UNSIGNED NOT NULL,
  `secret_ref` VARCHAR(255) NULL DEFAULT NULL,
  `last_used_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_wfh_wf`
    FOREIGN KEY (`workflow_id`)
    REFERENCES `workflows` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_wf_webhook` ON `workflow_webhooks` (`workflow_id` ASC) VISIBLE;


-- -----------------------------------------------------
-- Table `workspace_members`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `workspace_members` ;

CREATE TABLE IF NOT EXISTS `workspace_members` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `workspace_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `role` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_wsmem_uid`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`),
  CONSTRAINT `fk_wsmem_wsid`
    FOREIGN KEY (`workspace_id`)
    REFERENCES `workspaces` (`id`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE UNIQUE INDEX `uq_workspace_member` ON `workspace_members` (`workspace_id` ASC, `user_id` ASC) VISIBLE;

CREATE INDEX `idx_wsmem_uid` ON `workspace_members` (`user_id` ASC) VISIBLE;

-- add password_hash to users if missing
ALTER TABLE users
  ADD COLUMN password_hash varchar(255) NULL AFTER username;

-- sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id          char(64)     NOT NULL PRIMARY KEY,      -- hex token
  user_id     bigint       NOT NULL,
  created_at  timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  timestamp    NOT NULL,
  ip          varchar(64)  NULL,
  user_agent  varchar(255) NULL,
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_exp (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
