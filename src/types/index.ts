// ============================================================
// CAMPUS PULSE AI — Core Data Models
// ============================================================

export type Department =
  | 'Computer Science'
  | 'Electronics & Communication'
  | 'Mechanical Engineering'
  | 'Civil Engineering'
  | 'Information Technology'
  | 'Electrical Engineering';

export const DEPARTMENTS: Department[] = [
  'Computer Science',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Electrical Engineering',
];

export type AcademicYear = 1 | 2 | 3 | 4;
export type Semester = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type RiskCategory = 'low' | 'moderate' | 'high' | 'critical' | 'insufficient-data';

export type StudentSegment =
  | 'high-achiever'
  | 'consistent-performer'
  | 'at-risk'
  | 'placement-gaps'
  | 'skill-mismatch'
  | 'low-engagement'
  | 'data-pending';

export type InterventionType =
  | 'attendance-mentoring'
  | 'subject-tutoring'
  | 'assignment-recovery'
  | 'coding-practice'
  | 'aptitude-training'
  | 'mock-interviews'
  | 'communication-coaching'
  | 'certification-program';

export type InterventionStatus =
  | 'recommended'
  | 'accepted'
  | 'in-progress'
  | 'completed'
  | 'on-hold'
  | 'declined';

// ----------------------------------------------------------------
// Raw student record — all source data for a single student
// ----------------------------------------------------------------

export interface SubjectAttendance {
  subject: string;
  attendance: number; // 0-100
}

export interface AssessmentRecord {
  subject: string;
  marks: number; // 0-100
}

export interface SemesterTrend {
  semester: Semester;
  sgpa: number; // 0-10
  attendance: number; // 0-100
}

export interface StudentRecord {
  id: string;
  name: string;
  department: Department;
  academicYear: AcademicYear;
  semester: Semester;
  isSynthetic: boolean;

  // Academic
  cgpa: number; // 0-10
  assessmentMarks: AssessmentRecord[];
  semesterTrends: SemesterTrend[];

  // Attendance
  overallAttendance: number; // 0-100
  subjectAttendance: SubjectAttendance[];

  // LMS / Engagement
  lmsLoginFrequency: number; // logins per week
  assignmentCompletion: number; // 0-100 percent
  eventParticipation: number; // count of events attended
  certificationCount: number; // count of certifications
  feedbackRating: number; // 1-5 student feedback rating

  // Skills / Placement
  aptitudeScore: number | null; // 0-100
  codingScore: number | null; // 0-100
  mockInterviewScore: number | null; // 0-100
  technicalSkillRating: number | null; // 1-5
  communicationSkillRating: number | null; // 1-5
  placementParticipation: boolean; // has participated in placement drives
  placementStatus: 'not-started' | 'in-process' | 'placed' | 'unplaced';

  // Free-text feedback
  studentFeedback: string;
}

// ----------------------------------------------------------------
// Computed analytics — derived from StudentRecord
// ----------------------------------------------------------------

export interface ScoreComponent {
  label: string;
  rawValue: number; // normalized 0-100
  weight: number; // 0-1
  contribution: number; // rawValue * weight
  isMissing: boolean;
}

export interface StudentSuccessScore {
  total: number; // 0-100
  components: ScoreComponent[];
  dataCompleteness: number; // 0-100 percent of non-missing fields
  topPositiveContributor: ScoreComponent | null;
  topNegativeContributor: ScoreComponent | null;
}

export interface PlacementReadinessScore {
  total: number | null; // null if insufficient data
  components: ScoreComponent[];
  dataCompleteness: number; // 0-100
  isReady: boolean;
  topGap: ScoreComponent | null;
  topStrength: ScoreComponent | null;
}

export interface RiskAssessment {
  academicRisk: RiskCategory;
  placementRisk: RiskCategory;
  academicRiskReasons: string[];
  placementRiskReasons: string[];
}

export interface StudentAnalytics {
  successScore: StudentSuccessScore;
  placementReadiness: PlacementReadinessScore;
  risk: RiskAssessment;
  segment: StudentSegment;
  decliningAttendance: boolean;
  weakAssessments: boolean;
  strongAcademicsLowPlacement: boolean;
  strongTechWeakInterview: boolean;
  placementReady: boolean;
  insufficientData: boolean;
}

// ----------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------

export interface ScoreWeights {
  academicPerformance: number; // 0.30
  attendance: number; // 0.20
  lmsEngagement: number; // 0.15
  assessmentConsistency: number; // 0.15
  skillDevelopment: number; // 0.10
  participationFeedback: number; // 0.10
}

export interface PlacementWeights {
  aptitude: number;
  coding: number;
  mockInterview: number;
  technicalSkill: number;
  communicationSkill: number;
  placementPrep: number;
}

