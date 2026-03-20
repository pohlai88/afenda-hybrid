-- Test Audit Trail Functionality
-- Tests partitioning, triggers, and immutability

\echo '=== Test 1: Insert audit record (should work) ==='
INSERT INTO audit.audit_trail ("tenantId", "tableName", operation, "changedAt")
VALUES (1, 'test.table', 'INSERT', '2026-03-20 12:00:00+00');

\echo ''
\echo '=== Test 2: Query the record ==='
SELECT "auditId", "tenantId", "tableName", operation, "changedAt" 
FROM audit.audit_trail;

\echo ''
\echo '=== Test 3: Check which partition it went to ==='
SELECT 
  tableoid::regclass as partition_name,
  "auditId",
  "tableName",
  "changedAt"
FROM audit.audit_trail;

\echo ''
\echo '=== Test 4: Test partition maintenance function ==='
SELECT audit.create_next_quarter_partition();

\echo ''
\echo '=== Test 5: Verify new partition was created ==='
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'audit' AND tablename LIKE 'audit_trail_%'
ORDER BY tablename;

\echo ''
\echo '=== Test 6: Test immutability (should fail) ==='
\echo 'Attempting to UPDATE audit record...'
DO $$
BEGIN
  UPDATE audit.audit_trail SET "tableName" = 'modified' WHERE "auditId" = 1;
  RAISE NOTICE 'ERROR: Update should have been blocked!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'SUCCESS: Update blocked as expected - %', SQLERRM;
END $$;

\echo ''
\echo 'Attempting to DELETE audit record...'
DO $$
BEGIN
  DELETE FROM audit.audit_trail WHERE "auditId" = 1;
  RAISE NOTICE 'ERROR: Delete should have been blocked!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'SUCCESS: Delete blocked as expected - %', SQLERRM;
END $$;

\echo ''
\echo '=== Test 7: Test GIN indexes ==='
\echo 'Inserting record with JSONB data...'
INSERT INTO audit.audit_trail ("tenantId", "tableName", operation, "oldData", "newData", "changedAt")
VALUES (
  1, 
  'core.organizations', 
  'UPDATE',
  '{"orgCode": "OLD123", "name": "Old Name"}'::jsonb,
  '{"orgCode": "NEW123", "name": "New Name"}'::jsonb,
  '2026-03-20 13:00:00+00'
);

\echo 'Querying with JSONB containment (@>)...'
SELECT "auditId", "tableName", "newData"
FROM audit.audit_trail
WHERE "newData" @> '{"orgCode": "NEW123"}'::jsonb;

\echo ''
\echo '=== All Tests Complete ==='
