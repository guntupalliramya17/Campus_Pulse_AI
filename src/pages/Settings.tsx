import { useState } from 'react';
import { useAppStore } from '@/store/AppStore';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button, Slider, Select } from '@/components/ui/Form';
import { Badge } from '@/components/ui/Badge';
import { DEFAULT_CONFIG } from '@/types';
import type { AppConfig, ScoreWeights, PlacementWeights, RiskThresholds } from '@/types';
import {
  Settings as SettingsIcon, Sliders, AlertTriangle, RefreshCw,
  CheckCircle, Info, Save, RotateCcw,
} from 'lucide-react';

export function Settings() {
  const { config, updateConfig, resetAllData } = useAppStore();
  const [local, setLocal] = useState<AppConfig>(config);
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const updateScoreWeights = (key: keyof ScoreWeights, value: number) => {
    setLocal((prev) => ({ ...prev, scoreWeights: { ...prev.scoreWeights, [key]: value } }));
    setSaved(false);
  };

  const updatePlacementWeights = (key: keyof PlacementWeights, value: number) => {
    setLocal((prev) => ({ ...prev, placementWeights: { ...prev.placementWeights, [key]: value } }));
    setSaved(false);
  };

  const updateThresholds = (key: keyof RiskThresholds, value: number) => {
    setLocal((prev) => ({ ...prev, riskThresholds: { ...prev.riskThresholds, [key]: value } }));
    setSaved(false);
  };

  const scoreWeightSum = Object.values(local.scoreWeights).reduce((s, v) => s + v, 0);
  const placementWeightSum = Object.values(local.placementWeights).reduce((s, v) => s + v, 0);
  const isScoreValid = Math.abs(scoreWeightSum - 1.0) < 0.001;
  const isPlacementValid = Math.abs(placementWeightSum - 1.0) < 0.001;
  const thresholdsValid = local.riskThresholds.moderateMax > local.riskThresholds.highMax && local.riskThresholds.highMax > local.riskThresholds.criticalMax;

  const handleSave = () => {
    if (!isScoreValid || !isPlacementValid || !thresholdsValid) return;
    updateConfig(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setLocal(DEFAULT_CONFIG);
    updateConfig(DEFAULT_CONFIG);
    setSaved(false);
  };

  const handleFullReset = () => {
    resetAllData();
    setLocal(DEFAULT_CONFIG);
    setShowResetConfirm(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-midnight-50">Settings</h1>
        <p className="text-sm text-midnight-400 mt-0.5">Configure scoring weights, risk thresholds, and display preferences</p>
      </div>

      {/* Score Weights */}
      <Card>
        <CardHeader title="Student Success Score Weights" subtitle="Configure component weights — must sum to 100%" icon={<Sliders className="w-4 h-4" />} />
        <CardBody>
          <div className="space-y-4">
            <Slider label="Academic Performance" value={Math.round(local.scoreWeights.academicPerformance * 100)} onChange={(v) => updateScoreWeights('academicPerformance', v / 100)} min={0} max={100} unit="%" />
            <Slider label="Attendance" value={Math.round(local.scoreWeights.attendance * 100)} onChange={(v) => updateScoreWeights('attendance', v / 100)} min={0} max={100} unit="%" />
            <Slider label="LMS Engagement" value={Math.round(local.scoreWeights.lmsEngagement * 100)} onChange={(v) => updateScoreWeights('lmsEngagement', v / 100)} min={0} max={100} unit="%" />
            <Slider label="Assessment Consistency" value={Math.round(local.scoreWeights.assessmentConsistency * 100)} onChange={(v) => updateScoreWeights('assessmentConsistency', v / 100)} min={0} max={100} unit="%" />
            <Slider label="Skill Development" value={Math.round(local.scoreWeights.skillDevelopment * 100)} onChange={(v) => updateScoreWeights('skillDevelopment', v / 100)} min={0} max={100} unit="%" />
            <Slider label="Participation & Feedback" value={Math.round(local.scoreWeights.participationFeedback * 100)} onChange={(v) => updateScoreWeights('participationFeedback', v / 100)} min={0} max={100} unit="%" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-midnight-400">Total:</span>
            <Badge variant={isScoreValid ? 'teal' : 'danger'} size="sm">{Math.round(scoreWeightSum * 100)}%</Badge>
            {!isScoreValid && <span className="text-xs text-danger">Weights must sum to 100%</span>}
          </div>
        </CardBody>
      </Card>

      {/* Placement Weights */}
      <Card>
        <CardHeader title="Placement Readiness Weights" subtitle="Configure placement component weights — must sum to 100%" icon={<Sliders className="w-4 h-4" />} />
        <CardBody>
          <div className="space-y-4">
            <Slider label="Aptitude" value={Math.round(local.placementWeights.aptitude * 100)} onChange={(v) => updatePlacementWeights('aptitude', v / 100)} min={0} max={100} unit="%" />
            <Slider label="Coding" value={Math.round(local.placementWeights.coding * 100)} onChange={(v) => updatePlacementWeights('coding', v / 100)} min={0} max={100} unit="%" />
            <Slider label="Mock Interview" value={Math.round(local.placementWeights.mockInterview * 100)} onChange={(v) => updatePlacementWeights('mockInterview', v / 100)} min={0} max={100} unit="%" />
            <Slider label="Technical Skill" value={Math.round(local.placementWeights.technicalSkill * 100)} onChange={(v) => updatePlacementWeights('technicalSkill', v / 100)} min={0} max={100} unit="%" />
            <Slider label="Communication" value={Math.round(local.placementWeights.communicationSkill * 100)} onChange={(v) => updatePlacementWeights('communicationSkill', v / 100)} min={0} max={100} unit="%" />
            <Slider label="Placement Participation" value={Math.round(local.placementWeights.placementPrep * 100)} onChange={(v) => updatePlacementWeights('placementPrep', v / 100)} min={0} max={100} unit="%" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-midnight-400">Total:</span>
            <Badge variant={isPlacementValid ? 'teal' : 'danger'} size="sm">{Math.round(placementWeightSum * 100)}%</Badge>
            {!isPlacementValid && <span className="text-xs text-danger">Weights must sum to 100%</span>}
          </div>
        </CardBody>
      </Card>

      {/* Risk Thresholds */}
      <Card>
        <CardHeader title="Risk Thresholds" subtitle="Score boundaries for risk categorization" icon={<AlertTriangle className="w-4 h-4" />} />
        <CardBody>
          <div className="space-y-4">
            <Slider label="Low Risk threshold (score above this = low risk)" value={local.riskThresholds.moderateMax} onChange={(v) => updateThresholds('moderateMax', v)} min={50} max={90} unit="pts" />
            <Slider label="Moderate Risk threshold (above this = moderate, below = high)" value={local.riskThresholds.highMax} onChange={(v) => updateThresholds('highMax', v)} min={40} max={80} unit="pts" />
            <Slider label="High Risk threshold (above this = high, below = critical)" value={local.riskThresholds.criticalMax} onChange={(v) => updateThresholds('criticalMax', v)} min={20} max={60} unit="pts" />
            <Slider label="Insufficient Data threshold (completeness below this = insufficient)" value={local.riskThresholds.insufficientDataMax} onChange={(v) => updateThresholds('insufficientDataMax', v)} min={20} max={80} unit="%" />
          </div>
          {!thresholdsValid && (
            <p className="mt-3 text-xs text-danger">Thresholds must be in descending order: Low {'>'} Moderate {'>'} High {'>'} Critical</p>
          )}
          <div className="mt-3 rounded-lg border border-midnight-700/40 bg-midnight-800/20 p-3 text-xs text-midnight-400 space-y-1">
            <p><span className="text-teal-400">≥ {local.riskThresholds.moderateMax}</span> = Low Risk</p>
            <p><span className="text-warning">{local.riskThresholds.highMax}–{local.riskThresholds.moderateMax}</span> = Moderate Risk</p>
            <p><span className="text-orange-400">{local.riskThresholds.criticalMax}–{local.riskThresholds.highMax}</span> = High Risk</p>
            <p><span className="text-danger">&lt; {local.riskThresholds.criticalMax}</span> = Critical Risk</p>
          </div>
        </CardBody>
      </Card>

      {/* Faculty hours */}
      <Card>
        <CardHeader title="Default Faculty Hours" subtitle="Default capacity for intervention recommendations" icon={<Sliders className="w-4 h-4" />} />
        <CardBody>
          <Slider label="Default faculty hours budget" value={local.defaultFacultyHours} onChange={(v) => { setLocal((prev) => ({ ...prev, defaultFacultyHours: v })); setSaved(false); }} min={20} max={500} step={5} unit="hrs" />
        </CardBody>
      </Card>

      {/* Display preferences */}
      <Card>
        <CardHeader title="Display Preferences" icon={<SettingsIcon className="w-4 h-4" />} />
        <CardBody>
          <Select
            label="Data display mode"
            value={local.showSyntheticOnly ? 'true' : 'false'}
            onChange={(v) => { setLocal((prev) => ({ ...prev, showSyntheticOnly: v === 'true' })); setSaved(false); }}
            options={[
              { value: 'false', label: 'Show all data (synthetic + imported)' },
              { value: 'true', label: 'Show synthetic demo data only' },
            ]}
            className="max-w-xs"
          />
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleSave} disabled={!isScoreValid || !isPlacementValid || !thresholdsValid}>
            Save Configuration
          </Button>
          <Button variant="outline" icon={<RotateCcw className="w-4 h-4" />} onClick={handleReset}>
            Reset to Defaults
          </Button>
          {saved && <Badge variant="teal" size="sm"><CheckCircle className="w-3 h-3 mr-1 inline" />Saved</Badge>}
        </div>
        <Button variant="danger" icon={<RefreshCw className="w-4 h-4" />} onClick={() => setShowResetConfirm(true)}>
          Reset All Demo Data
        </Button>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-info/20 bg-info/5 px-4 py-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
        <p className="text-xs text-midnight-300">
          Configuration changes update all dependent scores, risk assessments, and recommendations immediately.
          These are demonstration scoring rules, not scientifically validated models. Weight changes require the total to equal 100%.
        </p>
      </div>

      {/* Reset confirm */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-midnight-950/80 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-midnight-700 bg-midnight-900 shadow-2xl animate-slide-up p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-danger" />
              <h2 className="text-base font-semibold text-midnight-50">Reset All Demo Data?</h2>
            </div>
            <p className="text-sm text-midnight-300 mb-4">This will restore fresh synthetic student data, clear all interventions, and reset configuration to defaults. This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowResetConfirm(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleFullReset}>Reset Everything</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
