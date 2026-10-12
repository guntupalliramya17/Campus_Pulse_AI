import type {
  StudentRecord,
  StudentAnalytics,
  StudentSuccessScore,
  PlacementReadinessScore,
  ScoreComponent,
  RiskAssessment,
  RiskCategory,
  StudentSegment,
  AppConfig,
} from '@/types';
import { DEFAULT_CONFIG } from '@/types';

// ============================================================
// Normalization helpers
// ============================================================

function normalizeCgpa(cgpa: number): number {
  return Math.max(0, Math.min(100, (cgpa / 10) * 100));
}

function normalizeRating(rating: number, max = 5): number {
  return Math.max(0, Math.min(100, (rating / max) * 100));
}

function normalizeLmsLogins(logins: number): number {
  // 0 logins = 0, 20+ logins = 100
  return Math.max(0, Math.min(100, (logins / 20) * 100));
}

function clampScore(v: number): number {
  return Math.max(0, Math.min(100, v));
}

// ============================================================
// Student Success Score (0-100)
// ============================================================

export function computeSuccessScore(student: StudentRecord, config: AppConfig = DEFAULT_CONFIG): StudentSuccessScore {
  const w = config.scoreWeights;

  // 1. Academic performance (CGPA)
  const academicRaw = normalizeCgpa(student.cgpa);
  const academic: ScoreComponent = {
    label: 'Academic Performance',
    rawValue: academicRaw,
    weight: w.academicPerformance,
    contribution: academicRaw * w.academicPerformance,
    isMissing: false,
  };

  // 2. Attendance
  const attendanceRaw = student.overallAttendance;
  const attendance: ScoreComponent = {
    label: 'Attendance',
    rawValue: attendanceRaw,
    weight: w.attendance,
    contribution: attendanceRaw * w.attendance,
    isMissing: false,
  };

  // 3. LMS engagement
  const lmsRaw = normalizeLmsLogins(student.lmsLoginFrequency);
  const lms: ScoreComponent = {
    label: 'LMS Engagement',
    rawValue: lmsRaw,
    weight: w.lmsEngagement,
    contribution: lmsRaw * w.lmsEngagement,
    isMissing: false,
  };

  // 4. Assessment consistency — variance of assessment marks
  const marks = student.assessmentMarks.map((a) => a.marks);
  const avgMarks = marks.reduce((s, m) => s + m, 0) / (marks.length || 1);
  const variance = marks.length > 0
    ? marks.reduce((s, m) => s + Math.pow(m - avgMarks, 2), 0) / marks.length
    : 0;
  // High variance = low consistency. Map: variance 0 => 100, variance 400 => 0
  const consistencyRaw = clampScore(100 - (variance / 4));
  const assessment: ScoreComponent = {
    label: 'Assessment Consistency',
    rawValue: consistencyRaw,
    weight: w.assessmentConsistency,
    contribution: consistencyRaw * w.assessmentConsistency,
    isMissing: marks.length === 0,
  };

  // 5. Skill development — average of available skill indicators normalized
  const skillValues: number[] = [];
  if (student.technicalSkillRating != null) skillValues.push(normalizeRating(student.technicalSkillRating));
  if (student.communicationSkillRating != null) skillValues.push(normalizeRating(student.communicationSkillRating));
  if (student.codingScore != null) skillValues.push(student.codingScore);
  const skillRaw = skillValues.length > 0
    ? skillValues.reduce((s, v) => s + v, 0) / skillValues.length
    : 0;
  const skill: ScoreComponent = {
    label: 'Skill Development',
    rawValue: skillRaw,
    weight: w.skillDevelopment,
    contribution: skillRaw * w.skillDevelopment,
    isMissing: skillValues.length === 0,
  };

  // 6. Participation & feedback
  const eventRaw = clampScore((student.eventParticipation / 10) * 100);
  const certRaw = clampScore((student.certificationCount / 5) * 100);
  const feedbackRaw = normalizeRating(student.feedbackRating);
  const participationRaw = (eventRaw + certRaw + feedbackRaw) / 3;
  const participation: ScoreComponent = {
    label: 'Participation & Feedback',
    rawValue: participationRaw,
    weight: w.participationFeedback,
    contribution: participationRaw * w.participationFeedback,
    isMissing: false,
  };

  const components = [academic, attendance, lms, assessment, skill, participation];
  const total = clampScore(components.reduce((s, c) => s + c.contribution, 0));

  // Data completeness — count non-missing fields out of all checked
  const totalFields = components.length;
  const filledFields = components.filter((c) => !c.isMissing).length;
  const dataCompleteness = (filledFields / totalFields) * 100;

  // Top contributors
  const sortedByContrib = [...components].sort((a, b) => b.contribution - a.contribution);
  const sortedByRaw = [...components].filter((c) => !c.isMissing).sort((a, b) => a.rawValue - b.rawValue);

  return {
    total: Math.round(total * 10) / 10,
    components,
    dataCompleteness: Math.round(dataCompleteness),
    topPositiveContributor: sortedByContrib[0] || null,
    topNegativeContributor: sortedByRaw[0] || null,
  };
}

