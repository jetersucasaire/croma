import initSqlJs, { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';

let db: Database | null = null;
const DB_PATH = path.join(__dirname, '../../croma.db');

export async function inicializarDB(): Promise<Database> {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  return db;
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call inicializarDB() first.');
  }
  return db;
}

export function runQuery(sql: string, params: any[] = []): any[] {
  if (!db) throw new Error('Database not initialized');
  
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (error: any) {
    console.error('Query error:', sql, params, error.message);
    throw error;
  }
}

export function runInsert(sql: string, params: any[] = []): number {
  if (!db) throw new Error('Database not initialized');
  
  try {
    db.run(sql, params);
    const result = db.exec('SELECT last_insert_rowid() as id');
    let insertId = 0;
    if (result && result.length > 0 && result[0] && result[0].values && result[0].values.length > 0) {
      insertId = result[0].values[0][0] as number || 0;
    }
    guardarDB();
    return insertId;
  } catch (error: any) {
    console.error('Insert error:', sql, params, error.message);
    throw error;
  }
}

export function runUpdate(sql: string, params: any[] = []): void {
  if (!db) throw new Error('Database not initialized');
  
  try {
    db.run(sql, params);
    guardarDB();
  } catch (error: any) {
    console.error('Update error:', sql, params, error.message);
    throw error;
  }
}

export function runExec(sql: string, params: any[] = []): void {
  if (!db) throw new Error('Database not initialized');
  
  try {
    db.run(sql, params);
    guardarDB();
  } catch (error: any) {
    console.error('Exec error:', sql, params, error.message);
    throw error;
  }
}

function guardarDB(): void {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    } catch (error: any) {
      console.error('Error saving database:', error.message);
    }
  }
}

export { db, guardarDB };