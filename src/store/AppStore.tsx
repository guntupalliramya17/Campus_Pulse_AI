import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import type { StudentRecord, InterventionRecord, AppConfig, DashboardFilters } from '@/types';
import { DEFAULT_CONFIG } from '@/types';
import { loadStudents, saveStudents, loadInterventions, saveInterventions, loadConfig, saveConfig, resetAll } from '@/utils/storage';
import { computeAllAnalytics, type InterventionRecommendation, recommendInterventions } from '@/utils/analytics';

interface AppStore {
  students: StudentRecord[];
  interventions: InterventionRecord[];
  config: AppConfig;
  analyticsMap: Map<string, import('@/types').StudentAnalytics>;
  filters: DashboardFilters;
  setFilters: (f: Partial<DashboardFilters>) => void;
  filteredStudents: StudentRecord[];
  addStudents: (students: StudentRecord[], merge: boolean) => void;
  updateStudent: (student: StudentRecord) => void;
  addIntervention: (intervention: InterventionRecord) => void;
  updateIntervention: (intervention: InterventionRecord) => void;
  removeIntervention: (id: string) => void;
  updateConfig: (config: AppConfig) => void;
  resetAllData: () => void;
  recommendations: InterventionRecommendation[];
}

const AppContext = createContext<AppStore | null>(null);

const DEFAULT_FILTERS: DashboardFilters = {
  department: 'all',
  academicYear: 'all',
  semester: 'all',
  riskCategory: 'all',
  segment: 'all',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<StudentRecord[]>(() => loadStudents());
  const [interventions, setInterventions] = useState<InterventionRecord[]>(() => loadInterventions());
  const [config, setConfig] = useState<AppConfig>(() => loadConfig());
  const [filters, setFiltersState] = useState<DashboardFilters>(DEFAULT_FILTERS);

  // Persist on change
  useEffect(() => { saveStudents(students); }, [students]);
  useEffect(() => { saveInterventions(interventions); }, [interventions]);
  useEffect(() => { saveConfig(config); }, [config]);

  // Recompute analytics when students or config changes
  const analyticsMap = useMemo(() => computeAllAnalytics(students, config), [students, config]);

  const setFilters = useCallback((f: Partial<DashboardFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...f }));
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (filters.department !== 'all' && s.department !== filters.department) return false;
      if (filters.academicYear !== 'all' && s.academicYear !== filters.academicYear) return false;
      if (filters.semester !== 'all' && s.semester !== filters.semester) return false;
      if (filters.riskCategory !== 'all') {
        const a = analyticsMap.get(s.id);
        if (!a) return false;
        const worse = a.risk.academicRisk === 'critical' || a.risk.placementRisk === 'critical' ? 'critical'
          : a.risk.academicRisk === 'high' || a.risk.placementRisk === 'high' ? 'high'
          : a.risk.academicRisk === 'moderate' || a.risk.placementRisk === 'moderate' ? 'moderate'
          : a.risk.academicRisk === 'insufficient-data' || a.risk.placementRisk === 'insufficient-data' ? 'insufficient-data'
          : 'low';
        if (worse !== filters.riskCategory) return false;
      }
      if (filters.segment !== 'all') {
        const a = analyticsMap.get(s.id);
        if (!a || a.segment !== filters.segment) return false;
      }
      return true;
    });
  }, [students, filters, analyticsMap]);

  const addStudents = useCallback((newStudents: StudentRecord[], merge: boolean) => {
    setStudents((prev) => {
      if (merge) {
        const existingIds = new Set(prev.map((s) => s.id));
        const toAdd = newStudents.filter((s) => !existingIds.has(s.id));
        // For duplicates, update existing records
        const updated = prev.map((s) => {
          const imported = newStudents.find((ns) => ns.id === s.id);
          return imported ? { ...s, ...imported, isSynthetic: false } : s;
        });
        return [...updated, ...toAdd];
      }
      return newStudents;
    });
  }, []);

  const updateStudent = useCallback((student: StudentRecord) => {
    setStudents((prev) => prev.map((s) => (s.id === student.id ? student : s)));
  }, []);

  const addIntervention = useCallback((intervention: InterventionRecord) => {
    setInterventions((prev) => [...prev, intervention]);
  }, []);

  const updateIntervention = useCallback((intervention: InterventionRecord) => {
    setInterventions((prev) => prev.map((i) => (i.id === intervention.id ? intervention : i)));
  }, []);

  const removeIntervention = useCallback((id: string) => {
    setInterventions((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateConfig = useCallback((newConfig: AppConfig) => {
    setConfig(newConfig);
  }, []);

  const resetAllData = useCallback(() => {
    const result = resetAll();
    setStudents(result.students);
    setInterventions(result.interventions);
    setConfig(result.config);
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const recommendations = useMemo(
    () => recommendInterventions(students, analyticsMap, config.defaultFacultyHours),
    [students, analyticsMap, config.defaultFacultyHours]
  );

  const value: AppStore = {
    students,
    interventions,
    config,
    analyticsMap,
    filters,
    setFilters,
    filteredStudents,
    addStudents,
    updateStudent,
    addIntervention,
    updateIntervention,
    removeIntervention,
    updateConfig,
    resetAllData,
    recommendations,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore(): AppStore {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}

export { DEFAULT_CONFIG };