// ============================================================
// Placement Readiness Score (0-100)
// ============================================================

export function computePlacementReadiness(student: StudentRecord, config: AppConfig = DEFAULT_CONFIG): PlacementReadinessScore {
  const w = config.placementWeights;

  const components: ScoreComponent[] = [];

  // Aptitude
  const aptitudeMissing = student.aptitudeScore == null;
  components.push({
    label: 'Aptitude',
    rawValue: student.aptitudeScore ?? 0,
    weight: w.aptitude,
    contribution: (student.aptitudeScore ?? 0) * w.aptitude,
    isMissing: aptitudeMissing,
  });

  // Coding
  const codingMissing = student.codingScore == null;
  components.push({
    label: 'Coding',
    rawValue: student.codingScore ?? 0,
    weight: w.coding,
    contribution: (student.codingScore ?? 0) * w.coding,
    isMissing: codingMissing,
  });

  // Mock interview
  const mockMissing = student.mockInterviewScore == null;
  components.push({
    label: 'Mock Interview',
    rawValue: student.mockInterviewScore ?? 0,
    weight: w.mockInterview,
    contribution: (student.mockInterviewScore ?? 0) * w.mockInterview,
    isMissing: mockMissing,
  });

  // Technical skill
  const techMissing = student.technicalSkillRating == null;
  components.push({
    label: 'Technical Skill',
    rawValue: student.technicalSkillRating != null ? normalizeRating(student.technicalSkillRating) : 0,
    weight: w.technicalSkill,
    contribution: (student.technicalSkillRating != null ? normalizeRating(student.technicalSkillRating) : 0) * w.technicalSkill,
    isMissing: techMissing,
  });

  // Communication skill
  const commMissing = student.communicationSkillRating == null;
  components.push({
    label: 'Communication',
    rawValue: student.communicationSkillRating != null ? normalizeRating(student.communicationSkillRating) : 0,
    weight: w.communicationSkill,
    contribution: (student.communicationSkillRating != null ? normalizeRating(student.communicationSkillRating) : 0) * w.communicationSkill,
    isMissing: commMissing,
  });

  // Placement prep (participation)
  const placementPrepRaw = student.placementParticipation ? 100 : 0;
  components.push({
    label: 'Placement Participation',
    rawValue: placementPrepRaw,
    weight: w.placementPrep,
    contribution: placementPrepRaw * w.placementPrep,
    isMissing: false,
  });

  // Data completeness
  const totalFields = components.length;
  const filledFields = components.filter((c) => !c.isMissing).length;
  const dataCompleteness = (filledFields / totalFields) * 100;

  // If more than half the weighted fields are missing, return null total
  const missingWeightSum = components.filter((c) => c.isMissing).reduce((s, c) => s + c.weight, 0);
  const isInsufficient = missingWeightSum > 0.5;

  const total = isInsufficient
    ? null
    : clampScore(components.reduce((s, c) => s + (c.isMissing ? 0 : c.contribution), 0) / (1 - missingWeightSum));

  const available = components.filter((c) => !c.isMissing);
  const sortedByRaw = [...available].sort((a, b) => a.rawValue - b.rawValue);

  return {
    total: total != null ? Math.round(total * 10) / 10 : null,
    components,
    dataCompleteness: Math.round(dataCompleteness),
    isReady: total != null && total >= 70,
    topGap: sortedByRaw[0] || null,
    topStrength: sortedByRaw[sortedByRaw.length - 1] || null,
  };
}

