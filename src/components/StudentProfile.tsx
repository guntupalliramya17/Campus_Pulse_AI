import { useAppStore } from '@/store/AppStore';
import type { StudentRecord } from '@/types';
import { Modal } from './ui/Modal';
import { RiskBadge, Badge } from './ui/Badge';
import { Progress, ScoreRing } from './ui/Progress';
import { Button } from './ui/Form';
import { formatScore, getScoreColor, formatDate } from '@/utils/format';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  GraduationCap, BookOpen, Calendar, Monitor, Award, TrendingUp,
  AlertTriangle, CheckCircle, Clock, Activity, Target, FileText,
} from 'lucide-react';

interface StudentProfileProps {
  student: StudentRecord | null;
  onClose: () => void;
  onNavigateToIntervention?: (studentId: string) => void;
}

export function StudentProfile({ student, onClose, onNavigateToIntervention }: StudentProfileProps) {
  const { analyticsMap, interventions } = useAppStore();

  if (!student) return null;
  const analytics = analyticsMap.get(student.id);
  if (!analytics) return null;

  const { successScore, placementReadiness, risk } = analytics;

  // Chart data
  const scoreBreakdownData = successScore.components.map((c) => ({
    name: c.label,
    value: Math.round(c.rawValue),
    fill: c.isMissing ? '#4d6fa0' : c.rawValue >= 75 ? '#00b894' : c.rawValue >= 60 ? '#f0a020' : '#e23856',
  }));

  const trendData = student.semesterTrends.map((t) => ({
    semester: `S${t.semester}`,
    sgpa: t.sgpa,
    attendance: t.attendance,
  }));

  const placementRadarData = placementReadiness.components
    .filter((c) => !c.isMissing)
    .map((c) => ({
      subject: c.label,
      value: Math.round(c.rawValue),
      fullMark: 100,
    }));

  const subjectAttendanceData = student.subjectAttendance.map((s) => ({
    name: s.subject.length > 15 ? s.subject.slice(0, 13) + '…' : s.subject,
    attendance: s.attendance,
  }));

  const studentInterventions = interventions.filter((i) => i.studentId === student.id);

  // Activity timeline
  const timeline: { date: string; event: string; icon: typeof BookOpen }[] = [];
  for (const t of student.semesterTrends) {
    timeline.push({ date: `Semester ${t.semester}`, event: `SGPA: ${t.sgpa} | Attendance: ${t.attendance}%`, icon: GraduationCap });
  }
  if (student.certificationCount > 0) {
    timeline.push({ date: 'Current', event: `${student.certificationCount} certification(s) completed`, icon: Award });
  }
  if (student.eventParticipation > 0) {
    timeline.push({ date: 'Current', event: `${student.eventParticipation} event(s) participated`, icon: Activity });
  }
  for (const iv of studentInterventions) {
    timeline.push({ date: formatDate(iv.createdAt), event: `Intervention ${iv.status}: ${iv.type.replace(/-/g, ' ')}`, icon: Target });
  }

  return (
    <Modal
      open={!!student}
      onClose={onClose}
      title={`Student Profile — ${student.name}`}
      size="xl"
      footer={
        <>
          {onNavigateToIntervention && (
            <Button variant="secondary" icon={<Target className="w-4 h-4" />} onClick={() => onNavigateToIntervention(student.id)}>
              Simulate Intervention
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Close</Button>
        </>
      }
    >
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Identity */}
        <div className="md:col-span-1 space-y-3">
          <div className="rounded-lg border border-midnight-700/50 bg-midnight-800/40 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-full bg-teal-500/15 p-2.5">
                <GraduationCap className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h3 className="font-semibold text-midnight-50">{student.name}</h3>
                <p className="text-xs text-midnight-400">{student.id}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-midnight-400">Department</span><span className="text-midnight-200">{student.department}</span></div>
              <div className="flex justify-between"><span className="text-midnight-400">Year / Semester</span><span className="text-midnight-200">Year {student.academicYear} · Sem {student.semester}</span></div>
              <div className="flex justify-between"><span className="text-midnight-400">CGPA</span><span className="text-midnight-200">{student.cgpa}/10</span></div>
              <div className="flex justify-between"><span className="text-midnight-400">Placement</span><span className="text-midnight-200 capitalize">{student.placementStatus.replace('-', ' ')}</span></div>
              <div className="flex justify-between"><span className="text-midnight-400">Data Source</span><span className="text-midnight-200">{student.isSynthetic ? 'Synthetic Demo' : 'Imported'}</span></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant={student.isSynthetic ? 'info' : 'teal'} size="sm">{student.isSynthetic ? 'Demo Data' : 'Imported'}</Badge>
              <Badge variant="violet" size="sm">{analytics.segment.replace(/-/g, ' ')}</Badge>
            </div>
          </div>
        </div>

        {/* Success Score */}
        <div className="rounded-lg border border-midnight-700/50 bg-midnight-800/40 p-4 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold uppercase text-midnight-300 mb-2">Student Success Score</p>
          <ScoreRing value={successScore.total} size={100} color={successScore.total >= 75 ? 'teal' : successScore.total >= 60 ? 'warning' : 'danger'} label="out of 100" />
          <div className="mt-2 text-xs text-midnight-400">Data completeness: {successScore.dataCompleteness}%</div>
          <div className="mt-2 w-full space-y-1">
            {successScore.topPositiveContributor && (
              <div className="flex items-center gap-1 text-xs text-teal-300">
                <CheckCircle className="w-3 h-3" /> {successScore.topPositiveContributor.label}
              </div>
            )}
            {successScore.topNegativeContributor && (
              <div className="flex items-center gap-1 text-xs text-orange-400">
                <AlertTriangle className="w-3 h-3" /> {successScore.topNegativeContributor.label}
              </div>
            )}
          </div>
        </div>

        {/* Placement Readiness */}
        <div className="rounded-lg border border-midnight-700/50 bg-midnight-800/40 p-4 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold uppercase text-midnight-300 mb-2">Placement Readiness</p>
          <ScoreRing
            value={placementReadiness.total ?? 0}
            size={100}
            color={placementReadiness.isReady ? 'teal' : placementReadiness.total != null ? 'warning' : 'danger'}
            label={placementReadiness.total == null ? 'No data' : 'out of 100'}
          />
          <div className="mt-2 text-xs text-midnight-400">Data completeness: {placementReadiness.dataCompleteness}%</div>
          <div className="mt-2 w-full space-y-1">
            {placementReadiness.topStrength && (
              <div className="flex items-center gap-1 text-xs text-teal-300">
                <CheckCircle className="w-3 h-3" /> {placementReadiness.topStrength.label}
              </div>
            )}
            {placementReadiness.topGap && (
              <div className="flex items-center gap-1 text-xs text-orange-400">
                <AlertTriangle className="w-3 h-3" /> {placementReadiness.topGap.label}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Risk assessment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg border border-midnight-700/50 bg-midnight-800/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <h4 className="text-sm font-semibold text-midnight-100">Academic Risk</h4>
            <RiskBadge category={risk.academicRisk} size="sm" />
          </div>
          <ul className="space-y-1.5 text-xs text-midnight-300">
            {risk.academicRiskReasons.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-midnight-500 mt-0.5">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-midnight-700/50 bg-midnight-800/40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-violet-400" />
            <h4 className="text-sm font-semibold text-midnight-100">Placement Risk</h4>
            <RiskBadge category={risk.placementRisk} size="sm" />
          </div>
          <ul className="space-y-1.5 text-xs text-midnight-300">
            {risk.placementRiskReasons.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-midnight-500 mt-0.5">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Score breakdown chart */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-midnight-100 mb-3 flex items-center gap-2">
          <BarChart className="w-4 h-4 text-teal-400" />
          Score Component Breakdown
        </h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={scoreBreakdownData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f3556" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b89b8' }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b89b8' }} />
            <Tooltip
              contentStyle={{ background: '#0d1a33', border: '1px solid #1f3556', borderRadius: '8px', fontSize: '12px' }}
              cursor={{ fill: '#1f355640' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trends + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div>
          <h4 className="text-sm font-semibold text-midnight-100 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            Semester Trends (SGPA & Attendance)
          </h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f3556" />
              <XAxis dataKey="semester" tick={{ fontSize: 10, fill: '#6b89b8' }} />
              <YAxis yAxisId="left" domain={[0, 10]} tick={{ fontSize: 10, fill: '#6b89b8' }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b89b8' }} />
              <Tooltip contentStyle={{ background: '#0d1a33', border: '1px solid #1f3556', borderRadius: '8px', fontSize: '12px' }} />
              <Line yAxisId="left" type="monotone" dataKey="sgpa" stroke="#00b894" strokeWidth={2} dot={{ r: 3 }} name="SGPA" />
              <Line yAxisId="right" type="monotone" dataKey="attendance" stroke="#a85bf0" strokeWidth={2} dot={{ r: 3 }} name="Attendance %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-midnight-100 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-400" />
            Placement Readiness Radar
          </h4>
          {placementRadarData.length > 2 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={placementRadarData}>
                <PolarGrid stroke="#1f3556" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#6b89b8' }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#4d6fa0' }} />
                <Radar dataKey="value" stroke="#a85bf0" fill="#a85bf0" fillOpacity={0.3} strokeWidth={2} />
                <Tooltip contentStyle={{ background: '#0d1a33', border: '1px solid #1f3556', borderRadius: '8px', fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-sm text-midnight-400">
              Insufficient placement data for radar chart
            </div>
          )}
        </div>
      </div>

      {/* Subject attendance + LMS indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div>
          <h4 className="text-sm font-semibold text-midnight-100 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-400" />
            Subject-wise Attendance
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={subjectAttendanceData} layout="vertical" margin={{ top: 0, right: 10, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f3556" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b89b8' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#6b89b8' }} width={80} />
              <Tooltip contentStyle={{ background: '#0d1a33', border: '1px solid #1f3556', borderRadius: '8px', fontSize: '12px' }} cursor={{ fill: '#1f355640' }} />
              <Bar dataKey="attendance" fill="#00b894" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-midnight-100 mb-3 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-violet-400" />
            Engagement & Skills Indicators
          </h4>
          <div className="space-y-3">
            <IndicatorRow icon={<Monitor className="w-3.5 h-3.5" />} label="LMS Logins / week" value={String(student.lmsLoginFrequency)} />
            <IndicatorRow icon={<FileText className="w-3.5 h-3.5" />} label="Assignment Completion" value={`${student.assignmentCompletion}%`} progress={student.assignmentCompletion} />
            <IndicatorRow icon={<Award className="w-3.5 h-3.5" />} label="Certifications" value={String(student.certificationCount)} />
            <IndicatorRow icon={<Activity className="w-3.5 h-3.5" />} label="Event Participation" value={String(student.eventParticipation)} />
            <IndicatorRow icon={<BookOpen className="w-3.5 h-3.5" />} label="Feedback Rating" value={`${student.feedbackRating}/5`} progress={(student.feedbackRating / 5) * 100} />
            {student.aptitudeScore != null && <IndicatorRow icon={<Target className="w-3.5 h-3.5" />} label="Aptitude Score" value={formatScore(student.aptitudeScore)} progress={student.aptitudeScore} />}
            {student.codingScore != null && <IndicatorRow icon={<Target className="w-3.5 h-3.5" />} label="Coding Score" value={formatScore(student.codingScore)} progress={student.codingScore} />}
            {student.mockInterviewScore != null && <IndicatorRow icon={<Target className="w-3.5 h-3.5" />} label="Mock Interview" value={formatScore(student.mockInterviewScore)} progress={student.mockInterviewScore} />}
            {student.technicalSkillRating != null && <IndicatorRow icon={<Target className="w-3.5 h-3.5" />} label="Technical Skill" value={`${student.technicalSkillRating}/5`} progress={(student.technicalSkillRating / 5) * 100} />}
            {student.communicationSkillRating != null && <IndicatorRow icon={<Target className="w-3.5 h-3.5" />} label="Communication" value={`${student.communicationSkillRating}/5`} progress={(student.communicationSkillRating / 5) * 100} />}
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div className="mb-6 rounded-lg border border-midnight-700/50 bg-midnight-800/40 p-4">
        <h4 className="text-sm font-semibold text-midnight-100 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-teal-400" />
          Student Feedback
        </h4>
        <p className="text-sm text-midnight-300 italic">{student.studentFeedback}</p>
      </div>

      {/* Intervention history */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-midnight-100 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-400" />
          Intervention History
        </h4>
        {studentInterventions.length > 0 ? (
          <div className="space-y-2">
            {studentInterventions.map((iv) => (
              <div key={iv.id} className="flex items-center justify-between rounded-lg border border-midnight-700/40 bg-midnight-800/30 px-3 py-2 text-xs">
                <div>
                  <span className="font-medium text-midnight-100">{iv.type.replace(/-/g, ' ')}</span>
                  <span className="text-midnight-400 ml-2">{iv.reason}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-midnight-400">{formatDate(iv.followUpDate)}</span>
                  <Badge variant={iv.status === 'completed' ? 'teal' : iv.status === 'in-progress' ? 'violet' : 'info'} size="sm">
                    {iv.status.replace(/-/g, ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-midnight-400">No interventions recorded for this student yet.</p>
        )}
      </div>

      {/* Activity Timeline */}
      <div>
        <h4 className="text-sm font-semibold text-midnight-100 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-400" />
          Activity Timeline
        </h4>
        <div className="relative pl-6 space-y-3 before:content-[''] before:absolute before:left-2 before:top-1 before:bottom-1 before:w-px before:bg-midnight-700">
          {timeline.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="relative">
                <div className="absolute -left-6 top-0.5 rounded-full bg-midnight-700 p-1">
                  <Icon className="w-3 h-3 text-teal-400" />
                </div>
                <p className="text-xs font-medium text-midnight-200">{item.date}</p>
                <p className="text-xs text-midnight-400">{item.event}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended next action */}
      <div className="mt-6 rounded-lg border border-teal-500/20 bg-teal-500/5 p-4">
        <h4 className="text-sm font-semibold text-teal-300 mb-1 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Recommended Next Action
        </h4>
        <p className="text-sm text-midnight-200">{getRecommendedAction(analytics)}</p>
      </div>
    </Modal>
  );
}

function IndicatorRow({ icon, label, value, progress }: { icon: React.ReactNode; label: string; value: string; progress?: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-midnight-400">{icon}</span>
      <span className="text-xs text-midnight-300 flex-1">{label}</span>
      <span className="text-xs font-medium text-midnight-100 w-16 text-right">{value}</span>
      {progress != null && (
        <div className="w-20">
          <Progress value={progress} size="sm" color={progress >= 75 ? 'teal' : progress >= 50 ? 'warning' : 'danger'} />
        </div>
      )}
    </div>
  );
}

function getRecommendedAction(analytics: import('@/types').StudentAnalytics): string {
  if (analytics.insufficientData) {
    return 'Collect placement assessment data (aptitude, coding, mock interview scores) to enable full risk analysis and intervention planning.';
  }
  if (analytics.risk.academicRisk === 'critical') {
    return 'Immediate academic support required — schedule mandatory mentoring sessions and attendance recovery plan.';
  }
  if (analytics.risk.academicRisk === 'high') {
    return 'Initiate subject tutoring and attendance mentoring within the next week to prevent further decline.';
  }
  if (analytics.strongAcademicsLowPlacement) {
    return 'Enroll in placement readiness bootcamp focusing on aptitude, coding, and mock interview practice.';
  }
  if (analytics.strongTechWeakInterview) {
    return 'Communication coaching and mock interview sessions to translate technical skills into interview success.';
  }
  if (analytics.risk.placementRisk === 'high') {
    return 'Intensive placement preparation needed — coding practice, aptitude training, and mock interviews.';
  }
  if (analytics.decliningAttendance) {
    return 'Attendance monitoring and mentoring to reverse the declining trend before it impacts academics.';
  }
  if (analytics.risk.academicRisk === 'low' && analytics.risk.placementRisk === 'low') {
    return 'No urgent action needed — student is performing well. Consider advanced certification or mentorship opportunities.';
  }
  return 'Continue monitoring and provide targeted support based on weakest score components.';
}
