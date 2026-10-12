import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/AppStore';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge, StatusBadge, RiskBadge } from '@/components/ui/Badge';
import { Slider, Button, Select, TextInput } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import { Progress } from '@/components/ui/Progress';
import { recommendInterventions, getInterventionOutcome } from '@/utils/analytics';
import type { InterventionRecord, InterventionType, InterventionStatus } from '@/types';
import { generateId, formatDate, formatScore, getScoreColor } from '@/utils/format';
import {
  Layers, Clock, User, Calendar, CheckCircle, AlertTriangle,
  TrendingUp, Info, Zap, ArrowRight,
} from 'lucide-react';

const INTERVENTION_LABELS: Record<InterventionType, string> = {
  'attendance-mentoring': 'Attendance Mentoring',
  'subject-tutoring': 'Subject Tutoring',
  'assignment-recovery': 'Assignment Recovery',
  'coding-practice': 'Coding Practice',
  'aptitude-training': 'Aptitude Training',
  'mock-interviews': 'Mock Interviews',
  'communication-coaching': 'Communication Coaching',
  'certification-program': 'Certification Program',
};

export function ResourceOptimizer() {
  const { students, analyticsMap, interventions, addIntervention, updateIntervention, config, recommendations } = useAppStore();
  const [budget, setBudget] = useState(config.defaultFacultyHours);
  const [editingIntervention, setEditingIntervention] = useState<InterventionRecord | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(
    new Set(interventions.map((i) => `${i.studentId}-${i.type}`))
  );

  const rankedRecs = useMemo(
    () => recommendInterventions(students, analyticsMap, budget),
    [students, analyticsMap, budget]
  );

  const totalRecommendedHours = rankedRecs.reduce((s, r) => s + r.estimatedHours, 0);
  const allRecs = useMemo(
    () => recommendInterventions(students, analyticsMap, 99999),
    [students, analyticsMap]
  );

  const handleAccept = (rec: typeof rankedRecs[number]) => {
    const student = students.find((s) => s.id === rec.studentId);
    if (!student) return;
    const analytics = analyticsMap.get(rec.studentId);
    const newIntervention: InterventionRecord = {
      id: generateId('iv-'),
      studentId: rec.studentId,
      type: rec.type,
      status: 'accepted',
      reason: rec.reason,
      estimatedHours: rec.estimatedHours,
      assignedFaculty: null,
      followUpDate: null,
      acceptedDate: new Date().toISOString(),
      completedDate: null,
      beforeSuccessScore: analytics?.successScore.total ?? null,
      afterSuccessScore: null,
      beforePlacementScore: analytics?.placementReadiness.total ?? null,
      afterPlacementScore: null,
      outcomeNotes: getInterventionOutcome(rec.type),
      createdAt: new Date().toISOString(),
    };
    addIntervention(newIntervention);
    setAcceptedIds((prev) => new Set(prev).add(`${rec.studentId}-${rec.type}`));
  };

  const handleSaveIntervention = (updated: InterventionRecord) => {
    updateIntervention(updated);
    setEditingIntervention(null);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-midnight-50">Resource Optimizer</h1>
        <p className="text-sm text-midnight-400 mt-0.5">
          Prioritized intervention queue within faculty capacity constraints
        </p>
      </div>

      {/* Budget control */}
      <Card>
        <CardHeader title="Faculty Hours Budget" subtitle="Set available faculty capacity for interventions" icon={<Clock className="w-4 h-4" />} />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <Slider
                label="Available faculty hours"
                value={budget}
                onChange={setBudget}
                min={10}
                max={500}
                step={5}
                unit="hrs"
              />
            </div>
            <div className="rounded-lg border border-midnight-700/40 bg-midnight-800/30 p-3 text-center">
              <p className="text-xs text-midnight-400">Recommended Utilization</p>
              <p className="text-2xl font-bold text-teal-400">{totalRecommendedHours}<span className="text-sm text-midnight-400">/{budget} hrs</span></p>
              <Progress value={(totalRecommendedHours / budget) * 100} color={totalRecommendedHours > budget ? 'danger' : 'teal'} size="sm" className="mt-2" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-midnight-700/40 bg-midnight-800/20 p-2">
              <p className="text-xs text-midnight-400">Interventions in budget</p>
              <p className="text-lg font-bold text-midnight-100">{rankedRecs.length}</p>
            </div>
            <div className="rounded-lg border border-midnight-700/40 bg-midnight-800/20 p-2">
              <p className="text-xs text-midnight-400">Total recommendations</p>
              <p className="text-lg font-bold text-midnight-100">{allRecs.length}</p>
            </div>
            <div className="rounded-lg border border-midnight-700/40 bg-midnight-800/20 p-2">
              <p className="text-xs text-midnight-400">Already accepted</p>
              <p className="text-lg font-bold text-violet-400">{interventions.length}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Recommendation queue */}
      <Card>
        <CardHeader
          title="Prioritized Intervention Queue"
          subtitle={`${rankedRecs.length} interventions within ${budget} faculty hours — ranked by risk severity, gap size, and evidence quality`}
          icon={<Zap className="w-4 h-4" />}
        />
        <CardBody>
          {rankedRecs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-midnight-400">
              <CheckCircle className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No interventions needed within current filters and budget</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rankedRecs.map((rec, i) => {
                const student = students.find((s) => s.id === rec.studentId);
                if (!student) return null;
                const analytics = analyticsMap.get(rec.studentId);
                const isAccepted = acceptedIds.has(`${rec.studentId}-${rec.type}`);
                return (
                  <div
                    key={`${rec.studentId}-${rec.type}-${i}`}
                    className="flex flex-col md:flex-row md:items-center gap-3 rounded-lg border border-midnight-700/40 bg-midnight-800/30 px-4 py-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xs font-bold text-midnight-500 w-6 shrink-0">#{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-midnight-100 truncate">
                          {student.name} <span className="text-midnight-400 font-normal">· {student.id}</span>
                        </p>
                        <p className="text-xs text-midnight-400 truncate">
                          {INTERVENTION_LABELS[rec.type]} — {rec.reason}
                        </p>
                        <p className="text-xs text-teal-300/70 mt-0.5">Target: {rec.intendedOutcome}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {analytics && <RiskBadge category={analytics.risk.academicRisk} size="sm" />}
                      <div className="text-center">
                        <p className="text-[10px] text-midnight-500">Hours</p>
                        <p className="text-sm font-bold text-midnight-100">{rec.estimatedHours}</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-[10px] text-midnight-500">Priority</p>
                        <p className="text-sm font-bold text-violet-400">{Math.round(rec.priorityScore)}</p>
                      </div>
                      {isAccepted ? (
                        <Badge variant="teal" size="sm"><CheckCircle className="w-3 h-3 mr-1 inline" />Accepted</Badge>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<CheckCircle className="w-3.5 h-3.5" />}
                          onClick={() => handleAccept(rec)}
                        >
                          Accept
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-3 text-xs text-midnight-500 italic">
            Prioritization uses risk severity, identified skill gaps, intervention suitability, and evidence quality (data completeness).
            These are recommendations, not proven interventions.
          </p>
        </CardBody>
      </Card>

      {/* Accepted interventions management */}
      {interventions.length > 0 && (
        <Card>
          <CardHeader title="Accepted Interventions" subtitle="Manage status, faculty assignments, and follow-ups" icon={<Layers className="w-4 h-4" />} />
          <CardBody>
            <div className="space-y-2">
              {interventions.map((iv) => {
                const student = students.find((s) => s.id === iv.studentId);
                return (
                  <div
                    key={iv.id}
                    className="flex flex-col md:flex-row md:items-center gap-3 rounded-lg border border-midnight-700/40 bg-midnight-800/30 px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-midnight-100 truncate">
                        {student?.name || iv.studentId} <span className="text-midnight-400 font-normal">· {INTERVENTION_LABELS[iv.type]}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-midnight-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{iv.estimatedHours} hrs</span>
                        {iv.assignedFaculty && <span className="flex items-center gap-1"><User className="w-3 h-3" />{iv.assignedFaculty}</span>}
                        {iv.followUpDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(iv.followUpDate)}</span>}
                      </div>
                    </div>
                    <StatusBadge status={iv.status} size="sm" />
                    <Button variant="outline" size="sm" onClick={() => setEditingIntervention(iv)}>
                      Manage
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Edit intervention modal */}
      {editingIntervention && (
        <InterventionEditModal
          intervention={editingIntervention}
          studentName={students.find((s) => s.id === editingIntervention.studentId)?.name || editingIntervention.studentId}
          onSave={handleSaveIntervention}
          onClose={() => setEditingIntervention(null)}
        />
      )}
    </div>
  );
}

function InterventionEditModal({
  intervention,
  studentName,
  onSave,
  onClose,
}: {
  intervention: InterventionRecord;
  studentName: string;
  onSave: (iv: InterventionRecord) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<InterventionStatus>(intervention.status);
  const [assignedFaculty, setAssignedFaculty] = useState(intervention.assignedFaculty || '');
  const [followUpDate, setFollowUpDate] = useState(intervention.followUpDate?.split('T')[0] || '');
  const [afterSuccessScore, setAfterSuccessScore] = useState(intervention.afterSuccessScore?.toString() || '');
  const [afterPlacementScore, setAfterPlacementScore] = useState(intervention.afterPlacementScore?.toString() || '');
  const [outcomeNotes, setOutcomeNotes] = useState(intervention.outcomeNotes);

  const handleSave = () => {
    onSave({
      ...intervention,
      status,
      assignedFaculty: assignedFaculty || null,
      followUpDate: followUpDate || null,
      afterSuccessScore: afterSuccessScore ? Number(afterSuccessScore) : null,
      afterPlacementScore: afterPlacementScore ? Number(afterPlacementScore) : null,
      outcomeNotes,
      completedDate: status === 'completed' ? new Date().toISOString() : intervention.completedDate,
    });
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Manage Intervention — ${studentName}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Changes</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-midnight-700/40 bg-midnight-800/30 p-3">
          <p className="text-xs text-midnight-400">Intervention</p>
          <p className="text-sm font-medium text-midnight-100">{INTERVENTION_LABELS[intervention.type]}</p>
          <p className="text-xs text-midnight-400 mt-1">{intervention.reason}</p>
        </div>

        <Select
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as InterventionStatus)}
          options={[
            { value: 'recommended', label: 'Recommended' },
            { value: 'accepted', label: 'Accepted' },
            { value: 'in-progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'on-hold', label: 'On Hold' },
            { value: 'declined', label: 'Declined' },
          ]}
        />

        <TextInput
          label="Assigned Faculty Member"
          value={assignedFaculty}
          onChange={setAssignedFaculty}
          placeholder="e.g. Prof. Sharma"
        />

        <TextInput
          label="Follow-up Date"
          type="date"
          value={followUpDate}
          onChange={setFollowUpDate}
        />

        {intervention.beforeSuccessScore != null && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-midnight-700/40 bg-midnight-800/20 p-3 text-center">
              <p className="text-xs text-midnight-400">Before — Success Score</p>
              <p className={`text-lg font-bold ${getScoreColor(intervention.beforeSuccessScore)}`}>{formatScore(intervention.beforeSuccessScore)}</p>
            </div>
            <div>
              <TextInput
                label="After — Success Score"
                type="number"
                value={afterSuccessScore}
                onChange={setAfterSuccessScore}
                placeholder="Enter observed score"
                min={0}
                max={100}
              />
            </div>
          </div>
        )}

        {intervention.beforePlacementScore != null && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-midnight-700/40 bg-midnight-800/20 p-3 text-center">
              <p className="text-xs text-midnight-400">Before — Placement</p>
              <p className={`text-lg font-bold ${getScoreColor(intervention.beforePlacementScore)}`}>{formatScore(intervention.beforePlacementScore)}</p>
            </div>
            <div>
              <TextInput
                label="After — Placement Score"
                type="number"
                value={afterPlacementScore}
                onChange={setAfterPlacementScore}
                placeholder="Enter observed score"
                min={0}
                max={100}
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-midnight-300 mb-1 block">Outcome Notes</label>
          <textarea
            value={outcomeNotes}
            onChange={(e) => setOutcomeNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-midnight-700 bg-midnight-800/60 px-3 py-2 text-sm text-midnight-100 outline-none transition-colors focus:border-teal-500"
          />
        </div>

        <div className="rounded-lg border border-info/20 bg-info/5 px-3 py-2">
          <p className="text-xs text-midnight-300 flex items-start gap-1.5">
            <Info className="w-3 h-3 text-info shrink-0 mt-0.5" />
            Before-and-after scores reflect observed changes, not proven causal effects. Multiple factors influence student performance.
          </p>
        </div>
      </div>
    </Modal>
  );
}