// ============================================================
// Risk Assessment
// ============================================================

function scoreToRisk(score: number, thresholds: AppConfig['riskThresholds']): RiskCategory {
  if (score >= thresholds.moderateMax) return 'low';
  if (score >= thresholds.highMax) return 'moderate';
  if (score >= thresholds.criticalMax) return 'high';
  return 'critical';
}

export function computeRisk(
  student: StudentRecord,
  successScore: StudentSuccessScore,
  placementReadiness: PlacementReadinessScore,
  config: AppConfig = DEFAULT_CONFIG
): RiskAssessment {
  const academicReasons: string[] = [];
  const placementReasons: string[] = [];

  // Academic risk
  let academicRisk: RiskCategory;
  if (successScore.dataCompleteness < config.riskThresholds.insufficientDataMax) {
    academicRisk = 'insufficient-data';
    academicReasons.push('Insufficient data for reliable academic risk assessment');
  } else {
    academicRisk = scoreToRisk(successScore.total, config.riskThresholds);
  }

  if (student.cgpa < 6) academicReasons.push(`Low CGPA of ${student.cgpa} (below 6.0 threshold)`);
  if (student.overallAttendance < 65) academicReasons.push(`Attendance at ${student.overallAttendance}% (below 65% threshold)`);
  if (student.assignmentCompletion < 60) academicReasons.push(`Assignment completion at ${student.assignmentCompletion}% (below 60%)`);
  if (student.lmsLoginFrequency < 5) academicReasons.push(`Low LMS engagement (${student.lmsLoginFrequency} logins/week)`);

  // Check declining attendance trend
  if (student.semesterTrends.length >= 3) {
    const recent = student.semesterTrends.slice(-3);
    if (recent[2].attendance < recent[0].attendance - 10) {
      academicReasons.push('Attendance declining over recent semesters');
    }
  }

  if (academicReasons.length === 0) {
    academicReasons.push('No significant academic risk indicators detected');
  }

  // Placement risk
  let placementRisk: RiskCategory;
  if (placementReadiness.total == null) {
    placementRisk = 'insufficient-data';
    placementReasons.push('Placement readiness data incomplete — aptitude, coding, and interview scores needed');
  } else {
    placementRisk = scoreToRisk(placementReadiness.total, config.riskThresholds);
  }

  if (student.aptitudeScore != null && student.aptitudeScore < 55) {
    placementReasons.push(`Aptitude score of ${student.aptitudeScore} is below placement threshold`);
  }
  if (student.codingScore != null && student.codingScore < 50) {
    placementReasons.push(`Coding score of ${student.codingScore} needs improvement`);
  }
  if (student.mockInterviewScore != null && student.mockInterviewScore < 55) {
    placementReasons.push(`Mock interview performance at ${student.mockInterviewScore} is below target`);
  }
  if (student.communicationSkillRating != null && student.communicationSkillRating < 3) {
    placementReasons.push(`Communication skill rating of ${student.communicationSkillRating}/5 needs development`);
  }

  if (placementReasons.length === 0 && placementReadiness.total != null) {
    placementReasons.push('No significant placement risk indicators detected');
  }

  return { academicRisk, placementRisk, academicRiskReasons: academicReasons, placementRiskReasons: placementReasons };
}

// ============================================================
// Segment assignment
// ============================================================

export function computeSegment(
  student: StudentRecord,
  successScore: StudentSuccessScore,
  placementReadiness: PlacementReadinessScore,
  risk: RiskAssessment
): StudentSegment {
  if (successScore.dataCompleteness < 50 || (placementReadiness.total == null && student.academicYear >= 3)) {
    return 'data-pending';
  }

  if (successScore.total >= 80 && placementReadiness.isReady) return 'high-achiever';
  if (successScore.total >= 70 && risk.academicRisk === 'low') return 'consistent-performer';
  if (risk.academicRisk === 'high' || risk.academicRisk === 'critical') return 'at-risk';
  if (successScore.total >= 70 && placementReadiness.total != null && placementReadiness.total < 60) return 'placement-gaps';
  if (student.codingScore != null && student.codingScore >= 65 && student.mockInterviewScore != null && student.mockInterviewScore < 55) return 'skill-mismatch';
  if (student.lmsLoginFrequency < 6 && student.eventParticipation < 2) return 'low-engagement';

  return 'consistent-performer';
}

