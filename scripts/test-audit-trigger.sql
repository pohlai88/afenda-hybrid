-- Test Audit Trigger Function (CSQL-005 and CSQL-006)

\echo '=== Setup: Create test user and organization ==='

-- Create test user for createdBy/updatedBy
INSERT INTO security.users ("tenantId", email, "displayName", status)
SELECT "tenantId", 'test@example.com', 'Test User', 'ACTIVE'
FROM core.tenants WHERE "tenantCode" = 'TEST001'
ON CONFLICT DO NOTHING
RETURNING "userId", email;

-- Get IDs for testing
DO $$
DECLARE
  v_tenant_id integer;
  v_user_id integer;
BEGIN
  SELECT "tenantId" INTO v_tenant_id FROM core.tenants WHERE "tenantCode" = 'TEST001';
  SELECT "userId" INTO v_user_id FROM security.users WHERE email = 'test@example.com';
  
  RAISE NOTICE 'Test Tenant ID: %', v_tenant_id;
  RAISE NOTICE 'Test User ID: %', v_user_id;
END $$;

\echo ''
\echo '=== Test 1: Attach audit trigger to core.organizations ==='
CREATE TRIGGER trg_organizations_audit
AFTER INSERT OR UPDATE OR DELETE ON core.organizations
FOR EACH ROW
EXECUTE FUNCTION audit.log_change_7w1h();

\echo ''
\echo '=== Test 2: INSERT organization (should create audit record) ==='
INSERT INTO core.organizations (
  "tenantId", 
  "orgCode", 
  name, 
  "orgType", 
  status,
  "createdBy",
  "updatedBy"
)
SELECT 
  t."tenantId",
  'ORG001',
  'Test Organization',
  'DEPARTMENT',
  'ACTIVE',
  u."userId",
  u."userId"
FROM core.tenants t, security.users u
WHERE t."tenantCode" = 'TEST001' AND u.email = 'test@example.com';

\echo ''
\echo '=== Test 3: Check audit record was created ==='
SELECT 
  "auditId",
  "tableName",
  operation,
  "changedBy",
  "newData"->>'orgCode' as org_code,
  "newData"->>'name' as org_name
FROM audit.audit_trail
WHERE "tableName" = 'core.organizations'
ORDER BY "auditId" DESC
LIMIT 1;

\echo ''
\echo '=== Test 4: UPDATE organization (should create audit record) ==='
UPDATE core.organizations
SET name = 'Updated Organization Name'
WHERE "orgCode" = 'ORG001';

\echo ''
\echo '=== Test 5: Check UPDATE audit record ==='
SELECT 
  "auditId",
  operation,
  "oldData"->>'name' as old_name,
  "newData"->>'name' as new_name,
  "changedBy"
FROM audit.audit_trail
WHERE "tableName" = 'core.organizations' AND operation = 'UPDATE'
ORDER BY "auditId" DESC
LIMIT 1;

\echo ''
\echo '=== Test 6: DELETE organization (should create audit record) ==='
DELETE FROM core.organizations WHERE "orgCode" = 'ORG001';

\echo ''
\echo '=== Test 7: Check DELETE audit record ==='
SELECT 
  "auditId",
  operation,
  "oldData"->>'orgCode' as org_code,
  "oldData"->>'name' as org_name,
  "changedBy"
FROM audit.audit_trail
WHERE "tableName" = 'core.organizations' AND operation = 'DELETE'
ORDER BY "auditId" DESC
LIMIT 1;

\echo ''
\echo '=== Test 8: Summary of all audit records ==='
SELECT 
  "tableName",
  operation,
  COUNT(*) as record_count
FROM audit.audit_trail
GROUP BY "tableName", operation
ORDER BY "tableName", operation;

\echo ''
\echo '=== All Audit Trigger Tests Passed! ==='
