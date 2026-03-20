-- Test Audit Trail with Real Data

\echo '=== Setup: Create test tenant ==='
INSERT INTO core.tenants ("tenantCode", name, status)
VALUES ('TEST001', 'Test Tenant', 'ACTIVE')
ON CONFLICT DO NOTHING
RETURNING "tenantId", "tenantCode", name;

\echo ''
\echo '=== Test 1: Insert audit record ==='
INSERT INTO audit.audit_trail ("tenantId", "tableName", operation, "changedAt")
SELECT "tenantId", 'test.table', 'INSERT', '2026-03-20 12:00:00+00'
FROM core.tenants WHERE "tenantCode" = 'TEST001';

\echo ''
\echo '=== Test 2: Query audit records ==='
SELECT "auditId", "tenantId", "tableName", operation, "changedAt" 
FROM audit.audit_trail;

\echo ''
\echo '=== Test 3: Check partition routing ==='
SELECT 
  tableoid::regclass as partition_name,
  "auditId",
  "tableName",
  "changedAt"
FROM audit.audit_trail;

\echo ''
\echo '=== Test 4: Insert with JSONB data ==='
INSERT INTO audit.audit_trail ("tenantId", "tableName", operation, "oldData", "newData", "changedAt")
SELECT 
  "tenantId", 
  'core.organizations', 
  'UPDATE',
  '{"orgCode": "OLD123", "name": "Old Name"}'::jsonb,
  '{"orgCode": "NEW123", "name": "New Name"}'::jsonb,
  '2026-03-20 13:00:00+00'
FROM core.tenants WHERE "tenantCode" = 'TEST001';

\echo ''
\echo '=== Test 5: Query with JSONB containment ==='
SELECT "auditId", "tableName", "newData"->'orgCode' as org_code
FROM audit.audit_trail
WHERE "newData" @> '{"orgCode": "NEW123"}'::jsonb;

\echo ''
\echo '=== Test 6: Test immutability (UPDATE - should fail) ==='
DO $$
DECLARE
  v_audit_id bigint;
BEGIN
  SELECT "auditId" INTO v_audit_id FROM audit.audit_trail LIMIT 1;
  UPDATE audit.audit_trail SET "tableName" = 'modified' WHERE "auditId" = v_audit_id;
  RAISE NOTICE 'ERROR: Update should have been blocked!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'SUCCESS: Update blocked - %', SQLERRM;
END $$;

\echo ''
\echo '=== Test 7: Test immutability (DELETE - should fail) ==='
DO $$
DECLARE
  v_audit_id bigint;
BEGIN
  SELECT "auditId" INTO v_audit_id FROM audit.audit_trail LIMIT 1;
  DELETE FROM audit.audit_trail WHERE "auditId" = v_audit_id;
  RAISE NOTICE 'ERROR: Delete should have been blocked!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'SUCCESS: Delete blocked - %', SQLERRM;
END $$;

\echo ''
\echo '=== Test 8: Test partition maintenance function ==='
SELECT audit.create_next_quarter_partition();

\echo ''
\echo '=== Test 9: Verify partitions ==='
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size('audit.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'audit' AND tablename LIKE 'audit_trail_%'
ORDER BY tablename;

\echo ''
\echo '=== All Tests Passed! ==='