// ============================================================
// Full analytics computation for a student
// ============================================================

export function computeStudentAnalytics(student: StudentRecord, config: AppConfig = DEFAULT_CONFIG): StudentAnalytics {
  const successScore = computeSuccessScore(student, config);
  const placementReadiness = computePlacementReadiness(student, config);
  const risk = computeRisk(student, successScore, placementReadiness, config);
  const segment = computeSegment(student, successScore, placementReadiness, risk);

  // Predictive flags
  let decliningAttendance = false;
  if (student.semesterTrends.length >= 3) {
    const recent = student.semesterTrends.slice(-3);
    if (recent[2].attendance < recent[0].attendance - 10) decliningAttendance = true;
  }

  const weakAssessments = student.assessmentMarks.some((a) => a.marks < 45);
  const strongAcademicsLowPlacement = student.cgpa >= 7.5 && placementReadiness.total != null && placementReadiness.total < 60;
  const strongTechWeakInterview = student.codingScore != null && student.codingScore >= 65 && student.mockInterviewScore != null && student.mockInterviewScore < 55;
  const placementReady = placementReadiness.isReady;
  const insufficientData = successScore.dataCompleteness < 50 || (placementReadiness.total == null && student.academicYear >= 3);

  return {
    successScore,
    placementReadiness,
    risk,
    segment,
    decliningAttendance,
    weakAssessments,
    strongAcademicsLowPlacement,
    strongTechWeakInterview,
    placementReady,
    insufficientData,
  };
}

// ============================================================
// Batch analytics
// ============================================================

export function computeAllAnalytics(students: StudentRecord[], config: AppConfig = DEFAULT_CONFIG): Map<string, StudentAnalytics> {
  const map = new Map<string, StudentAnalytics>();
  for (const s of students) {
    map.set(s.id, computeStudentAnalytics(s, config));
  }
  return map;
}

// ============================================================
// Intervention simulation (what-if)
// ============================================================

export function simulateAdjustment(
  student: StudentRecord,
  adjustments: SimulationAdjustmentInput,
  config: AppConfig = DEFAULT_CONFIG
): {
  baseline: StudentAnalytics;
  scenario: StudentAnalytics;
  modifiedStudent: StudentRecord;
} {
  const baseline = computeStudentAnalytics(student, config);

  const modified: StudentRecord = {
    ...student,
    overallAttendance: clampScore(student.overallAttendance + (adjustments.attendance || 0)),
    assignmentCompletion: clampScore(student.assignmentCompletion + (adjustments.assignmentCompletion || 0)),
    lmsLoginFrequency: Math.max(0, student.lmsLoginFrequency + (adjustments.lmsLogins || 0)),
    aptitudeScore: student.aptitudeScore != null ? clampScore(student.aptitudeScore + (adjustments.aptitude || 0)) : null,
    codingScore: student.codingScore != null ? clampScore(student.codingScore + (adjustments.coding || 0)) : null,
    mockInterviewScore: student.mockInterviewScore != null ? clampScore(student.mockInterviewScore + (adjustments.mockInterview || 0)) : null,
    communicationSkillRating: student.communicationSkillRating != null ? Math.max(1, Math.min(5, student.communicationSkillRating + (adjustments.communication || 0))) : null,
    technicalSkillRating: student.technicalSkillRating != null ? Math.max(1, Math.min(5, student.technicalSkillRating + (adjustments.technical || 0))) : null,
    cgpa: Math.max(0, Math.min(10, Math.round((student.cgpa + (adjustments.cgpa || 0)) * 100) / 100)),
  };

  const scenario = computeStudentAnalytics(modified, config);

  return { baseline, scenario, modifiedStudent: modified };
}

export interface SimulationAdjustmentInput {
  attendance?: number;
  assignmentCompletion?: number;
  lmsLogins?: number;
  aptitude?: number;
  coding?: number;
  mockInterview?: number;
  communication?: number;
  technical?: number;
  cgpa?: number;
}