export interface RiskThresholds {
  moderateMax: number; // below this = moderate risk
  highMax: number; // below this = high risk
  criticalMax: number; // below this = critical risk
  insufficientDataMax: number; // data completeness below this = insufficient-data
}

export interface AppConfig {
  scoreWeights: ScoreWeights;
  placementWeights: PlacementWeights;
  riskThresholds: RiskThresholds;
  defaultFacultyHours: number;
  showSyntheticOnly: boolean;
  theme: 'dark';
}

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  academicPerformance: 0.30,
  attendance: 0.20,
  lmsEngagement: 0.15,
  assessmentConsistency: 0.15,
  skillDevelopment: 0.10,
  participationFeedback: 0.10,
};

export const DEFAULT_PLACEMENT_WEIGHTS: PlacementWeights = {
  aptitude: 0.25,
  coding: 0.25,
  mockInterview: 0.20,
  technicalSkill: 0.15,
  communicationSkill: 0.10,
  placementPrep: 0.05,
};

export const DEFAULT_RISK_THRESHOLDS: RiskThresholds = {
  moderateMax: 75,
  highMax: 60,
  criticalMax: 45,
  insufficientDataMax: 50,
};

export const DEFAULT_CONFIG: AppConfig = {
  scoreWeights: DEFAULT_SCORE_WEIGHTS,
  placementWeights: DEFAULT_PLACEMENT_WEIGHTS,
  riskThresholds: DEFAULT_RISK_THRESHOLDS,
  defaultFacultyHours: 120,
  showSyntheticOnly: false,
  theme: 'dark',
};

// ----------------------------------------------------------------
// Intervention tracking
// ----------------------------------------------------------------

export interface InterventionRecord {
  id: string;
  studentId: string;
  type: InterventionType;
  status: InterventionStatus;
  reason: string;
  estimatedHours: number;
  assignedFaculty: string | null;
  followUpDate: string | null; // ISO date
  acceptedDate: string | null;
  completedDate: string | null;
  // Outcome tracking
  beforeSuccessScore: number | null;
  afterSuccessScore: number | null;
  beforePlacementScore: number | null;
  afterPlacementScore: number | null;
  outcomeNotes: string;
  createdAt: string; // ISO timestamp
}

// ----------------------------------------------------------------
// CSV Import
// ----------------------------------------------------------------

export type CsvCategory =
  | 'student'
  | 'academic'
  | 'attendance'
  | 'lms'
  | 'skills'
  | 'engagement'
  | 'placement'
  | 'intervention';

export interface CsvColumnMapping {
  csvHeader: string;
  targetField: string;
}

export interface CsvImportResult {
  category: CsvCategory;
  fileName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: { row: number; field: string; message: string }[];
  importedStudentIds: string[];
  duplicatesDetected: number;
  missingValuesReport: { field: string; missingCount: number }[];
}

export interface CsvValidationIssue {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// ----------------------------------------------------------------
// Chat / Analyst
// ----------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: 'user' | 'analyst';
  content: string;
  evidence?: {
    count?: number;
    studentIds?: string[];
    chartData?: { label: string; value: number }[];
  };
  timestamp: string;
}

// ----------------------------------------------------------------
// Simulation
// ----------------------------------------------------------------

export interface SimulationAdjustment {
  field: keyof StudentRecord | string;
  delta: number; // amount to adjust
  label: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  studentId: string;
  adjustments: {
    attendance?: number; // delta in percentage points
    assignmentCompletion?: number; // delta in percentage points
    lmsLogins?: number; // delta in logins/week
    aptitude?: number; // delta in score
    coding?: number; // delta in score
    mockInterview?: number; // delta in score
    communication?: number; // delta in rating points (1-5 scale)
    technical?: number; // delta in rating points
    cgpa?: number; // delta in CGPA points
  };
  facultyHours: number;
  interventionType: InterventionType | null;
  results: {
    baselineSuccess: number;
    scenarioSuccess: number;
    baselinePlacement: number | null;
    scenarioPlacement: number | null;
    baselineAcademicRisk: RiskCategory;
    scenarioAcademicRisk: RiskCategory;
    baselinePlacementRisk: RiskCategory;
    scenarioPlacementRisk: RiskCategory;
  } | null;
  createdAt: string;
}

// ----------------------------------------------------------------
// Navigation
// ----------------------------------------------------------------

export type PageId =
  | 'command-center'
  | 'student-explorer'
  | 'predictive-intelligence'
  | 'intervention-lab'
  | 'resource-optimizer'
  | 'ai-analyst'
  | 'data-integration'
  | 'outcomes-impact'
  | 'settings';

// ----------------------------------------------------------------
// Filters
// ----------------------------------------------------------------

export interface DashboardFilters {
  department: Department | 'all';
  academicYear: AcademicYear | 'all';
  semester: Semester | 'all';
  riskCategory: RiskCategory | 'all';
  segment: StudentSegment | 'all';
}
