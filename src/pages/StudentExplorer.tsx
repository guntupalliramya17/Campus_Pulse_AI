import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/AppStore';
import { FilterBar } from '@/components/FilterBar';
import { StudentProfile } from '@/components/StudentProfile';
import { DataTable, type TableColumn } from '@/components/ui/Table';
import { RiskBadge } from '@/components/ui/Badge';
import { TextInput } from '@/components/ui/Form';
import { Card, CardBody } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import type { StudentRecord } from '@/types';
import { formatScore, getScoreColor, getScoreBarColor } from '@/utils/format';
import { Search, Users, ArrowUpDown, Info } from 'lucide-react';

type SortKey = 'name' | 'id' | 'department' | 'cgpa' | 'attendance' | 'successScore' | 'placementReadiness' | 'academicRisk';
type SortDir = 'asc' | 'desc';

export function StudentExplorer() {
  const { filteredStudents, analyticsMap } = useAppStore();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('successScore');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  const filtered = useMemo(() => {
    let result = filteredStudents;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
      );
    }

    const sorted = [...result].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortKey) {
        case 'name': aVal = a.name; bVal = b.name; break;
        case 'id': aVal = a.id; bVal = b.id; break;
        case 'department': aVal = a.department; bVal = b.department; break;
        case 'cgpa': aVal = a.cgpa; bVal = b.cgpa; break;
        case 'attendance': aVal = a.overallAttendance; bVal = b.overallAttendance; break;
        case 'successScore': aVal = analyticsMap.get(a.id)?.successScore.total ?? 0; bVal = analyticsMap.get(b.id)?.successScore.total ?? 0; break;
        case 'placementReadiness': aVal = analyticsMap.get(a.id)?.placementReadiness.total ?? -1; bVal = analyticsMap.get(b.id)?.placementReadiness.total ?? -1; break;
        case 'academicRisk': {
          const order = { low: 0, moderate: 1, high: 2, critical: 3, 'insufficient-data': 4 };
          aVal = order[analyticsMap.get(a.id)?.risk.academicRisk ?? 'low'];
          bVal = order[analyticsMap.get(b.id)?.risk.academicRisk ?? 'low'];
          break;
        }
        default: aVal = 0; bVal = 0;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return sorted;
  }, [filteredStudents, search, sortKey, sortDir, analyticsMap]);

  const handleSort = (key: string) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key as SortKey);
      setSortDir('desc');
    }
  };

  const columns: TableColumn<StudentRecord>[] = [
    {
      key: 'id',
      header: 'Student ID',
      sortable: true,
      render: (s) => <span className="font-mono text-xs text-midnight-300">{s.id}</span>,
      width: 'w-28',
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (s) => (
        <div>
          <p className="text-sm font-medium text-midnight-100">{s.name}</p>
          <p className="text-xs text-midnight-400">{s.department.length > 25 ? s.department.slice(0, 23) + '…' : s.department} · Y{s.academicYear}</p>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (s) => <span className="text-xs text-midnight-300">{s.department}</span>,
      className: 'hidden md:table-cell',
    },
    {
      key: 'cgpa',
      header: 'CGPA',
      sortable: true,
      render: (s) => <span className="font-mono text-sm text-midnight-100">{s.cgpa}</span>,
      className: 'hidden lg:table-cell',
    },
    {
      key: 'attendance',
      header: 'Attendance',
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-2">
          <span className="text-xs text-midnight-200 w-10">{s.overallAttendance}%</span>
          <div className="w-16"><Progress value={s.overallAttendance} size="sm" color={s.overallAttendance >= 75 ? 'teal' : s.overallAttendance >= 60 ? 'warning' : 'danger'} /></div>
        </div>
      ),
      className: 'hidden lg:table-cell',
    },
    {
      key: 'successScore',
      header: 'Success Score',
      sortable: true,
      render: (s) => {
        const score = analyticsMap.get(s.id)?.successScore.total ?? 0;
        return <span className={`text-sm font-bold ${getScoreColor(score)}`}>{formatScore(score)}</span>;
      },
    },
    {
      key: 'placementReadiness',
      header: 'Placement',
      sortable: true,
      render: (s) => {
        const score = analyticsMap.get(s.id)?.placementReadiness.total ?? null;
        return <span className={`text-sm font-bold ${getScoreColor(score)}`}>{formatScore(score)}</span>;
      },
    },
    {
      key: 'academicRisk',
      header: 'Academic Risk',
      sortable: true,
      render: (s) => {
        const risk = analyticsMap.get(s.id)?.risk.academicRisk;
        return risk ? <RiskBadge category={risk} size="sm" /> : '—';
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-midnight-50">Student Explorer</h1>
          <p className="text-sm text-midnight-400 mt-0.5">Search, sort, and view detailed student profiles</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-midnight-400">
          <Users className="w-4 h-4" />
          <span>{filtered.length} students</span>
        </div>
      </div>

      <FilterBar />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or department..."
            className="w-full rounded-lg border border-midnight-700 bg-midnight-800/60 pl-9 pr-3 py-2 text-sm text-midnight-100 outline-none transition-colors hover:border-midnight-600 focus:border-teal-500 placeholder:text-midnight-500"
          />
        </div>
        <div className="flex items-center gap-1 text-xs text-midnight-400">
          <ArrowUpDown className="w-3.5 h-3.5" />
          Click column headers to sort
        </div>
      </div>

      <Card>
        <CardBody className="p-0">
          <DataTable
            columns={columns}
            data={filtered}
            onRowClick={(row) => setSelectedStudent(row)}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            emptyMessage="No students match your search and filters"
          />
        </CardBody>
      </Card>

      <div className="flex items-center gap-2 text-xs text-midnight-500">
        <Info className="w-3.5 h-3.5" />
        Click any row to view the full student profile with score breakdown, trends, and intervention history.
      </div>

      <StudentProfile student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  );
}