// ============================================================
// Intervention recommendations
// ============================================================

export interface InterventionRecommendation {
  studentId: string;
  type: import('@/types').InterventionType;
  reason: string;
  estimatedHours: number;
  intendedOutcome: string;
  priorityScore: number;
  suitabilityScore: number;
}

const INTERVENTION_HOURS: Record<import('@/types').InterventionType, number> = {
  'attendance-mentoring': 8,
  'subject-tutoring': 16,
  'assignment-recovery': 10,
  'coding-practice': 12,
  'aptitude-training': 14,
  'mock-interviews': 10,
  'communication-coaching': 12,
  'certification-program': 20,
};

const INTERVENTION_OUTCOMES: Record<import('@/types').InterventionType, string> = {
  'attendance-mentoring': 'Improve attendance to 80%+ and stabilize engagement',
  'subject-tutoring': 'Raise CGPA by 0.3-0.5 and improve subject comprehension',
  'assignment-recovery': 'Increase assignment completion to 85%+ and improve consistency',
  'coding-practice': 'Boost coding score by 15-25 points for placement readiness',
  'aptitude-training': 'Improve aptitude score by 15-20 points for placement tests',
  'mock-interviews': 'Enhance interview performance by 15-25 points and build confidence',
  'communication-coaching': 'Raise communication rating to 4+ and improve presentation skills',
  'certification-program': 'Add industry-recognized certifications to strengthen profile',
};

