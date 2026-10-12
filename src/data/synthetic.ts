import type {
  StudentRecord,
  Department,
  AcademicYear,
  Semester,
  AssessmentRecord,
  SubjectAttendance,
  SemesterTrend,
} from '@/types';
import { DEPARTMENTS } from '@/types';

// Deterministic PRNG — same seed produces same data every time
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SUBJECTS_BY_DEPT: Record<Department, string[]> = {
  'Computer Science': ['Data Structures', 'Algorithms', 'DBMS', 'Operating Systems', 'Computer Networks'],
  'Electronics & Communication': ['Digital Logic', 'Signals & Systems', 'Microprocessors', 'Analog Circuits', 'Communication Theory'],
  'Mechanical Engineering': ['Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'Machine Design', 'Heat Transfer'],
  'Civil Engineering': ['Structural Analysis', 'Geotechnical Engineering', 'Transportation Engineering', 'Environmental Engineering', 'Surveying'],
  'Information Technology': ['Web Technologies', 'Cloud Computing', 'Cybersecurity', 'Data Mining', 'Software Engineering'],
  'Electrical Engineering': ['Circuit Theory', 'Power Systems', 'Control Systems', 'Electrical Machines', 'Power Electronics'],
};

const NAMES = [
  'Aarav Sharma', 'Vivaan Patel', 'Aditya Nair', 'Diya Iyer', 'Ananya Reddy',
  'Ishaan Gupta', 'Saanvi Rao', 'Arjun Mehta', 'Myra Krishnan', 'Kabir Singh',
  'Aanya Desai', 'Reyansh Kumar', 'Anika Joshi', 'Ved Agarwal', 'Trisha Menon',
  'Aryan Bose', 'Sara Verma', 'Dhruv Chopra', 'Kiara Nair', 'Rohan Pillai',
  'Navya Bhat', 'Atharv Sinha', 'Tara Raghavan', 'Yuvan Das', 'Meera Kulkarni',
  'Shaurya Malhotra', 'Riya Banerjee', 'Karthik Subramanian', 'Ira Chauhan', 'Devansh Trivedi',
  'Naina Saxena', 'Ayaan Quershi', 'Pari Dube', 'Vihaan Jain', 'Ahana Ghosh',
  'Manav Puri', 'Sneha Bhandari', 'Aditya Rana', 'Riya Mittal', 'Aarush Lakhani',
  'Saanvi Gowda', 'Ishaan Choudhury', 'Aadhya Pai', 'Arnav Sehgal', 'Diya Nambiar',
  'Kabir Khurana', 'Anaya Pandey', 'Reyansh Tandon', 'Myra Sabharwal', 'Vivaan Gokhale',
];

function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function genAssessmentMarks(rng: () => number, subjects: string[], quality: number): AssessmentRecord[] {
  return subjects.map((subject) => ({
    subject,
    marks: round(clamp(quality + (rng() - 0.5) * 20, 20, 100)),
  }));
}

function genSubjectAttendance(rng: () => number, subjects: string[], base: number): SubjectAttendance[] {
  return subjects.map((subject) => ({
    subject,
    attendance: round(clamp(base + (rng() - 0.5) * 15, 30, 100)),
  }));
}

function genSemesterTrends(rng: () => number, currentSem: Semester, baseSgpa: number, declining: boolean): SemesterTrend[] {
  const trends: SemesterTrend[] = [];
  for (let s = 1; s <= currentSem; s++) {
    let sgpa: number;
    if (declining && s > 1) {
      sgpa = round(clamp(baseSgpa - (s - 1) * (0.3 + rng() * 0.3), 4, 10));
    } else {
      sgpa = round(clamp(baseSgpa + (rng() - 0.5) * 0.5, 4, 10));
    }
    trends.push({
      semester: s as Semester,
      sgpa,
      attendance: round(clamp(75 + (rng() - 0.5) * 20, 40, 100)),
    });
  }
  return trends;
}

function generateStudent(rng: () => number, index: number, forceProfile?: string): StudentRecord {
  const dept = pick(rng, DEPARTMENTS);
  const subjects = SUBJECTS_BY_DEPT[dept];
  const academicYear = (Math.floor(rng() * 4) + 1) as AcademicYear;
  const semester = (Math.floor(rng() * 8) + 1) as Semester;

  const name = pick(rng, NAMES);
  const studentId = `STU-${String(10001 + index).padStart(5, '0')}`;

  // Determine profile archetype
  const profile = forceProfile || pick(rng, [
    'high-achiever', 'high-achiever',
    'consistent-performer', 'consistent-performer', 'consistent-performer',
    'at-risk', 'at-risk',
    'placement-gaps', 'placement-gaps', 'placement-gaps',
    'skill-mismatch', 'skill-mismatch',
    'low-engagement', 'low-engagement',
    'data-pending',
  ]);

  let cgpa: number;
  let overallAttendance: number;
  let lmsLoginFreq: number;
  let assignmentCompletion: number;
  let aptitude: number | null;
  let coding: number | null;
  let mockInterview: number | null;
  let technicalSkill: number | null;
  let communicationSkill: number | null;
  let placementParticipation: boolean;
  let placementStatus: StudentRecord['placementStatus'];
  let eventParticipation: number;
  let certificationCount: number;
  let feedbackRating: number;
  let decliningAttendance = false;

  switch (profile) {
    case 'high-achiever':
      cgpa = round(clamp(8.5 + rng() * 1.3, 8, 10));
      overallAttendance = round(clamp(88 + rng() * 10, 80, 100));
      lmsLoginFreq = Math.floor(clamp(15 + rng() * 10, 10, 25));
      assignmentCompletion = round(clamp(90 + rng() * 10, 85, 100));
      aptitude = round(clamp(80 + rng() * 18, 70, 100));
      coding = round(clamp(78 + rng() * 20, 65, 100));
      mockInterview = round(clamp(80 + rng() * 18, 70, 100));
      technicalSkill = round(clamp(4 + rng() * 1, 3.5, 5));
      communicationSkill = round(clamp(4 + rng() * 1, 3.5, 5));
      placementParticipation = academicYear >= 3;
      placementStatus = academicYear >= 4 ? (rng() > 0.2 ? 'placed' : 'in-process') : (academicYear >= 3 ? 'in-process' : 'not-started');
      eventParticipation = Math.floor(clamp(8 + rng() * 6, 5, 15));
      certificationCount = Math.floor(clamp(3 + rng() * 4, 2, 8));
      feedbackRating = round(clamp(4 + rng() * 1, 3.5, 5));
      break;

    case 'consistent-performer':
      cgpa = round(clamp(7 + rng() * 1.2, 6.5, 8.5));
      overallAttendance = round(clamp(78 + rng() * 12, 70, 95));
      lmsLoginFreq = Math.floor(clamp(10 + rng() * 6, 6, 18));
      assignmentCompletion = round(clamp(78 + rng() * 12, 70, 95));
      aptitude = round(clamp(65 + rng() * 15, 55, 85));
      coding = round(clamp(60 + rng() * 20, 50, 85));
      mockInterview = round(clamp(65 + rng() * 15, 55, 85));
      technicalSkill = round(clamp(3 + rng() * 1, 2.5, 4.5));
      communicationSkill = round(clamp(3 + rng() * 1, 2.5, 4.5));
      placementParticipation = academicYear >= 3;
      placementStatus = academicYear >= 4 ? (rng() > 0.4 ? 'placed' : 'unplaced') : (academicYear >= 3 ? 'in-process' : 'not-started');
      eventParticipation = Math.floor(clamp(4 + rng() * 5, 2, 10));
      certificationCount = Math.floor(clamp(1 + rng() * 3, 0, 5));
      feedbackRating = round(clamp(3.5 + rng() * 0.8, 3, 4.5));
      break;

    case 'at-risk':
      cgpa = round(clamp(5 + rng() * 1.5, 4, 6.5));
      overallAttendance = round(clamp(55 + rng() * 15, 40, 72));
      lmsLoginFreq = Math.floor(clamp(3 + rng() * 4, 1, 8));
      assignmentCompletion = round(clamp(50 + rng() * 15, 35, 70));
      aptitude = round(clamp(45 + rng() * 15, 35, 65));
      coding = round(clamp(40 + rng() * 20, 30, 65));
      mockInterview = round(clamp(45 + rng() * 15, 35, 65));
      technicalSkill = round(clamp(2 + rng() * 1, 1.5, 3.5));
      communicationSkill = round(clamp(2 + rng() * 1, 1.5, 3.5));
      placementParticipation = academicYear >= 3 && rng() > 0.5;
      placementStatus = academicYear >= 4 ? 'unplaced' : 'not-started';
      eventParticipation = Math.floor(clamp(1 + rng() * 3, 0, 4));
      certificationCount = Math.floor(rng() * 2);
      feedbackRating = round(clamp(2.5 + rng() * 1, 2, 4));
      decliningAttendance = rng() > 0.5;
      break;

    case 'placement-gaps':
      cgpa = round(clamp(8 + rng() * 1.2, 7.5, 9.5));
      overallAttendance = round(clamp(82 + rng() * 10, 75, 95));
      lmsLoginFreq = Math.floor(clamp(12 + rng() * 6, 8, 20));
      assignmentCompletion = round(clamp(85 + rng() * 10, 78, 98));
      aptitude = round(clamp(55 + rng() * 15, 45, 75));
      coding = round(clamp(48 + rng() * 18, 35, 70));
      mockInterview = round(clamp(50 + rng() * 15, 40, 70));
      technicalSkill = round(clamp(3.5 + rng() * 1, 3, 4.5));
      communicationSkill = round(clamp(2.5 + rng() * 1, 2, 3.5));
      placementParticipation = academicYear >= 3;
      placementStatus = academicYear >= 4 ? 'unplaced' : (academicYear >= 3 ? 'in-process' : 'not-started');
      eventParticipation = Math.floor(clamp(5 + rng() * 4, 3, 10));
      certificationCount = Math.floor(clamp(1 + rng() * 3, 0, 5));
      feedbackRating = round(clamp(3.5 + rng() * 0.8, 3, 4.5));
      break;

    case 'skill-mismatch':
      cgpa = round(clamp(7.5 + rng() * 1, 7, 9));
      overallAttendance = round(clamp(80 + rng() * 10, 72, 92));
      lmsLoginFreq = Math.floor(clamp(10 + rng() * 5, 7, 16));
      assignmentCompletion = round(clamp(82 + rng() * 10, 75, 95));
      aptitude = round(clamp(70 + rng() * 15, 60, 90));
      coding = round(clamp(75 + rng() * 18, 65, 95));
      mockInterview = round(clamp(45 + rng() * 15, 35, 65));
      technicalSkill = round(clamp(4 + rng() * 0.8, 3.5, 5));
      communicationSkill = round(clamp(2 + rng() * 1, 1.5, 3));
      placementParticipation = academicYear >= 3;
      placementStatus = academicYear >= 4 ? (rng() > 0.5 ? 'unplaced' : 'in-process') : 'not-started';
      eventParticipation = Math.floor(clamp(4 + rng() * 4, 2, 9));
      certificationCount = Math.floor(clamp(2 + rng() * 3, 1, 6));
      feedbackRating = round(clamp(3.5 + rng() * 0.7, 3, 4.5));
      break;

    case 'low-engagement':
      cgpa = round(clamp(6.5 + rng() * 1.2, 5.5, 8));
      overallAttendance = round(clamp(65 + rng() * 12, 55, 80));
      lmsLoginFreq = Math.floor(clamp(2 + rng() * 3, 1, 6));
      assignmentCompletion = round(clamp(60 + rng() * 15, 45, 78));
      aptitude = round(clamp(55 + rng() * 15, 45, 75));
      coding = round(clamp(50 + rng() * 18, 35, 72));
      mockInterview = round(clamp(55 + rng() * 15, 45, 75));
      technicalSkill = round(clamp(3 + rng() * 1, 2, 4));
      communicationSkill = round(clamp(3 + rng() * 1, 2, 4));
      placementParticipation = academicYear >= 3 && rng() > 0.6;
      placementStatus = academicYear >= 4 ? (rng() > 0.6 ? 'unplaced' : 'in-process') : 'not-started';
      eventParticipation = Math.floor(rng() * 2);
      certificationCount = 0;
      feedbackRating = round(clamp(3 + rng() * 0.8, 2.5, 4));
      decliningAttendance = rng() > 0.3;
      break;

    case 'data-pending':
      cgpa = round(clamp(7 + rng() * 1.5, 6, 9));
      overallAttendance = round(clamp(78 + rng() * 12, 70, 92));
      lmsLoginFreq = Math.floor(clamp(8 + rng() * 6, 5, 16));
      assignmentCompletion = round(clamp(80 + rng() * 10, 70, 95));
      // Missing placement data
      aptitude = null;
      coding = null;
      mockInterview = null;
      technicalSkill = null;
      communicationSkill = null;
      placementParticipation = false;
      placementStatus = 'not-started';
      eventParticipation = Math.floor(clamp(3 + rng() * 4, 1, 8));
      certificationCount = Math.floor(clamp(1 + rng() * 2, 0, 4));
      feedbackRating = round(clamp(3.5 + rng() * 0.8, 3, 4.5));
      break;

    default:
      cgpa = 7.5;
      overallAttendance = 80;
      lmsLoginFreq = 10;
      assignmentCompletion = 82;
      aptitude = 65;
      coding = 60;
      mockInterview = 60;
      technicalSkill = 3.5;
      communicationSkill = 3.5;
      placementParticipation = false;
      placementStatus = 'not-started';
      eventParticipation = 4;
      certificationCount = 2;
      feedbackRating = 4;
  }

  const assessmentMarks = genAssessmentMarks(rng, subjects, profile === 'high-achiever' ? 88 : profile === 'at-risk' ? 55 : profile === 'consistent-performer' ? 75 : 70);
  const subjectAttendance = genSubjectAttendance(rng, subjects, overallAttendance);
  const semesterTrends = genSemesterTrends(rng, semester, cgpa, decliningAttendance);

  const feedbackSamples: Record<string, string> = {
    'high-achiever': 'Excellent academic performance and strong placement readiness. Consistent across all areas.',
    'consistent-performer': 'Steady performer with reliable academic record. Could benefit from additional placement preparation.',
    'at-risk': 'Multiple risk indicators present — low attendance, declining grades, and poor engagement. Urgent intervention needed.',
    'placement-gaps': 'Strong academics but placement readiness gaps detected. Focus on aptitude, coding, and interview skills.',
    'skill-mismatch': 'Good technical skills but interview performance is weak. Communication coaching and mock interview practice recommended.',
    'low-engagement': 'Low LMS engagement and limited extracurricular participation. Motivation and engagement strategies needed.',
    'data-pending': 'Placement-related data not yet available. Collect aptitude, coding, and interview scores for full assessment.',
  };

  return {
    id: studentId,
    name,
    department: dept,
    academicYear,
    semester,
    isSynthetic: true,
    cgpa,
    assessmentMarks,
    semesterTrends,
    overallAttendance,
    subjectAttendance,
    lmsLoginFrequency: lmsLoginFreq,
    assignmentCompletion,
    eventParticipation,
    certificationCount,
    feedbackRating,
    aptitudeScore: aptitude,
    codingScore: coding,
    mockInterviewScore: mockInterview,
    technicalSkillRating: technicalSkill,
    communicationSkillRating: communicationSkill,
    placementParticipation,
    placementStatus,
    studentFeedback: feedbackSamples[profile] || 'No additional feedback.',
  };
}

export function generateSyntheticStudents(count = 150): StudentRecord[] {
  const rng = mulberry32(42); // fixed seed for deterministic output
  const students: StudentRecord[] = [];

  // Ensure we have a good distribution of profiles
  const profileDistribution: string[] = [];
  const profiles = [
    { name: 'high-achiever', pct: 0.15 },
    { name: 'consistent-performer', pct: 0.30 },
    { name: 'at-risk', pct: 0.15 },
    { name: 'placement-gaps', pct: 0.15 },
    { name: 'skill-mismatch', pct: 0.10 },
    { name: 'low-engagement', pct: 0.10 },
    { name: 'data-pending', pct: 0.05 },
  ];

  for (const p of profiles) {
    const n = Math.round(count * p.pct);
    for (let i = 0; i < n; i++) profileDistribution.push(p.name);
  }
  while (profileDistribution.length < count) profileDistribution.push('consistent-performer');

  // Shuffle deterministically
  for (let i = profileDistribution.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [profileDistribution[i], profileDistribution[j]] = [profileDistribution[j], profileDistribution[i]];
  }

  for (let i = 0; i < count; i++) {
    students.push(generateStudent(rng, i, profileDistribution[i]));
  }

  return students;
}
