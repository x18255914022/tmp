import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

let db: Database.Database;

export function getDbPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'salmon-tracker.db');
}

export function initDatabase(): Database.Database {
  const dbPath = getDbPath();
  console.log('Database path:', dbPath);
  
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      project_type TEXT,
      priority TEXT DEFAULT 'средний',
      default_batch_size INTEGER DEFAULT 48,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sample_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      batch_code TEXT NOT NULL,
      planned_specimen_count INTEGER DEFAULT 48,
      actual_specimen_count INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS locus_reference (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      locus_code TEXT NOT NULL UNIQUE,
      annealing_temp TEXT,
      electrophoresis_time TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS batch_locus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      sample_group_id INTEGER NOT NULL REFERENCES sample_groups(id) ON DELETE CASCADE,
      locus_id INTEGER NOT NULL REFERENCES locus_reference(id),
      annealing_temp_override TEXT,
      electrophoresis_time_override TEXT,
      dna_status TEXT NOT NULL DEFAULT 'not_started',
      pcr_status TEXT NOT NULL DEFAULT 'not_started',
      electrophoresis_status TEXT NOT NULL DEFAULT 'not_started',
      ready_for_calculations INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      updated_at TEXT,
      UNIQUE(sample_group_id, locus_id)
    );

    CREATE TABLE IF NOT EXISTS pcr_rerun_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      sample_group_id INTEGER NOT NULL REFERENCES sample_groups(id) ON DELETE CASCADE,
      locus_id INTEGER NOT NULL REFERENCES locus_reference(id),
      specimen_numbers TEXT,
      rerun_date TEXT,
      comment TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Seed locus reference if empty
  const count = db.prepare('SELECT COUNT(*) as cnt FROM locus_reference').get() as any;
  if (count.cnt === 0) {
    const insert = db.prepare(
      'INSERT INTO locus_reference (locus_code, annealing_temp, electrophoresis_time) VALUES (?, ?, ?)'
    );
    const loci = [
      ['Ssa2019', '67 °C', '1 ч 50 мин'],
      ['Oki23', '57 °C', '2 ч'],
      ['Oke3', '60–62 °C', '2 ч 30 мин'],
      ['Ogo2G', '57 °C', '2 ч'],
      ['Oke11', '57 °C', '2 ч'],
      ['Oki1b', '57 °C', '2 ч'],
      ['Ots102', '57 °C', '2 ч'],
      ['One101', '57 °C', '2 ч'],
      ['One109', '60.5 °C', '2 ч 10 мин'],
      ['One103', '56–57 °C', '2 ч 5 мин'],
    ];
    const insertMany = db.transaction((rows: string[][]) => {
      for (const row of rows) {
        insert.run(row[0], row[1], row[2]);
      }
    });
    insertMany(loci);
  }

  return db;
}

export function getDb(): Database.Database {
  return db;
}

// ─── Projects ───
export function getAllProjects() {
  return getDb().prepare(`
    SELECT p.*,
      (SELECT COUNT(*) FROM sample_groups sg WHERE sg.project_id = p.id) as batch_count,
      (SELECT COUNT(*) FROM batch_locus bl WHERE bl.project_id = p.id) as total_bl,
      (SELECT COUNT(*) FROM batch_locus bl WHERE bl.project_id = p.id AND bl.ready_for_calculations = 1) as ready_bl,
      (SELECT COUNT(*) FROM batch_locus bl WHERE bl.project_id = p.id AND (bl.pcr_status = 'pcr_repeat_needed' OR bl.electrophoresis_status = 'electrophoresis_repeat_needed' OR bl.dna_status = 'problem' OR bl.pcr_status = 'problem' OR bl.electrophoresis_status = 'problem')) as problem_bl
    FROM projects p ORDER BY p.created_at DESC
  `).all();
}

