import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/AppStore';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button, Select, TextInput } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import type { InterventionRecord, InterventionStatus } from '@/types';
import { formatDate, formatScore, getScoreColor, isOverdue, daysUntil } from '@/utils/format';
import {
  Clock, CheckCircle, AlertTriangle, Calendar, User,
  RefreshCw, Info, BarChart3, Target,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const INTERVENTION_LABELS: Record<string, string> = {
  'attendance-mentoring': 'Attendance Mentoring', 'subject-tutoring': 'Subject Tutoring',
  'assignment-recovery': 'Assignment Recovery', 'coding-practice': 'Coding Practice',
  'aptitude-training': 'Aptitude Training', 'mock-interviews': 'Mock Interviews',
  'communication-coaching': 'Communication Coaching', 'certification-program': 'Certification Program',
};

export function OutcomesImpact() {
  const { interventions, students, updateIntervention, resetAllData } = useAppStore();
  const [editing, setEditing] = useState<InterventionRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<InterventionStatus | 'all'>('all');

  const filtered = useMemo(() => statusFilter === 'all' ? interventions : interventions.filter((i) => i.status === statusFilter), [interventions, statusFilter]);

  const stats = useMemo(() => {
    const total = interventions.length;
    const completed = interventions.filter((i) => i.status === 'completed').length;
    const inProgress = interventions.filter((i) => i.status === 'in-progress').length;
    const accepted = interventions.filter((i) => i.status === 'accepted').length;
    const overdue = interventions.filter((i) => isOverdue(i.followUpDate) && i.status !== 'completed' && i.status !== 'declined').length;
    const withOutcomes = interventions.filter((i) => i.afterSuccessScore != null);
    return { total, completed, inProgress, accepted, overdue, withOutcomes: withOutcomes.length };
  }, [interventions]);

  const beforeAfterData = useMemo(() => interventions
    .filter((i) => i.afterSuccessScore != null && i.beforeSuccessScore != null)
    .map((i) => ({ name: students.find((s) => s.id === i.studentId)?.name?.split(' ')[0] || i.studentId.slice(-4), before: i.beforeSuccessScore, after: i.afterSuccessScore }))
    .slice(0, 10), [interventions, students]);

  const handleSave = (updated: InterventionRecord) => { updateIntervention(updated); setEditing(null); };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-midnight-50">Outcomes & Impact</h1>
        <p className="text-sm text-midnight-400 mt-0.5">Track intervention status, follow-ups, and observed changes</p>
      </div>

      <div className="rounded-lg border border-info/20 bg-info/5 px-4 py-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
        <p className="text-xs text-midnight-300">Before-and-after scores reflect observed changes, not proven causal effects. Multiple factors influence student performance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-midnight-100' },
          { label: 'Accepted', value: stats.accepted, color: 'text-info' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-violet-400' },
          { label: 'Completed', value: stats.completed, color: 'text-teal-400' },
          { label: 'Overdue', value: stats.overdue, color: 'text-danger' },
          { label: 'With Outcomes', value: stats.withOutcomes, color: 'text-warning' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-midnight-700/60 bg-midnight-800/40 p-3">
            <p className="text-xs text-midnight-400 uppercase">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {beforeAfterData.length > 0 && (
        <Card>
          <CardHeader title="Before & After" subtitle="Observed score changes for interventions with recorded outcomes" icon={<BarChart3 className="w-4 h-4" />} />
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={beforeAfterData} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f3556" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b89b8' }} angle={-20} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b89b8' }} />
                <Tooltip contentStyle={{ background: '#0d1a33', border: '1px solid #1f3556', borderRadius: '8px', fontSize: '12px' }} cursor={{ fill: '#1f355640' }} />
                <Bar dataKey="before" fill="#4d6fa0" radius={[4, 4, 0, 0]} name="Before" />
                <Bar dataKey="after" fill="#00b894" radius={[4, 4, 0, 0]} name="After" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        <Select value={statusFilter} onChange={(v) => setStatusFilter(v as InterventionStatus | 'all')} options={[
          { value: 'all', label: 'All Statuses' }, { value: 'recommended', label: 'Recommended' },
          { value: 'accepted', label: 'Accepted' }, { value: 'in-progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' }, { value: 'on-hold', label: 'On Hold' },
          { value: 'declined', label: 'Declined' },
        ]} className="min-w-[160px]" />
        <Button variant="ghost" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={resetAllData}>Reset All Data</Button>
      </div>

      <Card>
        <CardHeader title="Intervention Tracking" subtitle={`${filtered.length} interventions`} icon={<Target className="w-4 h-4" />} />
        <CardBody>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-midnight-400">
              <CheckCircle className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No interventions to track yet. Accept interventions from the Resource Optimizer or Intervention Lab.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((iv) => {
                const student = students.find((s) => s.id === iv.studentId);
                const overdue = isOverdue(iv.followUpDate) && iv.status !== 'completed' && iv.status !== 'declined';
                const days = daysUntil(iv.followUpDate);
                const delta = iv.afterSuccessScore != null && iv.beforeSuccessScore != null ? iv.afterSuccessScore - iv.beforeSuccessScore : null;
                return (
                  <div key={iv.id} className={`rounded-lg border px-4 py-3 ${overdue ? 'border-danger/30 bg-danger/5' : 'border-midnight-700/40 bg-midnight-800/30'}`}>
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-midnight-100">{student?.name || iv.studentId}</p>
                          <Badge variant="violet" size="sm">{INTERVENTION_LABELS[iv.type] || iv.type}</Badge>
                          <StatusBadge status={iv.status} size="sm" />
                          {overdue && <Badge variant="danger" size="sm"><AlertTriangle className="w-3 h-3 mr-1 inline" />Overdue</Badge>}
                        </div>
                        <p className="text-xs text-midnight-400 mt-1">{iv.reason}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-midnight-400">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{iv.estimatedHours} hrs</span>
                          {iv.assignedFaculty && <span className="flex items-center gap-1"><User className="w-3 h-3" />{iv.assignedFaculty}</span>}
                          {iv.followUpDate && <span className={`flex items-center gap-1 ${overdue ? 'text-danger' : days != null && days < 7 ? 'text-warning' : ''}`}><Calendar className="w-3 h-3" />{formatDate(iv.followUpDate)}{days != null && days >= 0 ? ` (${days}d)` : ''}</span>}
                        </div>
                      </div>
                      {delta != null && (
                        <div className="text-center shrink-0">
                          <p className="text-[10px] text-midnight-500">Change</p>
                          <p className={`text-lg font-bold ${delta > 0 ? 'text-teal-400' : delta < 0 ? 'text-danger' : 'text-midnight-400'}`}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}</p>
                        </div>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setEditing(iv)}>Manage</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {editing && (
        <OutcomeEditModal intervention={editing} studentName={students.find((s) => s.id === editing.studentId)?.name || editing.studentId} onSave={handleSave} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function OutcomeEditModal({ intervention, studentName, onSave, onClose }: {
  intervention: InterventionRecord; studentName: string;
  onSave: (iv: InterventionRecord) => void; onClose: () => void;
}) {
  const [status, setStatus] = useState<InterventionStatus>(intervention.status);
  const [assignedFaculty, setAssignedFaculty] = useState(intervention.assignedFaculty || '');
  const [followUpDate, setFollowUpDate] = useState(intervention.followUpDate?.split('T')[0] || '');
  const [afterSuccess, setAfterSuccess] = useState(intervention.afterSuccessScore?.toString() || '');
  const [afterPlacement, setAfterPlacement] = useState(intervention.afterPlacementScore?.toString() || '');
  const [notes, setNotes] = useState(intervention.outcomeNotes);

  return (
    <Modal open={true} onClose={onClose} title={`Manage — ${studentName}`} size="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => onSave({ ...intervention, status, assignedFaculty: assignedFaculty || null, followUpDate: followUpDate || null, afterSuccessScore: afterSuccess ? Number(afterSuccess) : null, afterPlacementScore: afterPlacement ? Number(afterPlacement) : null, outcomeNotes: notes, completedDate: status === 'completed' ? new Date().toISOString() : intervention.completedDate })}>Save</Button></>}>
      <div className="space-y-4">
        <div className="rounded-lg border border-midnight-700/40 bg-midnight-800/30 p-3">
          <p className="text-xs text-midnight-400">{INTERVENTION_LABELS[intervention.type] || intervention.type}</p>
          <p className="text-xs text-midnight-400 mt-1">{intervention.reason}</p>
        </div>
        <Select label="Status" value={status} onChange={(v) => setStatus(v as InterventionStatus)} options={[
          { value: 'recommended', label: 'Recommended' }, { value: 'accepted', label: 'Accepted' },
          { value: 'in-progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' },
          { value: 'on-hold', label: 'On Hold' }, { value: 'declined', label: 'Declined' },
        ]} />
        <TextInput label="Assigned Faculty" value={assignedFaculty} onChange={setAssignedFaculty} placeholder="Prof. Sharma" />
        <TextInput label="Follow-up Date" type="date" value={followUpDate} onChange={setFollowUpDate} />
        {intervention.beforeSuccessScore != null && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-midnight-700/40 bg-midnight-800/20 p-3 text-center"><p className="text-xs text-midnight-400">Before</p><p className={`text-lg font-bold ${getScoreColor(intervention.beforeSuccessScore)}`}>{formatScore(intervention.beforeSuccessScore)}</p></div>
            <TextInput label="After (Success)" type="number" value={afterSuccess} onChange={setAfterSuccess} placeholder="Observed" min={0} max={100} />
          </div>
        )}
        {intervention.beforePlacementScore != null && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-midnight-700/40 bg-midnight-800/20 p-3 text-center"><p className="text-xs text-midnight-400">Before</p><p className={`text-lg font-bold ${getScoreColor(intervention.beforePlacementScore)}`}>{formatScore(intervention.beforePlacementScore)}</p></div>
            <TextInput label="After (Placement)" type="number" value={afterPlacement} onChange={setAfterPlacement} placeholder="Observed" min={0} max={100} />
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-midnight-300 mb-1 block">Outcome Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-midnight-700 bg-midnight-800/60 px-3 py-2 text-sm text-midnight-100 outline-none focus:border-teal-500" />
        </div>
      </div>
    </Modal>
  );
}
