-- NuBlox Studio – Dev Seed (MySQL 8+)
-- Run AFTER your schema is created and USE nublox_studio

SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='STRICT_ALL_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';
SET @OLD_FK=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;

USE `nublox_studio`;

START TRANSACTION;

-- ------------------------------------------------------------------
-- 1) Users
-- ------------------------------------------------------------------
INSERT INTO users (username, status) VALUES ('admin', 'active');
SET @admin_id := LAST_INSERT_ID();

INSERT INTO users (username, status) VALUES ('demo', 'active');
SET @demo_id := LAST_INSERT_ID();

-- Optional profiles (adjust emails as you like)
INSERT INTO user_profiles (user_id, first_name, last_name, email)
VALUES
  (@admin_id, 'Admin', 'User', 'admin@example.com'),
  (@demo_id,  'Demo',  'User', 'demo@example.com');

-- ------------------------------------------------------------------
-- 2) Credentials (scrypt: n=16384, r=8, p=1, dklen=64)
-- Passwords:
--   admin → 'admin123!'
--   demo  → 'demo1234!'
--
-- NOTE: Values below are precomputed scrypt(password, salt):
--       Inserted as VARBINARY via X'<hex>'
-- ------------------------------------------------------------------
-- admin
INSERT INTO credentials
(user_id, credential_type, credential_value_hash, salt)
VALUES
(
  @admin_id,
  'password',
  X'fd7af44d9373e2c802ba5fb46c1ea23a777fa4a09584c48d76b80bc3986085a6859ea2d1bc2c6e069f8f65242021ae471d1951e3cbf55ab83c1eec49142a192a',
  X'd53e0b5996876196bcbe495243ac46e3'
);

-- demo
INSERT INTO credentials
(user_id, credential_type, credential_value_hash, salt)
VALUES
(
  @demo_id,
  'password',
  X'c0a0151ad4e7ea41e49516766b1bb10aaaa51833da28bf3d8fab04d9e357c354631428034dae7f085be63f38f165ae8f8608caebe070266089f128d456d2bf76',
  X'46b430f5b09a4c19d6ab49ebd6022ca2'
);

-- ------------------------------------------------------------------
-- 3) (Optional) Immediate sessions so you can log in without registering
--    Tokens are 64-char hex (32 bytes). Expires 30 days from now.
-- ------------------------------------------------------------------
INSERT INTO user_sessions (user_id, session_token, expires_at)
VALUES
(@admin_id, 'f42da391cb347c9cf0e41de2143508fc8f140e8636d174b7ab4175bd34bc9f9d', DATE_ADD(NOW(), INTERVAL 30 DAY)),
(@demo_id,  '452e4d6f98140b944a8c26617b4650e48327a0fcaa07fe876cd79ff89104be57', DATE_ADD(NOW(), INTERVAL 30 DAY));

-- ------------------------------------------------------------------
-- 4) Plans (so subscriptions can exist)
-- ------------------------------------------------------------------
INSERT INTO plans (key_name, name, price_cents, currency, meta_json)
VALUES
('free', 'Free', 0, 'USD', JSON_OBJECT('limits', JSON_OBJECT('environments', 2, 'apiRequests', 10000))),
('pro',  'Pro',  2900, 'USD', JSON_OBJECT('limits', JSON_OBJECT('environments', 5, 'apiRequests', 500000)));

-- ------------------------------------------------------------------
-- 5) Business account for admin + subscription (free)
-- ------------------------------------------------------------------
INSERT INTO business_accounts
(owner_user_id, name, tax_id, address_line1, city, postal_code, country_code, currency_code, vat_exempt, contact_email, payment_provider, payment_provider_id)
VALUES
(@admin_id, 'Admin Co', NULL, '123 Demo St', 'London', 'N1 1AA', 'GB', 'USD', 0, 'billing@example.com', 'none', 'dev-local');

SET @ba_id := LAST_INSERT_ID();

INSERT INTO subscriptions (business_account_id, plan_id, status)
SELECT @ba_id, p.id, 'active' FROM plans p WHERE p.key_name='free' LIMIT 1;

-- ------------------------------------------------------------------
-- 6) Workspace, roles, permissions, memberships
-- ------------------------------------------------------------------
INSERT INTO workspaces (owner_id, name, slug, tier, business_account_id)
VALUES (@admin_id, 'Admin Workspace', 'admin', 'free', @ba_id);
SET @ws_id := LAST_INSERT_ID();

-- Roles & permissions
INSERT INTO permissions (key_name, description)
VALUES
('workspace.admin', 'Manage workspace settings'),
('project.read',    'Read project resources'),
('project.write',   'Write project resources'),
('api.manage',      'Manage API endpoints and keys')
ON DUPLICATE KEY UPDATE description=VALUES(description);

