import { useAppStore } from '@/store/AppStore';
import { Select } from './ui/Form';
import { DEPARTMENTS } from '@/types';
import type { Department, AcademicYear, Semester, RiskCategory, StudentSegment } from '@/types';
import { Filter, X } from 'lucide-react';

export function FilterBar() {
  const { filters, setFilters } = useAppStore();

  const hasActiveFilters =
    filters.department !== 'all' ||
    filters.academicYear !== 'all' ||
    filters.semester !== 'all' ||
    filters.riskCategory !== 'all' ||
    filters.segment !== 'all';

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-midnight-700/50 bg-midnight-800/30 p-3">
      <div className="flex items-center gap-2 text-midnight-300">
        <Filter className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">Filters</span>
      </div>

      <Select
        label="Department"
        value={filters.department}
        onChange={(v) => setFilters({ department: v as Department | 'all' })}
        options={[
          { value: 'all', label: 'All Departments' },
          ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
        ]}
        className="min-w-[180px] flex-1"
      />

      <Select
        label="Academic Year"
        value={filters.academicYear}
        onChange={(v) => setFilters({ academicYear: v === 'all' ? 'all' : Number(v) as AcademicYear })}
        options={[
          { value: 'all', label: 'All Years' },
          { value: 1, label: 'Year 1' },
          { value: 2, label: 'Year 2' },
          { value: 3, label: 'Year 3' },
          { value: 4, label: 'Year 4' },
        ]}
        className="min-w-[120px]"
      />

      <Select
        label="Semester"
        value={filters.semester}
        onChange={(v) => setFilters({ semester: v === 'all' ? 'all' : Number(v) as Semester })}
        options={[
          { value: 'all', label: 'All Semesters' },
          ...Array.from({ length: 8 }, (_, i) => ({ value: i + 1, label: `Sem ${i + 1}` })),
        ]}
        className="min-w-[120px]"
      />

      <Select
        label="Risk Category"
        value={filters.riskCategory}
        onChange={(v) => setFilters({ riskCategory: v as RiskCategory | 'all' })}
        options={[
          { value: 'all', label: 'All Risk Levels' },
          { value: 'low', label: 'Low Risk' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'high', label: 'High Risk' },
          { value: 'critical', label: 'Critical' },
          { value: 'insufficient-data', label: 'Insufficient Data' },
        ]}
        className="min-w-[140px]"
      />

      <Select
        label="Segment"
        value={filters.segment}
        onChange={(v) => setFilters({ segment: v as StudentSegment | 'all' })}
        options={[
          { value: 'all', label: 'All Segments' },
          { value: 'high-achiever', label: 'High Achiever' },
          { value: 'consistent-performer', label: 'Consistent Performer' },
          { value: 'at-risk', label: 'At Risk' },
          { value: 'placement-gaps', label: 'Placement Gaps' },
          { value: 'skill-mismatch', label: 'Skill Mismatch' },
          { value: 'low-engagement', label: 'Low Engagement' },
          { value: 'data-pending', label: 'Data Pending' },
        ]}
        className="min-w-[140px]"
      />

      {hasActiveFilters && (
        <button
          onClick={() => setFilters({
            department: 'all',
            academicYear: 'all',
            semester: 'all',
            riskCategory: 'all',
            segment: 'all',
          })}
          className="flex items-center gap-1 rounded-lg border border-midnight-600 px-3 py-2 text-xs text-midnight-300 transition-colors hover:border-danger/40 hover:text-danger"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
