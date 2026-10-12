import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/AppStore';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { RiskBadge, Badge } from '@/components/ui/Badge';
import { FilterBar } from '@/components/FilterBar';
import { StudentProfile } from '@/components/StudentProfile';
import type { StudentRecord } from '@/types';
import { formatScore, getScoreColor } from '@/utils/format';
import {
  Brain, TrendingDown, AlertCircle, Target, CheckCircle,
  Code, MessageSquare, Database, Users, Info,
} from 'lucide-react';

export function PredictiveIntelligence() {
  const { filteredStudents, analyticsMap } = useAppStore();
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [activeSegment, setActiveSegment] = useState<string>('all');

  const segments = useMemo(() => {
    const configs: { key: string; title: string; description: string; icon: typeof Brain; color: 'teal' | 'violet' | 'warning' | 'danger' | 'info'; test: (s: StudentRecord) => boolean }[] = [
      { key: 'declining-attendance', title: 'Declining Attendance', description: 'Students with a downward attendance trend over recent semesters', icon: TrendingDown, color: 'danger', test: (s) => { const a = analyticsMap.get(s.id); return a?.decliningAttendance ?? false; } },
      { key: 'weak-assessments', title: 'Weak Assessments', description: 'Students with one or more subject marks below 45%', icon: AlertCircle, color: 'warning', test: (s) => { const a = analyticsMap.get(s.id); return a?.weakAssessments ?? false; } },
      { key: 'strong-academics-low-placement', title: 'Strong Academics, Low Placement', description: 'Good CGPA but placement readiness gaps detected', icon: Target, color: 'warning', test: (s) => { const a = analyticsMap.get(s.id); return a?.strongAcademicsLowPlacement ?? false; } },
      { key: 'strong-tech-weak-interview', title: 'Strong Tech, Weak Interviews', description: 'High coding scores but poor interview performance', icon: Code, color: 'violet', test: (s) => { const a = analyticsMap.get(s.id); return a?.strongTechWeakInterview ?? false; } },
      { key: 'placement-ready', title: 'Placement Ready', description: 'Students who meet placement readiness criteria', icon: CheckCircle, color: 'teal', test: (s) => { const a = analyticsMap.get(s.id); return a?.placementReady ?? false; } },
      { key: 'insufficient-data', title: 'Requires Review — Insufficient Data', description: 'Students lacking placement assessment data for full analysis', icon: Database, color: 'info', test: (s) => { const a = analyticsMap.get(s.id); return a?.insufficientData ?? false; } },
    ];

    return configs.map((cfg) => {
      const students = filteredStudents.filter(cfg.test);
      return { ...cfg, count: students.length, students };
    });
  }, [filteredStudents, analyticsMap]);

  const activeData = segments.find((s) => s.key === activeSegment);
  const visibleStudents = activeData?.students ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-midnight-50">Predictive Intelligence</h1>
        <p className="text-sm text-midnight-400 mt-0.5">
          Rule-based risk segmentation and pattern detection across the student population
        </p>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-info/20 bg-info/5 px-4 py-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
        <p className="text-xs text-midnight-300">
          <span className="font-medium text-info">Note:</span> These risk assessments use transparent, deterministic rules — not trained machine-learning models.
          Categories reflect current data patterns and scoring thresholds. They do not represent predictive probabilities or causal claims.
        </p>
      </div>

      <FilterBar />

      {/* Segment cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {segments.map((seg) => {
          const Icon = seg.icon;
          const isActive = activeSegment === seg.key;
          return (
            <Card
              key={seg.key}
              hover
              onClick={() => setActiveSegment(isActive ? 'all' : seg.key)}
              className={`p-4 ${isActive ? 'border-teal-500/50 bg-teal-500/5' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`rounded-lg p-2 ${
                  seg.color === 'teal' ? 'bg-teal-500/15 text-teal-400' :
                  seg.color === 'violet' ? 'bg-violet-400/15 text-violet-400' :
                  seg.color === 'warning' ? 'bg-warning/15 text-warning' :
                  seg.color === 'danger' ? 'bg-danger/15 text-danger' :
                  'bg-info/15 text-info'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-2xl font-bold text-midnight-100">{seg.count}</span>
              </div>
              <h3 className="text-sm font-semibold text-midnight-100">{seg.title}</h3>
              <p className="text-xs text-midnight-400 mt-1">{seg.description}</p>
            </Card>
          );
        })}
      </div>

      {/* Student list for active segment */}
      {activeData && (
        <Card>
          <CardHeader
            title={activeData.title}
            subtitle={`${visibleStudents.length} students matching this pattern`}
            icon={<activeData.icon className="w-4 h-4" />}
          />
          <CardBody>
            {visibleStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-midnight-400">
                <Users className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No students match this pattern with current filters</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {visibleStudents.map((student) => {
                  const a = analyticsMap.get(student.id);
                  if (!a) return null;
                  return (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className="flex w-full items-center justify-between rounded-lg border border-midnight-700/40 bg-midnight-800/30 px-3 py-2.5 text-left transition-colors hover:border-midnight-600 hover:bg-midnight-700/20"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-midnight-100 truncate">{student.name}</p>
                          <p className="text-xs text-midnight-400 truncate">{student.id} · {student.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden md:flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-[10px] text-midnight-500">Success</p>
                            <p className={`text-sm font-bold ${getScoreColor(a.successScore.total)}`}>{formatScore(a.successScore.total)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-midnight-500">Placement</p>
                            <p className={`text-sm font-bold ${getScoreColor(a.placementReadiness.total)}`}>{formatScore(a.placementReadiness.total)}</p>
                          </div>
                        </div>
                        <RiskBadge category={a.risk.academicRisk} size="sm" />
                        <RiskBadge category={a.risk.placementRisk} size="sm" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Risk explanation */}
            <div className="mt-4 rounded-lg border border-midnight-700/40 bg-midnight-800/20 p-3">
              <h4 className="text-xs font-semibold text-midnight-200 mb-2 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-teal-400" />
                How this segment is identified
              </h4>
              <p className="text-xs text-midnight-400">{getSegmentExplanation(activeSegment)}</p>
            </div>
          </CardBody>
        </Card>
      )}

      {!activeData && (
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-12 text-center">
            <Brain className="w-10 h-10 text-midnight-600 mb-3" />
            <p className="text-sm text-midnight-300 mb-1">Select a segment above to view matching students</p>
            <p className="text-xs text-midnight-500">Each segment uses deterministic rules based on scoring thresholds and trend analysis</p>
          </CardBody>
        </Card>
      )}

      <StudentProfile student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  );
}

function getSegmentExplanation(key: string): string {
  const explanations: Record<string, string> = {
    'declining-attendance': 'Identified by comparing attendance across the last 3 semesters. A decline of more than 10 percentage points triggers this flag. This is a leading indicator of academic disengagement.',
    'weak-assessments': 'Flagged when any subject assessment mark falls below 45%. Multiple weak subjects indicate a need for targeted subject tutoring.',
    'strong-academics-low-placement': 'Students with CGPA ≥ 7.5 (strong academic performance) but Placement Readiness Score < 60. This gap suggests a need for focused placement preparation alongside academic studies.',
    'strong-tech-weak-interview': 'Students with coding scores ≥ 65 but mock interview scores < 55. This pattern indicates technical competence that is not translating into interview performance — communication coaching and mock interview practice are recommended.',
    'placement-ready': 'Students with Placement Readiness Score ≥ 70 and sufficient data across all placement indicators. These students are candidates for advanced placement opportunities and can serve as peer mentors.',
    'insufficient-data': 'Students missing placement assessment scores (aptitude, coding, mock interview) or with overall data completeness below 50%. Full risk analysis cannot be performed until this data is collected.',
  };
  return explanations[key] || 'Segment explanation not available.';
}