INSERT INTO roles (workspace_id, name) VALUES
(@ws_id, 'Owner'), (@ws_id, 'Editor'), (@ws_id, 'Viewer');

-- Map role -> permissions
-- Owner: all
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.workspace_id=@ws_id AND r.name='Owner';

-- Editor: project.read, project.write
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.key_name IN ('project.read','project.write')
WHERE r.workspace_id=@ws_id AND r.name='Editor';

-- Viewer: project.read
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.key_name='project.read'
WHERE r.workspace_id=@ws_id AND r.name='Viewer';

-- Members (admin=owner, demo=viewer)
INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES
(@ws_id, @admin_id, 'owner'),
(@ws_id, @demo_id,  'viewer');

-- ------------------------------------------------------------------
-- 7) Project + environments
-- ------------------------------------------------------------------
INSERT INTO projects (workspace_id, name, slug) VALUES
(@ws_id, 'Default Project', 'default');
SET @prj_id := LAST_INSERT_ID();

INSERT INTO project_members (project_id, user_id) VALUES
(@prj_id, @admin_id),
(@prj_id, @demo_id);

INSERT INTO environments (project_id, name, slug, kind)
VALUES
(@prj_id, 'Development', 'dev',  'dev'),
(@prj_id, 'Production',  'prod', 'prod');

-- ------------------------------------------------------------------
-- 8) Locales, feature flags (examples)
-- ------------------------------------------------------------------
INSERT INTO locales (workspace_id, code, name) VALUES
(@ws_id, 'en-US', 'English (US)')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO feature_flags (workspace_id, key_name, enabled_default, rules_json)
VALUES
(@ws_id, 'ui-builder', 1, NULL),
(@ws_id, 'api-studio', 1, NULL)
ON DUPLICATE KEY UPDATE enabled_default=VALUES(enabled_default), rules_json=VALUES(rules_json);

-- ------------------------------------------------------------------
-- 9) UI: a Home page with a minimal tree
-- ------------------------------------------------------------------
INSERT INTO ui_pages (project_id, name, route_path, is_home, created_by)
VALUES (@prj_id, 'Home', '/', 1, @admin_id);
SET @page_id := LAST_INSERT_ID();

INSERT INTO ui_page_versions (page_id, version, tree_json, notes, created_by)
VALUES
(
  @page_id,
  1,
  JSON_OBJECT(
    'id', 'root',
    'tag', 'div',
    'props', JSON_OBJECT('class','container','style','padding:24px'),
    'children', JSON_ARRAY(
      JSON_OBJECT('id','h','tag','h1','props',JSON_OBJECT('textContent','Welcome to NuBlox')),
      JSON_OBJECT('id','p','tag','p','props',JSON_OBJECT('textContent','This is your seeded project.'))
    )
  ),
  'Initial version',
  @admin_id
);

-- ------------------------------------------------------------------
-- 10) API Studio: collection + hello endpoint (+ open policy)
-- ------------------------------------------------------------------
INSERT INTO api_collections (project_id, name, description)
VALUES (@prj_id, 'Default', 'Default collection for your project');
SET @api_coll_id := LAST_INSERT_ID();

INSERT INTO api_endpoints (project_id, collection_id, method, path, handler_type, config_json, version)
VALUES
(
  @prj_id, @api_coll_id, 'GET', '/health', 'custom',
  JSON_OBJECT('type','static','status',200,'body',JSON_OBJECT('ok',true,'service','nublox')),
  1
);
SET @ep_id := LAST_INSERT_ID();

INSERT INTO api_policies (endpoint_id, auth_required, role_requirements, rate_limit_per_min, cors_json)
VALUES
(@ep_id, 0, NULL, 600, JSON_OBJECT('origins', JSON_ARRAY('*'), 'methods', JSON_ARRAY('GET')));

-- ------------------------------------------------------------------
-- 11) A sample workflow (and version)
-- ------------------------------------------------------------------
INSERT INTO workflows (project_id, name, description, is_enabled, created_by)
VALUES (@prj_id, 'Hello World', 'Demo workflow', 1, @admin_id);
SET @wf_id := LAST_INSERT_ID();

INSERT INTO workflow_versions (workflow_id, version, graph_json, created_by)
VALUES
(
  @wf_id, 1,
  JSON_OBJECT(
    'nodes', JSON_ARRAY(
      JSON_OBJECT('id','start','type','start'),
      JSON_OBJECT('id','log','type','log','params',JSON_OBJECT('message','Hello from workflow!'))
    ),
    'edges', JSON_ARRAY(
      JSON_OBJECT('from','start','to','log')
    )
  ),
  @admin_id
);

COMMIT;

SET FOREIGN_KEY_CHECKS=@OLD_FK;
SET SQL_MODE=@OLD_SQL_MODE;