export function getProject(id: number) {
  return getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

export function createProject(data: { name: string; description?: string; projectType?: string; priority?: string; defaultBatchSize?: number }) {
  return getDb().prepare(
    'INSERT INTO projects (name, description, project_type, priority, default_batch_size, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(data.name, data.description || null, data.projectType || null, data.priority || 'средний', data.defaultBatchSize || 48, new Date().toISOString());
}

export function updateProject(id: number, data: { name?: string; description?: string; projectType?: string; priority?: string; defaultBatchSize?: number }) {
  const fields: string[] = [];
  const values: any[] = [];
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.projectType !== undefined) { fields.push('project_type = ?'); values.push(data.projectType); }
  if (data.priority !== undefined) { fields.push('priority = ?'); values.push(data.priority); }
  if (data.defaultBatchSize !== undefined) { fields.push('default_batch_size = ?'); values.push(data.defaultBatchSize); }
  if (fields.length === 0) return;
  values.push(id);
  getDb().prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteProject(id: number) {
  getDb().prepare('DELETE FROM projects WHERE id = ?').run(id);
}

// ─── Sample Groups ───
export function getSampleGroupsByProject(projectId: number) {
  return getDb().prepare(`
    SELECT sg.*,
      (SELECT COUNT(*) FROM batch_locus bl WHERE bl.sample_group_id = sg.id) as total_loci,
      (SELECT COUNT(*) FROM batch_locus bl WHERE bl.sample_group_id = sg.id AND bl.ready_for_calculations = 1) as ready_loci,
      (SELECT COUNT(*) FROM batch_locus bl WHERE bl.sample_group_id = sg.id AND bl.dna_status = 'not_started' AND bl.pcr_status = 'not_started' AND bl.electrophoresis_status = 'not_started') as not_started_loci,
      (SELECT COUNT(*) FROM batch_locus bl WHERE bl.sample_group_id = sg.id AND bl.pcr_status = 'pcr_repeat_needed') as pcr_repeat_loci,
      (SELECT COUNT(*) FROM batch_locus bl WHERE bl.sample_group_id = sg.id AND bl.electrophoresis_status = 'electrophoresis_repeat_needed') as electro_repeat_loci,
      (SELECT COUNT(*) FROM batch_locus bl WHERE bl.sample_group_id = sg.id AND (bl.dna_status = 'problem' OR bl.pcr_status = 'problem' OR bl.electrophoresis_status = 'problem')) as problem_loci
    FROM sample_groups sg WHERE sg.project_id = ? ORDER BY sg.created_at DESC
  `).all(projectId);
}

export function getSampleGroup(id: number) {
  return getDb().prepare('SELECT * FROM sample_groups WHERE id = ?').get(id);
}

export function createSampleGroup(data: { projectId: number; batchCode: string; plannedSpecimenCount?: number; actualSpecimenCount?: number; notes?: string }) {
  const result = getDb().prepare(
    'INSERT INTO sample_groups (project_id, batch_code, planned_specimen_count, actual_specimen_count, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(data.projectId, data.batchCode, data.plannedSpecimenCount || 48, data.actualSpecimenCount || null, data.notes || null, new Date().toISOString());

  // Auto-create batch_locus for all loci in reference
  const loci = getDb().prepare('SELECT id FROM locus_reference ORDER BY id').all() as any[];
  const insertBl = getDb().prepare(
    'INSERT INTO batch_locus (project_id, sample_group_id, locus_id, dna_status, pcr_status, electrophoresis_status, ready_for_calculations, updated_at) VALUES (?, ?, ?, \'not_started\', \'not_started\', \'not_started\', 0, ?)'
  );
  const now = new Date().toISOString();
  const insertAll = getDb().transaction(() => {
    for (const locus of loci) {
      insertBl.run(data.projectId, result.lastInsertRowid, locus.id, now);
    }
  });
  insertAll();

  return result;
}

export function updateSampleGroup(id: number, data: { batchCode?: string; plannedSpecimenCount?: number; actualSpecimenCount?: number; notes?: string }) {
  const fields: string[] = [];
  const values: any[] = [];
  if (data.batchCode !== undefined) { fields.push('batch_code = ?'); values.push(data.batchCode); }
  if (data.plannedSpecimenCount !== undefined) { fields.push('planned_specimen_count = ?'); values.push(data.plannedSpecimenCount); }
  if (data.actualSpecimenCount !== undefined) { fields.push('actual_specimen_count = ?'); values.push(data.actualSpecimenCount); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
  if (fields.length === 0) return;
  values.push(id);
  getDb().prepare(`UPDATE sample_groups SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteSampleGroup(id: number) {
  getDb().prepare('DELETE FROM sample_groups WHERE id = ?').run(id);
}

// ─── Batch × Locus ───
export function getBatchLociByGroup(sampleGroupId: number) {
  return getDb().prepare(`
    SELECT bl.*, lr.locus_code, lr.annealing_temp as ref_temp, lr.electrophoresis_time as ref_time
    FROM batch_locus bl
    JOIN locus_reference lr ON lr.id = bl.locus_id
    WHERE bl.sample_group_id = ?
    ORDER BY lr.locus_code
  `).all(sampleGroupId);
}

export function updateBatchLocus(id: number, data: {
  dnaStatus?: string;
  pcrStatus?: string;
  electrophoresisStatus?: string;
  annealingTempOverride?: string;
  electrophoresisTimeOverride?: string;
  notes?: string;
}) {
  const fields: string[] = [];
  const values: any[] = [];
  if (data.dnaStatus !== undefined) { fields.push('dna_status = ?'); values.push(data.dnaStatus); }
  if (data.pcrStatus !== undefined) { fields.push('pcr_status = ?'); values.push(data.pcrStatus); }
  if (data.electrophoresisStatus !== undefined) { fields.push('electrophoresis_status = ?'); values.push(data.electrophoresisStatus); }
  if (data.annealingTempOverride !== undefined) { fields.push('annealing_temp_override = ?'); values.push(data.annealingTempOverride || null); }
  if (data.electrophoresisTimeOverride !== undefined) { fields.push('electrophoresis_time_override = ?'); values.push(data.electrophoresisTimeOverride || null); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
  
  fields.push('updated_at = ?');
  values.push(new Date().toISOString());
  
  values.push(id);
  getDb().prepare(`UPDATE batch_locus SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  // Recompute ready_for_calculations
  const row = getDb().prepare('SELECT dna_status, pcr_status, electrophoresis_status FROM batch_locus WHERE id = ?').get(id) as any;
  if (row) {
    const ready = (row.dna_status === 'completed' && row.pcr_status === 'completed' && row.electrophoresis_status === 'completed') ? 1 : 0;
    getDb().prepare('UPDATE batch_locus SET ready_for_calculations = ? WHERE id = ?').run(ready, id);
  }
}

// ─── Locus Reference ───
export function getAllLoci() {
  return getDb().prepare('SELECT * FROM locus_reference ORDER BY locus_code').all();
}

export function createLocus(data: { locusCode: string; annealingTemp?: string; electrophoresisTime?: string; notes?: string }) {
  return getDb().prepare(
    'INSERT INTO locus_reference (locus_code, annealing_temp, electrophoresis_time, notes) VALUES (?, ?, ?, ?)'
  ).run(data.locusCode, data.annealingTemp || null, data.electrophoresisTime || null, data.notes || null);
}

export function updateLocus(id: number, data: { locusCode?: string; annealingTemp?: string; electrophoresisTime?: string; notes?: string }) {
  const fields: string[] = [];
  const values: any[] = [];
  if (data.locusCode !== undefined) { fields.push('locus_code = ?'); values.push(data.locusCode); }
  if (data.annealingTemp !== undefined) { fields.push('annealing_temp = ?'); values.push(data.annealingTemp); }
  if (data.electrophoresisTime !== undefined) { fields.push('electrophoresis_time = ?'); values.push(data.electrophoresisTime); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
  if (fields.length === 0) return;
  values.push(id);
  getDb().prepare(`UPDATE locus_reference SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteLocus(id: number) {
  getDb().prepare('DELETE FROM locus_reference WHERE id = ?').run(id);
}

// ─── PCR Rerun Notes ───
export function getAllRerunNotes() {
  return getDb().prepare(`
    SELECT rn.*, p.name as project_name, sg.batch_code, lr.locus_code
    FROM pcr_rerun_notes rn
    JOIN projects p ON p.id = rn.project_id
    JOIN sample_groups sg ON sg.id = rn.sample_group_id
    JOIN locus_reference lr ON lr.id = rn.locus_id
    ORDER BY rn.created_at DESC
  `).all();
}

export function createRerunNote(data: { projectId: number; sampleGroupId: number; locusId: number; specimenNumbers?: string; rerunDate?: string; comment?: string }) {
  return getDb().prepare(
    'INSERT INTO pcr_rerun_notes (project_id, sample_group_id, locus_id, specimen_numbers, rerun_date, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(data.projectId, data.sampleGroupId, data.locusId, data.specimenNumbers || null, data.rerunDate || null, data.comment || null, new Date().toISOString());
}

export function deleteRerunNote(id: number) {
  getDb().prepare('DELETE FROM pcr_rerun_notes WHERE id = ?').run(id);
}

// ─── Dashboard stats ───
export function getDashboardStats() {
  const db = getDb();
  const totalProjects = (db.prepare('SELECT COUNT(*) as cnt FROM projects').get() as any).cnt;
  const totalBatches = (db.prepare('SELECT COUNT(*) as cnt FROM sample_groups').get() as any).cnt;
  const totalBl = (db.prepare('SELECT COUNT(*) as cnt FROM batch_locus').get() as any).cnt;
  const dnaCompleted = (db.prepare("SELECT COUNT(*) as cnt FROM batch_locus WHERE dna_status = 'completed'").get() as any).cnt;
  const pcrCompleted = (db.prepare("SELECT COUNT(*) as cnt FROM batch_locus WHERE pcr_status = 'completed'").get() as any).cnt;
  const pcrRepeat = (db.prepare("SELECT COUNT(*) as cnt FROM batch_locus WHERE pcr_status = 'pcr_repeat_needed'").get() as any).cnt;
  const electroCompleted = (db.prepare("SELECT COUNT(*) as cnt FROM batch_locus WHERE electrophoresis_status = 'completed'").get() as any).cnt;
  const electroRepeat = (db.prepare("SELECT COUNT(*) as cnt FROM batch_locus WHERE electrophoresis_status = 'electrophoresis_repeat_needed'").get() as any).cnt;
  const ready = (db.prepare("SELECT COUNT(*) as cnt FROM batch_locus WHERE ready_for_calculations = 1").get() as any).cnt;
  const problems = (db.prepare("SELECT COUNT(*) as cnt FROM batch_locus WHERE dna_status = 'problem' OR pcr_status = 'problem' OR electrophoresis_status = 'problem'").get() as any).cnt;

  // Problem batch×locus list
  const problemList = db.prepare(`
    SELECT bl.id, p.name as project_name, sg.batch_code, lr.locus_code, bl.dna_status, bl.pcr_status, bl.electrophoresis_status
    FROM batch_locus bl
    JOIN projects p ON p.id = bl.project_id
    JOIN sample_groups sg ON sg.id = bl.sample_group_id
    JOIN locus_reference lr ON lr.id = bl.locus_id
    WHERE bl.pcr_status = 'pcr_repeat_needed' OR bl.electrophoresis_status = 'electrophoresis_repeat_needed' OR bl.dna_status = 'problem' OR bl.pcr_status = 'problem' OR bl.electrophoresis_status = 'problem'
    ORDER BY p.name, sg.batch_code
  `).all();

  // Ready list
  const readyList = db.prepare(`
    SELECT bl.id, p.name as project_name, sg.batch_code, lr.locus_code
    FROM batch_locus bl
    JOIN projects p ON p.id = bl.project_id
    JOIN sample_groups sg ON sg.id = bl.sample_group_id
    JOIN locus_reference lr ON lr.id = bl.locus_id
    WHERE bl.ready_for_calculations = 1
    ORDER BY p.name, sg.batch_code
  `).all();

  return {
    totalProjects, totalBatches, totalBl,
    dnaCompleted, pcrCompleted, pcrRepeat,
    electroCompleted, electroRepeat, ready, problems,
    problemList, readyList,
  };
}

// ─── Export ───
export function getExportData() {
  return getDb().prepare(`
    SELECT p.name as project_name, sg.batch_code, lr.locus_code,
      COALESCE(bl.annealing_temp_override, lr.annealing_temp) as annealing_temp,
      COALESCE(bl.electrophoresis_time_override, lr.electrophoresis_time) as electrophoresis_time,
      bl.dna_status, bl.pcr_status, bl.electrophoresis_status,
      bl.ready_for_calculations, bl.notes, bl.updated_at
    FROM batch_locus bl
    JOIN projects p ON p.id = bl.project_id
    JOIN sample_groups sg ON sg.id = bl.sample_group_id
    JOIN locus_reference lr ON lr.id = bl.locus_id
    ORDER BY p.name, sg.batch_code, lr.locus_code
  `).all();
}

// ─── Backup ───
export function backupDatabase(destPath: string) {
  const srcPath = getDbPath();
  fs.copyFileSync(srcPath, destPath);
}

export function restoreDatabase(srcPath: string) {
  const destPath = getDbPath();
  // Close current connection
  getDb().close();
  fs.copyFileSync(srcPath, destPath);
  // Reinitialize
  return initDatabase();
}
