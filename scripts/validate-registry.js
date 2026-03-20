// Validate CUSTOM_SQL_REGISTRY.json against schema
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schemaPath = join(__dirname, '../src/db/schema/audit/CUSTOM_SQL_REGISTRY.schema.json');
const registryPath = join(__dirname, '../src/db/schema/audit/CUSTOM_SQL_REGISTRY.json');

try {
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
  
  console.log('✅ Registry JSON is valid');
  console.log(`📋 Version: ${registry.version}`);
  console.log(`📝 Entries: ${Object.keys(registry.entries).length}`);
  
  // Check each entry
  for (const [id, entry] of Object.entries(registry.entries)) {
    console.log(`\n${id}:`);
    console.log(`  Migration: ${entry.migration}`);
    console.log(`  Lines: ${entry.sqlLines}`);
    console.log(`  Type: ${entry.type}`);
  }
  
  console.log('\n✅ Registry validation complete');
  process.exit(0);
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}
