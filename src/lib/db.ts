import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { AnalysisResult } from '@/lib/models';

let db: Database | null = null;

export async function getDb() {
  if (!db) {
    db = await open({
      filename: './data/analysis.db',
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS analysis_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        content JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  return db;
}

export async function saveAnalysis(filename: string, content: AnalysisResult) {
  const db = await getDb();
  return db.run(
    'INSERT INTO analysis_results (filename, content) VALUES (?, ?)',
    filename,
    JSON.stringify(content)
  );
}

export async function getAnalysis(id: number) {
  const db = await getDb();
  const result = await db.get(
    'SELECT * FROM analysis_results WHERE id = ?',
    id
  );
  if (result) {
    result.content = JSON.parse(result.content);
  }
  return result;
}

export async function getAllAnalyses() {
  const db = await getDb();
  const results = await db.all('SELECT id, filename, created_at FROM analysis_results ORDER BY created_at DESC');
  return results;
}
