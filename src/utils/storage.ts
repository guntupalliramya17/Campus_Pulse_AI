import type { StudentRecord, InterventionRecord, AppConfig, CsvImportResult } from '@/types';
import { DEFAULT_CONFIG } from '@/types';
import { generateSyntheticStudents } from '@/data/synthetic';

const STORAGE_KEYS = {
  students: 'campus-pulse-students',
  interventions: 'campus-pulse-interventions',
  config: 'campus-pulse-config',
  importHistory: 'campus-pulse-import-history',
} as const;

// ============================================================
// Safe localStorage read/write with JSON parse error handling
// ============================================================

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Students
// ============================================================

export function loadStudents(): StudentRecord[] {
  const stored = safeRead<StudentRecord[] | null>(STORAGE_KEYS.students, null);
  if (stored && Array.isArray(stored) && stored.length > 0) {
    return stored;
  }
  // Generate fresh synthetic data
  const synthetic = generateSyntheticStudents(150);
  safeWrite(STORAGE_KEYS.students, synthetic);
  return synthetic;
}

export function saveStudents(students: StudentRecord[]): void {
  safeWrite(STORAGE_KEYS.students, students);
}

export function resetStudents(): StudentRecord[] {
  const fresh = generateSyntheticStudents(150);
  safeWrite(STORAGE_KEYS.students, fresh);
  return fresh;
}

// ============================================================
// Interventions
// ============================================================

export function loadInterventions(): InterventionRecord[] {
  return safeRead<InterventionRecord[]>(STORAGE_KEYS.interventions, []);
}

export function saveInterventions(interventions: InterventionRecord[]): void {
  safeWrite(STORAGE_KEYS.interventions, interventions);
}

// ============================================================
// Config
// ============================================================

export function loadConfig(): AppConfig {
  const stored = safeRead<Partial<AppConfig> | null>(STORAGE_KEYS.config, null);
  if (!stored) return DEFAULT_CONFIG;
  // Merge with defaults to handle missing keys
  return {
    scoreWeights: { ...DEFAULT_CONFIG.scoreWeights, ...stored.scoreWeights },
    placementWeights: { ...DEFAULT_CONFIG.placementWeights, ...stored.placementWeights },
    riskThresholds: { ...DEFAULT_CONFIG.riskThresholds, ...stored.riskThresholds },
    defaultFacultyHours: stored.defaultFacultyHours ?? DEFAULT_CONFIG.defaultFacultyHours,
    showSyntheticOnly: stored.showSyntheticOnly ?? false,
    theme: 'dark',
  };
}

export function saveConfig(config: AppConfig): void {
  safeWrite(STORAGE_KEYS.config, config);
}

export function resetConfig(): AppConfig {
  safeWrite(STORAGE_KEYS.config, DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
}

// ============================================================
// Import history
// ============================================================

export function loadImportHistory(): CsvImportResult[] {
  return safeRead<CsvImportResult[]>(STORAGE_KEYS.importHistory, []);
}

export function saveImportHistory(history: CsvImportResult[]): void {
  safeWrite(STORAGE_KEYS.importHistory, history);
}

// ============================================================
// Full reset
// ============================================================

export function resetAll(): { students: StudentRecord[]; interventions: InterventionRecord[]; config: AppConfig } {
  const students = resetStudents();
  saveInterventions([]);
  const config = resetConfig();
  saveImportHistory([]);
  return { students, interventions: [], config };
}
