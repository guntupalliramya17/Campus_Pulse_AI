import { useMemo } from 'react';
import { useAppStore } from '@/store/AppStore';
import { KPICard } from '@/components/ui/KPICard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { RiskBadge, Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { FilterBar } from '@/components/FilterBar';
import { StudentProfile } from '@/components/StudentProfile';
import type { StudentRecord } from '@/types';
import { formatScore, getScoreColor } from '@/utils/format';
import {
  aggregateRiskDistribution, aggregateDepartmentPerformance,
  aggregateYearRiskHeatmap, getEmergingRisks, getPriorityStudents, getRecommendedActions,
} from '@/utils/analytics';
import {
  Users, AlertTriangle, Target, BarChart3, TrendingUp, Activity,
  PieChart as PieIcon, Grid3x3, Zap, ChevronRight, Award,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts';
import { useState } from 'react';

const RISK_COLORS: Record<string, string> = {
  low: '#00b894',
  moderate: '#f0a020',
  high: '#e87738',
  critical: '#e23856',
  'insufficient-data': '#4d6fa0',
};

const HEATMAP_COLORS: Record<string, string> = {
  low: 'bg-teal-500/15 text-teal-300',
  moderate: 'bg-warning/15 text-warning',
  high: 'bg-orange-500/15 text-orange-400',
  critical: 'bg-danger/15 text-danger',
};

export function CommandCenter({ onNavigate, onOpenStudent }: { onNavigate: (page: string) => void; onOpenStudent?: (id: string) => void }) {
  const { filteredStudents, analyticsMap, students } = useAppStore();
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  const stats = useMemo(() => {
    const total = filteredStudents.length;
    let academicSupport = 0;
    let placementGaps = 0;
    let successSum = 0;
    let placementSum = 0;
    let placementCount = 0;

    for (const s of filteredStudents) {
      const a = analyticsMap.get(s.id);
      if (!a) continue;
      if (a.risk.academicRisk === 'high' || a.risk.academicRisk === 'critical' || a.risk.academicRisk === 'moderate') academicSupport++;
      if (a.risk.placementRisk === 'high' || a.risk.placementRisk === 'critical' || a.risk.placementRisk === 'moderate') placementGaps++;
      successSum += a.successScore.total;
      if (a.placementReadiness.total != null) {
        placementSum += a.placementReadiness.total;
        placementCount++;
      }
    }

    return {
      total,
      academicSupport,
      placementGaps,
      avgSuccess: total > 0 ? Math.round((successSum / total) * 10) / 10 : 0,
      avgPlacement: placementCount > 0 ? Math.round((placementSum / placementCount) * 10) / 10 : 0,
    };
  }, [filteredStudents, analyticsMap]);

  const riskDist = useMemo(() => aggregateRiskDistribution(filteredStudents, analyticsMap), [filteredStudents, analyticsMap]);
  const deptPerf = useMemo(() => aggregateDepartmentPerformance(filteredStudents, analyticsMap), [filteredStudents, analyticsMap]);
  const heatmap = useMemo(() => aggregateYearRiskHeatmap(filteredStudents, analyticsMap), [filteredStudents, analyticsMap]);
  const emerging = useMemo(() => getEmergingRisks(filteredStudents, analyticsMap), [filteredStudents, analyticsMap]);
  const priority = useMemo(() => getPriorityStudents(filteredStudents, analyticsMap, 8), [filteredStudents, analyticsMap]);
  const actions = useMemo(() => getRecommendedActions(filteredStudents, analyticsMap), [filteredStudents, analyticsMap]);

  // Attendance trend across all students by semester
  const attendanceTrend = useMemo(() => {
    const semData = new Map<number, { sum: number; count: number }>();
    for (const s of filteredStudents) {
      for (const t of s.semesterTrends) {
        if (!semData.has(t.semester)) semData.set(t.semester, { sum: 0, count: 0 });
        const d = semData.get(t.semester)!;
        d.sum += t.attendance;
        d.count++;
      }
    }
    return Array.from(semData.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([sem, d]) => ({ semester: `S${sem}`, attendance: Math.round(d.sum / d.count) }));
  }, [filteredStudents]);

  // Academic trend
  const academicTrend = useMemo(() => {
    const semData = new Map<number, { sum: number; count: number }>();
    for (const s of filteredStudents) {
      for (const t of s.semesterTrends) {
        if (!semData.has(t.semester)) semData.set(t.semester, { sum: 0, count: 0 });
        const d = semData.get(t.semester)!;
        d.sum += t.sgpa;
        d.count++;
      }
    }
    return Array.from(semData.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([sem, d]) => ({ semester: `S${sem}`, sgpa: Math.round((d.sum / d.count) * 100) / 100 }));
  }, [filteredStudents]);

  const departments = [...new Set(heatmap.map((h) => h.department))];
  const years = [1, 2, 3, 4];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-midnight-50">Command Center</h1>
          <p className="text-sm text-midnight-400 mt-0.5">Executive overview of student success metrics across the institution</p>
        </div>
        <Badge variant="teal" size="sm">{filteredStudents.length} students analyzed</Badge>
      </div>

      <FilterBar />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard
          label="Total Students"
          value={stats.total}
          icon={<Users className="w-5 h-5" />}
          color="info"
          subtitle="Currently analyzed"
          onClick={() => onNavigate('student-explorer')}
        />
        <KPICard
          label="Academic Support"
          value={stats.academicSupport}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="danger"
          subtitle={`${stats.total > 0 ? Math.round((stats.academicSupport / stats.total) * 100) : 0}% of total`}
          onClick={() => onNavigate('predictive-intelligence')}
        />
        <KPICard
          label="Placement Gaps"
          value={stats.placementGaps}
          icon={<Target className="w-5 h-5" />}
          color="warning"
          subtitle="Need readiness support"
          onClick={() => onNavigate('predictive-intelligence')}
        />
        <KPICard
          label="Avg Success Score"
          value={formatScore(stats.avgSuccess)}
          icon={<BarChart3 className="w-5 h-5" />}
          color="teal"
          subtitle="Student Success Score"
        />
        <KPICard
          label="Avg Placement"
          value={formatScore(stats.avgPlacement)}
          icon={<Award className="w-5 h-5" />}
          color="violet"
          subtitle="Placement Readiness"
        />
      </div>

      {/* Risk distribution + Department performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Risk Distribution" subtitle="Overall risk across all filtered students" icon={<PieIcon className="w-4 h-4" />} />
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={riskDist}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={50}
                  paddingAngle={2}
                >
                  {riskDist.map((entry, i) => (
                    <Cell key={i} fill={RISK_COLORS[entry.category]} stroke="#0d1a33" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0d1a33', border: '1px solid #1f3556', borderRadius: '8px', fontSize: '12px' }}
                  formatter={((value: number, _name: string, entry: { payload?: { category?: string } }) => {
                    const cat = entry?.payload?.category ?? '';
                    return [`${value} students`, cat.replace(/-/g, ' ')];
                  }) as never}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {riskDist.map((r) => (
                <div key={r.category} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: RISK_COLORS[r.category] }} />
                  <span className="text-midnight-300 capitalize">{r.category.replace(/-/g, ' ')}</span>
                  <span className="text-midnight-100 font-medium">{r.count}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Department Performance" subtitle="Average scores by department" icon={<BarChart3 className="w-4 h-4" />} />
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={deptPerf} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f3556" />
                <XAxis dataKey="department" tick={{ fontSize: 9, fill: '#6b89b8' }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b89b8' }} />
                <Tooltip
                  contentStyle={{ background: '#0d1a33', border: '1px solid #1f3556', borderRadius: '8px', fontSize: '12px' }}
                  cursor={{ fill: '#1f355640' }}
                />
                <Bar dataKey="avgSuccess" fill="#00b894" radius={[4, 4, 0, 0]} name="Avg Success" />
                <Bar dataKey="avgPlacement" fill="#a85bf0" radius={[4, 4, 0, 0]} name="Avg Placement" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Attendance + Academic trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Attendance Trend" subtitle="Average attendance by semester" icon={<TrendingUp className="w-4 h-4" />} />
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={attendanceTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f3556" />
                <XAxis dataKey="semester" tick={{ fontSize: 10, fill: '#6b89b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b89b8' }} />
                <Tooltip contentStyle={{ background: '#0d1a33', border: '1px solid #1f3556', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="attendance" stroke="#00b894" strokeWidth={2} dot={{ r: 4 }} name="Attendance %" />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Academic Trend" subtitle="Average SGPA by semester" icon={<Activity className="w-4 h-4" />} />
          <CardBody>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={academicTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f3556" />
                <XAxis dataKey="semester" tick={{ fontSize: 10, fill: '#6b89b8' }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#6b89b8' }} />
                <Tooltip contentStyle={{ background: '#0d1a33', border: '1px solid #1f3556', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="sgpa" stroke="#a85bf0" strokeWidth={2} dot={{ r: 4 }} name="Avg SGPA" />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader title="Department × Year Risk Heatmap" subtitle="Concentration of at-risk students" icon={<Grid3x3 className="w-4 h-4" />} />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-midnight-400 font-medium">Department</th>
                  {years.map((y) => (
                    <th key={y} className="px-3 py-2 text-center text-midnight-400 font-medium">Year {y}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept} className="border-t border-midnight-700/30">
                    <td className="px-3 py-2 text-midnight-200 text-xs">{dept.length > 25 ? dept.slice(0, 23) + '…' : dept}</td>
                    {years.map((y) => {
                      const cell = heatmap.find((h) => h.department === dept && h.year === y);
                      if (!cell) return <td key={y} className="px-3 py-2 text-center text-midnight-600">—</td>;
                      return (
                        <td key={y} className="px-3 py-2 text-center">
                          <div
                            className={`inline-flex flex-col items-center rounded-md px-2 py-1.5 ${HEATMAP_COLORS[cell.riskLevel]}`}
                            title={`${cell.riskCount}/${cell.totalCount} at risk`}
                          >
                            <span className="font-bold">{cell.riskCount}</span>
                            <span className="text-[9px] opacity-70">/ {cell.totalCount}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-3 mt-3 text-xs">
            <span className="text-midnight-400">Risk level:</span>
            {(['low', 'moderate', 'high', 'critical'] as const).map((lvl) => (
              <div key={lvl} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${HEATMAP_COLORS[lvl].split(' ')[0]}`} />
                <span className="text-midnight-300 capitalize">{lvl}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Emerging risks + Priority students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Emerging Risk Signals" subtitle="Early warning indicators" icon={<Zap className="w-4 h-4" />} />
          <CardBody>
            <div className="space-y-2">
              {emerging.map((sig, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-midnight-700/40 bg-midnight-800/30 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`rounded-md p-1.5 ${sig.severity === 'danger' ? 'bg-danger/15 text-danger' : 'bg-warning/15 text-warning'}`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm text-midnight-200">{sig.signal}</span>
                  </div>
                  <Badge variant={sig.severity === 'danger' ? 'danger' : 'warning'} size="sm">{sig.count} students</Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Priority Students"
            subtitle="Highest-risk students requiring immediate attention"
            icon={<AlertTriangle className="w-4 h-4" />}
            action={
              <button
                onClick={() => onNavigate('student-explorer')}
                className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300"
              >
                View all <ChevronRight className="w-3 h-3" />
              </button>
            }
          />
          <CardBody>
            <div className="space-y-1.5">
              {priority.map(({ student, analytics: a }, i) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className="flex w-full items-center justify-between rounded-lg border border-midnight-700/40 bg-midnight-800/30 px-3 py-2 text-left transition-colors hover:border-midnight-600 hover:bg-midnight-700/20"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-xs font-bold text-midnight-500 w-5">#{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-midnight-100 truncate">{student.name}</p>
                      <p className="text-xs text-midnight-400 truncate">{student.id} · {student.department.length > 20 ? student.department.slice(0, 18) + '…' : student.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-bold ${getScoreColor(a.successScore.total)}`}>{formatScore(a.successScore.total)}</span>
                    <RiskBadge category={a.risk.academicRisk} size="sm" />
                  </div>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recommended actions */}
      <Card>
        <CardHeader title="Recommended Institutional Actions" subtitle="Prioritized based on current data" icon={<Target className="w-4 h-4" />} />
        <CardBody>
          <div className="space-y-2">
            {actions.map((action, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-midnight-700/40 bg-midnight-800/30 px-4 py-3"
              >
                <div className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase ${
                  action.urgency === 'high' ? 'bg-danger/15 text-danger' :
                  action.urgency === 'medium' ? 'bg-warning/15 text-warning' :
                  'bg-teal-500/15 text-teal-300'
                }`}>
                  {action.urgency}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-midnight-100">{action.action}</p>
                  <p className="text-xs text-midnight-400 mt-0.5">Scope: {action.scope}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-midnight-500 italic">
            Recommendations are based on deterministic scoring rules, not predictive models. See Settings for scoring configuration.
          </p>
        </CardBody>
      </Card>

      <StudentProfile student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  );
}