export function recommendInterventions(
  students: StudentRecord[],
  analyticsMap: Map<string, StudentAnalytics>,
  facultyHoursBudget: number
): InterventionRecommendation[] {
  const recs: InterventionRecommendation[] = [];

  for (const student of students) {
    const analytics = analyticsMap.get(student.id);
    if (!analytics) continue;

    // Skip low-risk students
    if (analytics.risk.academicRisk === 'low' && analytics.risk.placementRisk === 'low') continue;

    const recsForStudent: InterventionRecommendation[] = [];

    // Attendance mentoring
    if (student.overallAttendance < 70) {
      recsForStudent.push({
        studentId: student.id,
        type: 'attendance-mentoring',
        reason: `Attendance at ${student.overallAttendance}% is below safe threshold`,
        estimatedHours: INTERVENTION_HOURS['attendance-mentoring'],
        intendedOutcome: INTERVENTION_OUTCOMES['attendance-mentoring'],
        priorityScore: (100 - student.overallAttendance) * (analytics.risk.academicRisk === 'critical' ? 1.5 : analytics.risk.academicRisk === 'high' ? 1.3 : 1),
        suitabilityScore: 100 - student.overallAttendance,
      });
    }

    // Subject tutoring
    if (student.cgpa < 6.5) {
      recsForStudent.push({
        studentId: student.id,
        type: 'subject-tutoring',
        reason: `CGPA of ${student.cgpa} indicates academic support needed`,
        estimatedHours: INTERVENTION_HOURS['subject-tutoring'],
        intendedOutcome: INTERVENTION_OUTCOMES['subject-tutoring'],
        priorityScore: (100 - student.cgpa * 10) * (analytics.risk.academicRisk === 'critical' ? 1.5 : 1),
        suitabilityScore: 100 - student.cgpa * 10,
      });
    }

    // Assignment recovery
    if (student.assignmentCompletion < 65) {
      recsForStudent.push({
        studentId: student.id,
        type: 'assignment-recovery',
        reason: `Assignment completion at ${student.assignmentCompletion}% is below target`,
        estimatedHours: INTERVENTION_HOURS['assignment-recovery'],
        intendedOutcome: INTERVENTION_OUTCOMES['assignment-recovery'],
        priorityScore: (100 - student.assignmentCompletion),
        suitabilityScore: 100 - student.assignmentCompletion,
      });
    }

    // Coding practice
    if (student.codingScore != null && student.codingScore < 60) {
      recsForStudent.push({
        studentId: student.id,
        type: 'coding-practice',
        reason: `Coding score of ${student.codingScore} is below placement threshold`,
        estimatedHours: INTERVENTION_HOURS['coding-practice'],
        intendedOutcome: INTERVENTION_OUTCOMES['coding-practice'],
        priorityScore: (100 - student.codingScore) * (analytics.risk.placementRisk === 'high' ? 1.3 : 1),
        suitabilityScore: 100 - student.codingScore,
      });
    }

    // Aptitude training
    if (student.aptitudeScore != null && student.aptitudeScore < 60) {
      recsForStudent.push({
        studentId: student.id,
        type: 'aptitude-training',
        reason: `Aptitude score of ${student.aptitudeScore} needs improvement for placement`,
        estimatedHours: INTERVENTION_HOURS['aptitude-training'],
        intendedOutcome: INTERVENTION_OUTCOMES['aptitude-training'],
        priorityScore: (100 - student.aptitudeScore) * (analytics.risk.placementRisk === 'high' ? 1.3 : 1),
        suitabilityScore: 100 - student.aptitudeScore,
      });
    }

    // Mock interviews
    if (student.mockInterviewScore != null && student.mockInterviewScore < 60) {
      recsForStudent.push({
        studentId: student.id,
        type: 'mock-interviews',
        reason: `Mock interview score of ${student.mockInterviewScore} is below target`,
        estimatedHours: INTERVENTION_HOURS['mock-interviews'],
        intendedOutcome: INTERVENTION_OUTCOMES['mock-interviews'],
        priorityScore: (100 - student.mockInterviewScore) * (analytics.risk.placementRisk === 'high' ? 1.3 : 1),
        suitabilityScore: 100 - student.mockInterviewScore,
      });
    }

    // Communication coaching
    if (student.communicationSkillRating != null && student.communicationSkillRating < 3.5) {
      recsForStudent.push({
        studentId: student.id,
        type: 'communication-coaching',
        reason: `Communication rating of ${student.communicationSkillRating}/5 needs development`,
        estimatedHours: INTERVENTION_HOURS['communication-coaching'],
        intendedOutcome: INTERVENTION_OUTCOMES['communication-coaching'],
        priorityScore: (5 - student.communicationSkillRating) * 20,
        suitabilityScore: (5 - student.communicationSkillRating) * 20,
      });
    }

    // Certification program
    if (student.certificationCount === 0 && student.academicYear >= 3) {
      recsForStudent.push({
        studentId: student.id,
        type: 'certification-program',
        reason: 'No certifications — industry credentials would strengthen placement profile',
        estimatedHours: INTERVENTION_HOURS['certification-program'],
        intendedOutcome: INTERVENTION_OUTCOMES['certification-program'],
        priorityScore: 30,
        suitabilityScore: 50,
      });
    }

    // Factor in evidence quality (data completeness)
    for (const r of recsForStudent) {
      r.priorityScore = r.priorityScore * (analytics.successScore.dataCompleteness / 100);
    }

    recs.push(...recsForStudent);
  }

  // Sort by priority score descending
  recs.sort((a, b) => b.priorityScore - a.priorityScore);

  // Apply faculty hours budget — greedily select interventions
  if (facultyHoursBudget > 0) {
    const withinBudget: InterventionRecommendation[] = [];
    let usedHours = 0;
    for (const r of recs) {
      if (usedHours + r.estimatedHours <= facultyHoursBudget) {
        withinBudget.push(r);
        usedHours += r.estimatedHours;
      }
    }
    return withinBudget;
  }

  return recs;
}

export function getInterventionHours(type: import('@/types').InterventionType): number {
  return INTERVENTION_HOURS[type];
}

export function getInterventionOutcome(type: import('@/types').InterventionType): string {
  return INTERVENTION_OUTCOMES[type];
}

// ============================================================
// Aggregation utilities
// ============================================================

export function aggregateRiskDistribution(
  students: StudentRecord[],
  analyticsMap: Map<string, StudentAnalytics>
): { category: RiskCategory; count: number }[] {
  const counts: Record<RiskCategory, number> = {
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
    'insufficient-data': 0,
  };

  for (const s of students) {
    const a = analyticsMap.get(s.id);
    if (!a) continue;
    // Use the worse of academic/placement risk
    const risk = worseRisk(a.risk.academicRisk, a.risk.placementRisk);
    counts[risk]++;
  }

  return (Object.entries(counts) as [RiskCategory, number][])
    .map(([category, count]) => ({ category, count }))
    .filter((d) => d.count > 0);
}

