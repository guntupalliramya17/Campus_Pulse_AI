import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/AppStore';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Select, TextInput, Slider, Button } from '@/components/ui/Form';
import { RiskBadge, Badge } from '@/components/ui/Badge';
import { ScoreRing, Progress } from '@/components/ui/Progress';
import { simulateAdjustment, getInterventionHours, getInterventionOutcome } from '@/utils/analytics';
import type { StudentRecord, InterventionType } from '@/types';
import { formatScore, getScoreColor, generateId } from '@/utils/format';
import {
  FlaskConical, Plus, Trash2, Copy, AlertTriangle,
  CheckCircle, Clock, Target, Zap, Info, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface ScenarioState {
  id: string;
  name: string;
  adjustments: {
    attendance?: number;
    assignmentCompletion?: number;
    lmsLogins?: number;
    aptitude?: number;
    coding?: number;
    mockInterview?: number;
    communication?: number;
    technical?: number;
    cgpa?: number;
  };
  interventionType: InterventionType | null;
  facultyHours: number;
}

const INTERVENTION_PRESETS: Record<InterventionType, Partial<ScenarioState['adjustments']>> = {
  'attendance-mentoring': { attendance: 15, lmsLogins: 5 },
  'subject-tutoring': { cgpa: 0.5 },
  'assignment-recovery': { assignmentCompletion: 20 },
  'coding-practice': { coding: 20 },
  'aptitude-training': { aptitude: 18 },
  'mock-interviews': { mockInterview: 20 },
  'communication-coaching': { communication: 1.5 },
  'certification-program': {},
};

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

export function InterventionLab({ initialStudentId }: { initialStudentId?: string }) {
  const { students, analyticsMap, addIntervention } = useAppStore();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || students[0]?.id || '');
  const [scenarios, setScenarios] = useState<ScenarioState[]>([
    {
      id: generateId('scn-'),
      name: 'Scenario A',
      adjustments: {},
      interventionType: 'attendance-mentoring',
      facultyHours: 8,
    },
  ]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || null;
  const baselineAnalytics = selectedStudent ? analyticsMap.get(selectedStudent.id) : null;

  const simulationResults = useMemo(() => {
    if (!selectedStudent) return [];
    return scenarios.map((scn) => {
      const result = simulateAdjustment(selectedStudent, scn.adjustments);
      return {
        scenario: scn,
        baseline: result.baseline,
        scenarioResult: result.scenario,
        modifiedStudent: result.modifiedStudent,
      };
    });
  }, [selectedStudent, scenarios, analyticsMap]);

  const addScenario = () => {
    if (scenarios.length >= 3) return;
    setScenarios((prev) => [
      ...prev,
      {
        id: generateId('scn-'),
        name: `Scenario ${String.fromCharCode(65 + prev.length)}`,
        adjustments: {},
        interventionType: 'attendance-mentoring',
        facultyHours: 8,
      },
    ]);
  };

  const removeScenario = (id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  };

  const updateScenario = (id: string, updates: Partial<ScenarioState>) => {
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const applyInterventionPreset = (scnId: string, type: InterventionType) => {
    const preset = INTERVENTION_PRESETS[type];
    const hours = getInterventionHours(type);
    setScenarios((prev) => prev.map((s) =>
      s.id === scnId
        ? { ...s, interventionType: type, adjustments: { ...preset }, facultyHours: hours }
        : s
    ));
  };

  const updateAdjustment = (scnId: string, field: keyof ScenarioState['adjustments'], value: number) => {
    setScenarios((prev) => prev.map((s) =>
      s.id === scnId
        ? { ...s, adjustments: { ...s.adjustments, [field]: value } }
        : s
    ));
  };

  const handleAcceptIntervention = (scnId: string) => {
    if (!selectedStudent) return;
    const scn = scenarios.find((s) => s.id === scnId);
    if (!scn || !scn.interventionType) return;
    const result = simulationResults.find((r) => r.scenario.id === scnId);
    if (!result) return;

    addIntervention({
      id: generateId('iv-'),
      studentId: selectedStudent.id,
      type: scn.interventionType,
      status: 'accepted',
      reason: `Simulated intervention: ${INTERVENTION_LABELS[scn.interventionType]}`,
      estimatedHours: scn.facultyHours,
      assignedFaculty: null,
      followUpDate: null,
      acceptedDate: new Date().toISOString(),
      completedDate: null,
      beforeSuccessScore: result.baseline.successScore.total,
      afterSuccessScore: null,
      beforePlacementScore: result.baseline.placementReadiness.total,
      afterPlacementScore: null,
      outcomeNotes: `Scenario: ${scn.name}. Target: ${getInterventionOutcome(scn.interventionType)}`,
      createdAt: new Date().toISOString(),
    });
  };

  const comparisonData = useMemo(() => {
    if (simulationResults.length === 0) return [];
    const data: { name: string; success: number; placement: number; fill: string }[] = [];
    data.push({
      name: 'Baseline',
      success: baselineAnalytics?.successScore.total ?? 0,
      placement: baselineAnalytics?.placementReadiness.total ?? 0,
      fill: '#4d6fa0',
    });
    for (const r of simulationResults) {
      data.push({
        name: r.scenario.name,
        success: r.scenarioResult.successScore.total,
        placement: r.scenarioResult.placementReadiness.total ?? 0,
        fill: '#00b894',
      });
    }
    return data;
  }, [simulationResults, baselineAnalytics]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-midnight-50">Intervention Lab</h1>
        <p className="text-sm text-midnight-400 mt-0.5">
          Test hypothetical interventions and compare outcomes before implementing them
        </p>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-warning/20 bg-warning/5 px-4 py-3 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-midnight-300">
          <span className="font-medium text-warning">Scenario estimates, not guaranteed outcomes.</span> Simulations use transparent adjustment rules applied to current student data.
          Actual results will vary based on student engagement, intervention quality, and external factors. Historical records are never modified.
        </p>
      </div>

      {/* Student selector */}
      <Card>
        <CardHeader title="Select Student" subtitle="Choose a student to simulate interventions for" icon={<Target className="w-4 h-4" />} />
        <CardBody>
          <Select
            value={selectedStudentId}
            onChange={setSelectedStudentId}
            options={students.map((s) => ({ value: s.id, label: `${s.name} — ${s.id} (${s.department})` }))}
            className="max-w-2xl"
          />
          {selectedStudent && baselineAnalytics && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-midnight-700/40 bg-midnight-800/30 p-3 text-center">
                <p className="text-xs text-midnight-400">Current Success Score</p>
                <p className={`text-xl font-bold ${getScoreColor(baselineAnalytics.successScore.total)}`}>{formatScore(baselineAnalytics.successScore.total)}</p>
              </div>
              <div className="rounded-lg border border-midnight-700/40 bg-midnight-800/30 p-3 text-center">
                <p className="text-xs text-midnight-400">Current Placement</p>
                <p className={`text-xl font-bold ${getScoreColor(baselineAnalytics.placementReadiness.total)}`}>{formatScore(baselineAnalytics.placementReadiness.total)}</p>
              </div>
              <div className="rounded-lg border border-midnight-700/40 bg-midnight-800/30 p-3 text-center">
                <p className="text-xs text-midnight-400">Academic Risk</p>
                <div className="mt-1 flex justify-center"><RiskBadge category={baselineAnalytics.risk.academicRisk} size="sm" /></div>
              </div>
              <div className="rounded-lg border border-midnight-700/40 bg-midnight-800/30 p-3 text-center">
                <p className="text-xs text-midnight-400">Placement Risk</p>
                <div className="mt-1 flex justify-center"><RiskBadge category={baselineAnalytics.risk.placementRisk} size="sm" /></div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Scenario builders */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-midnight-200">Simulation Scenarios</h2>
        <Button variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={addScenario} disabled={scenarios.length >= 3}>
          Add Scenario ({scenarios.length}/3)
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {simulationResults.map((result, idx) => {
          const scn = result.scenario;
          return (
            <Card key={scn.id} className="flex flex-col">
              <CardHeader
                title={scn.name}
                icon={<FlaskConical className="w-4 h-4" />}
                action={
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setScenarios((prev) => {
                        if (prev.length >= 3) return prev;
                        return [...prev, { ...scn, id: generateId('scn-'), name: `Scenario ${String.fromCharCode(65 + prev.length)}` }];
                      })}
                      className="rounded p-1 text-midnight-400 hover:text-teal-400"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {scenarios.length > 1 && (
                      <button
                        onClick={() => removeScenario(scn.id)}
                        className="rounded p-1 text-midnight-400 hover:text-danger"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                }
              />
              <CardBody className="flex-1 flex flex-col gap-3">
                {/* Intervention type */}
                <Select
                  label="Intervention Type"
                  value={scn.interventionType || ''}
                  onChange={(v) => v && applyInterventionPreset(scn.id, v as InterventionType)}
                  options={(Object.keys(INTERVENTION_LABELS) as InterventionType[]).map((t) => ({
                    value: t,
                    label: INTERVENTION_LABELS[t],
                  }))}
                />

                {/* Adjustments */}
                <div className="space-y-2.5">
                  <p className="text-xs font-medium text-midnight-300">Adjustment Controls</p>
                  {scn.adjustments.attendance != null && (
                    <Slider label="Attendance boost" value={scn.adjustments.attendance} onChange={(v) => updateAdjustment(scn.id, 'attendance', v)} min={0} max={30} unit="pts" />
                  )}
                  {scn.adjustments.assignmentCompletion != null && (
                    <Slider label="Assignment completion boost" value={scn.adjustments.assignmentCompletion} onChange={(v) => updateAdjustment(scn.id, 'assignmentCompletion', v)} min={0} max={30} unit="pts" />
                  )}
                  {scn.adjustments.lmsLogins != null && (
                    <Slider label="LMS logins increase" value={scn.adjustments.lmsLogins} onChange={(v) => updateAdjustment(scn.id, 'lmsLogins', v)} min={0} max={15} unit="/wk" />
                  )}
                  {scn.adjustments.aptitude != null && (
                    <Slider label="Aptitude score boost" value={scn.adjustments.aptitude} onChange={(v) => updateAdjustment(scn.id, 'aptitude', v)} min={0} max={30} unit="pts" />
                  )}
                  {scn.adjustments.coding != null && (
                    <Slider label="Coding score boost" value={scn.adjustments.coding} onChange={(v) => updateAdjustment(scn.id, 'coding', v)} min={0} max={30} unit="pts" />
                  )}
                  {scn.adjustments.mockInterview != null && (
                    <Slider label="Mock interview boost" value={scn.adjustments.mockInterview} onChange={(v) => updateAdjustment(scn.id, 'mockInterview', v)} min={0} max={30} unit="pts" />
                  )}
                  {scn.adjustments.communication != null && (
                    <Slider label="Communication rating boost" value={scn.adjustments.communication} onChange={(v) => updateAdjustment(scn.id, 'communication', v)} min={0} max={2} step={0.5} unit="pts" />
                  )}
                  {scn.adjustments.cgpa != null && (
                    <Slider label="CGPA improvement" value={scn.adjustments.cgpa} onChange={(v) => updateAdjustment(scn.id, 'cgpa', v)} min={0} max={1.5} step={0.1} unit="pts" />
                  )}
                </div>

                <Slider label="Faculty hours required" value={scn.facultyHours} onChange={(v) => updateScenario(scn.id, { facultyHours: v })} min={1} max={40} unit="hrs" />

                {/* Results */}
                <div className="mt-2 rounded-lg border border-midnight-700/40 bg-midnight-800/20 p-3 space-y-2">
                  <p className="text-xs font-semibold text-midnight-200">Baseline vs Scenario</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <p className="text-[10px] text-midnight-500">Baseline</p>
                      <p className={`text-lg font-bold ${getScoreColor(result.baseline.successScore.total)}`}>{formatScore(result.baseline.successScore.total)}</p>
                      <p className="text-[10px] text-midnight-500">Success</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-midnight-500">Scenario</p>
                      <p className={`text-lg font-bold ${getScoreColor(result.scenarioResult.successScore.total)}`}>
                        {formatScore(result.scenarioResult.successScore.total)}
                        {result.scenarioResult.successScore.total > result.baseline.successScore.total && (
                          <span className="text-teal-400 text-xs ml-1">+{(result.scenarioResult.successScore.total - result.baseline.successScore.total).toFixed(1)}</span>
                        )}
                      </p>
                      <p className="text-[10px] text-midnight-500">Success</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <p className="text-[10px] text-midnight-500">Baseline Risk</p>
                      <div className="mt-0.5 flex justify-center"><RiskBadge category={result.baseline.risk.academicRisk} size="sm" /></div>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-midnight-500">Scenario Risk</p>
                      <div className="mt-0.5 flex justify-center"><RiskBadge category={result.scenarioResult.risk.academicRisk} size="sm" /></div>
                    </div>
                  </div>
                </div>

                {/* Accept intervention */}
                <Button
                  variant="primary"
                  size="sm"
                  icon={<CheckCircle className="w-3.5 h-3.5" />}
                  onClick={() => handleAcceptIntervention(scn.id)}
                  className="mt-auto"
                >
                  Accept as Intervention
                </Button>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Comparison chart */}
      {comparisonData.length > 1 && (
        <Card>
          <CardHeader title="Scenario Comparison" subtitle="Baseline vs simulated outcomes" icon={<Zap className="w-4 h-4" />} />
          <CardBody>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f3556" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b89b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b89b8' }} />
                <Tooltip
                  contentStyle={{ background: '#0d1a33', border: '1px solid #1f3556', borderRadius: '8px', fontSize: '12px' }}
                  cursor={{ fill: '#1f355640' }}
                />
                <Bar dataKey="success" fill="#00b894" radius={[4, 4, 0, 0]} name="Success Score" />
                <Bar dataKey="placement" fill="#a85bf0" radius={[4, 4, 0, 0]} name="Placement Score" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-teal-500" /><span className="text-midnight-300">Success Score</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-violet-400" /><span className="text-midnight-300">Placement Score</span></div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="rounded-lg border border-info/20 bg-info/5 px-4 py-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
        <p className="text-xs text-midnight-300">
          Simulations create a temporary modified copy of the student record — historical data is never changed.
          Accepted interventions are saved to the Resource Optimizer and Outcomes pages for tracking.
        </p>
      </div>
    </div>
  );
}
