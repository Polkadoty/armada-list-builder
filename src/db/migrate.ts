import { supabase } from '@/lib/supabaseClient';
import fs from 'fs';
import path from 'path';

async function checkMigrationExists(migrationName: string) {
  const { data } = await supabase
    .from('migrations')
    .select('name')
    .eq('name', migrationName)
    .single();
  
  return !!data;
}

async function recordMigration(migrationName: string) {
  await supabase
    .from('migrations')
    .insert({ name: migrationName });
}

export async function runMigration(migrationName: string) {
  try {
    // Check if migration has already run
    const exists = await checkMigrationExists(migrationName);
    if (exists) {
      console.log(`Migration ${migrationName} already applied`);
      return;
    }

    // Read and execute migration
    const migrationPath = path.join(process.cwd(), 'src', 'db', 'migrations', migrationName);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    const { error } = await supabase.rpc('run_migration', { sql_script: sql });
    if (error) throw error;

    // Record successful migration
    await recordMigration(migrationName);
    console.log(`Successfully applied migration: ${migrationName}`);
  } catch (error) {
    console.error(`Failed to run migration ${migrationName}:`, error);
    throw error;
  }
} 