function worseRisk(a: RiskCategory, b: RiskCategory): RiskCategory {
  const order: RiskCategory[] = ['low', 'moderate', 'high', 'critical', 'insufficient-data'];
  const aIdx = order.indexOf(a);
  const bIdx = order.indexOf(b);
  // insufficient-data is worse than low/moderate but not worse than high/critical
  if (a === 'insufficient-data') return b === 'high' || b === 'critical' ? b : a;
  if (b === 'insufficient-data') return a === 'high' || a === 'critical' ? a : b;
  return aIdx >= bIdx ? a : b;
}

export function aggregateDepartmentPerformance(
  students: StudentRecord[],
  analyticsMap: Map<string, StudentAnalytics>
): { department: string; avgSuccess: number; avgPlacement: number; count: number; atRisk: number }[] {
  const groups = new Map<string, { successSum: number; placementSum: number; count: number; atRisk: number; placementCount: number }>();

  for (const s of students) {
    const a = analyticsMap.get(s.id);
    if (!a) continue;
    const key = s.department;
    if (!groups.has(key)) {
      groups.set(key, { successSum: 0, placementSum: 0, count: 0, atRisk: 0, placementCount: 0 });
    }
    const g = groups.get(key)!;
    g.successSum += a.successScore.total;
    if (a.placementReadiness.total != null) {
      g.placementSum += a.placementReadiness.total;
      g.placementCount++;
    }
    g.count++;
    if (a.risk.academicRisk === 'high' || a.risk.academicRisk === 'critical') g.atRisk++;
  }

  return Array.from(groups.entries()).map(([department, g]) => ({
    department,
    avgSuccess: Math.round((g.successSum / g.count) * 10) / 10,
    avgPlacement: g.placementCount > 0 ? Math.round((g.placementSum / g.placementCount) * 10) / 10 : 0,
    count: g.count,
    atRisk: g.atRisk,
  }));
}

export function aggregateYearRiskHeatmap(
  students: StudentRecord[],
  analyticsMap: Map<string, StudentAnalytics>
): { department: string; year: number; riskCount: number; totalCount: number; riskLevel: 'low' | 'moderate' | 'high' | 'critical' }[] {
  const groups = new Map<string, { riskCount: number; totalCount: number }>();

  for (const s of students) {
    const a = analyticsMap.get(s.id);
    if (!a) continue;
    const key = `${s.department}|||${s.academicYear}`;
    if (!groups.has(key)) groups.set(key, { riskCount: 0, totalCount: 0 });
    const g = groups.get(key)!;
    g.totalCount++;
    if (a.risk.academicRisk === 'high' || a.risk.academicRisk === 'critical' || a.risk.academicRisk === 'moderate') {
      g.riskCount++;
    }
  }

  const results: { department: string; year: number; riskCount: number; totalCount: number; riskLevel: 'low' | 'moderate' | 'high' | 'critical' }[] = [];

  for (const [key, g] of groups.entries()) {
    const [dept, yr] = key.split('|||');
    const pct = (g.riskCount / g.totalCount) * 100;
    let riskLevel: 'low' | 'moderate' | 'high' | 'critical';
    if (pct >= 60) riskLevel = 'critical';
    else if (pct >= 40) riskLevel = 'high';
    else if (pct >= 20) riskLevel = 'moderate';
    else riskLevel = 'low';

    results.push({
      department: dept,
      year: parseInt(yr),
      riskCount: g.riskCount,
      totalCount: g.totalCount,
      riskLevel,
    });
  }

  return results;
}

export function getEmergingRisks(
  students: StudentRecord[],
  analyticsMap: Map<string, StudentAnalytics>
): { signal: string; count: number; severity: 'warning' | 'danger' }[] {
  let decliningAtt = 0;
  let weakAssess = 0;
  let lowLms = 0;
  let placementGaps = 0;
  let dataPending = 0;

  for (const s of students) {
    const a = analyticsMap.get(s.id);
    if (!a) continue;
    if (a.decliningAttendance) decliningAtt++;
    if (a.weakAssessments) weakAssess++;
    if (s.lmsLoginFrequency < 5) lowLms++;
    if (a.strongAcademicsLowPlacement) placementGaps++;
    if (a.insufficientData) dataPending++;
  }

  const results: { signal: string; count: number; severity: 'warning' | 'danger' }[] = [
    { signal: 'Declining attendance trend', count: decliningAtt, severity: decliningAtt > 15 ? 'danger' as const : 'warning' as const },
    { signal: 'Weak assessment scores (<45%)', count: weakAssess, severity: weakAssess > 15 ? 'danger' as const : 'warning' as const },
    { signal: 'Low LMS engagement (<5 logins/week)', count: lowLms, severity: lowLms > 20 ? 'danger' as const : 'warning' as const },
    { signal: 'Strong academics but low placement readiness', count: placementGaps, severity: 'warning' as const },
    { signal: 'Students with insufficient placement data', count: dataPending, severity: 'warning' as const },
  ];
  return results.filter((r) => r.count > 0);
}

export function getPriorityStudents(
  students: StudentRecord[],
  analyticsMap: Map<string, StudentAnalytics>,
  limit = 10
): { student: StudentRecord; analytics: StudentAnalytics; priority: number }[] {
  const priority: { student: StudentRecord; analytics: StudentAnalytics; priority: number }[] = [];

  for (const s of students) {
    const a = analyticsMap.get(s.id);
    if (!a) continue;

    let score = 0;
    const riskOrder: Record<RiskCategory, number> = { low: 0, moderate: 20, high: 40, critical: 60, 'insufficient-data': 10 };
    score += riskOrder[a.risk.academicRisk] + riskOrder[a.risk.placementRisk];
    score += (100 - a.successScore.total);
    if (a.decliningAttendance) score += 10;

    priority.push({ student: s, analytics: a, priority: score });
  }

  priority.sort((a, b) => b.priority - a.priority);
  return priority.slice(0, limit);
}

export function getRecommendedActions(
  students: StudentRecord[],
  analyticsMap: Map<string, StudentAnalytics>
): { action: string; scope: string; urgency: 'high' | 'medium' | 'low' }[] {
  const actions: { action: string; scope: string; urgency: 'high' | 'medium' | 'low' }[] = [];
  const deptPerf = aggregateDepartmentPerformance(students, analyticsMap);
  const emerging = getEmergingRisks(students, analyticsMap);
  const riskDist = aggregateRiskDistribution(students, analyticsMap);

  const highRiskCount = riskDist.find((r) => r.category === 'high')?.count || 0;
  const criticalCount = riskDist.find((r) => r.category === 'critical')?.count || 0;

  if (criticalCount > 0) {
    actions.push({
      action: `Initiate immediate academic support for ${criticalCount} students at critical risk`,
      scope: 'Institution-wide',
      urgency: 'high',
    });
  }

  const worstDept = deptPerf.filter((d) => d.atRisk > 0).sort((a, b) => b.atRisk - a.atRisk)[0];
  if (worstDept) {
    actions.push({
      action: `Targeted tutoring program for ${worstDept.department} (${worstDept.atRisk} at-risk students)`,
      scope: worstDept.department,
      urgency: 'high',
    });
  }

  const declining = emerging.find((e) => e.signal.includes('Declining attendance'));
  if (declining && declining.count > 10) {
    actions.push({
      action: `Implement attendance mentoring for ${declining.count} students with declining trends`,
      scope: 'Cross-department',
      urgency: 'medium',
    });
  }

  const placementGap = emerging.find((e) => e.signal.includes('Strong academics but low placement'));
  if (placementGap) {
    actions.push({
      action: `Launch placement readiness bootcamp for ${placementGap.count} students with placement gaps`,
      scope: 'Placement Cell',
      urgency: 'medium',
    });
  }

  const dataPending = emerging.find((e) => e.signal.includes('insufficient placement data'));
  if (dataPending) {
    actions.push({
      action: `Collect placement assessment data for ${dataPending.count} students lacking scores`,
      scope: 'Data Collection',
      urgency: 'low',
    });
  }

  if (actions.length === 0) {
    actions.push({
      action: 'No urgent institutional actions required — maintain current support programs',
      scope: 'Institution-wide',
      urgency: 'low',
    });
  }

  return actions;
}
