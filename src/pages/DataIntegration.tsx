import { useState, useRef } from 'react';
import { useAppStore } from '@/store/AppStore';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button, Select } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Modal';
import type { CsvCategory, StudentRecord, Department, AcademicYear, Semester } from '@/types';
import { DEPARTMENTS } from '@/types';
import {
  Database, Upload, FileText, CheckCircle, AlertTriangle,
  Download, RefreshCw, Info, Table as TableIcon, X,
} from 'lucide-react';

interface ParsedCsv { headers: string[]; rows: string[][]; }
interface ValidationIssue { row: number; field: string; message: string; severity: 'error' | 'warning'; }

const CATEGORY_OPTIONS: { value: CsvCategory; label: string }[] = [
  { value: 'student', label: 'Student Records' },
  { value: 'academic', label: 'Academic Records' },
  { value: 'attendance', label: 'Attendance Records' },
  { value: 'lms', label: 'LMS Engagement' },
  { value: 'skills', label: 'Skills & Placement' },
  { value: 'engagement', label: 'Engagement Records' },
  { value: 'placement', label: 'Placement Records' },
  { value: 'intervention', label: 'Intervention Records' },
];

const SAMPLE_TEMPLATES: Record<string, { filename: string; headers: string[]; sampleRow: string[] }> = {
  student: { filename: 'sample_students.csv', headers: ['student_id', 'name', 'department', 'academic_year', 'semester', 'cgpa'], sampleRow: ['STU-20001', 'John Doe', 'Computer Science', '3', '5', '7.5'] },
  academic: { filename: 'sample_academic.csv', headers: ['student_id', 'cgpa', 'subject', 'marks'], sampleRow: ['STU-20001', '7.5', 'Data Structures', '78'] },
  attendance: { filename: 'sample_attendance.csv', headers: ['student_id', 'overall_attendance', 'subject', 'subject_attendance'], sampleRow: ['STU-20001', '82', 'Data Structures', '85'] },
  lms: { filename: 'sample_lms.csv', headers: ['student_id', 'lms_logins', 'assignment_completion'], sampleRow: ['STU-20001', '12', '85'] },
  skills: { filename: 'sample_skills.csv', headers: ['student_id', 'aptitude_score', 'coding_score', 'mock_interview_score', 'technical_skill', 'communication_skill'], sampleRow: ['STU-20001', '70', '65', '60', '3.5', '3.5'] },
  engagement: { filename: 'sample_engagement.csv', headers: ['student_id', 'event_participation', 'certification_count', 'feedback_rating'], sampleRow: ['STU-20001', '5', '2', '4'] },
  placement: { filename: 'sample_placement.csv', headers: ['student_id', 'placement_participation', 'placement_status'], sampleRow: ['STU-20001', 'true', 'in-process'] },
  intervention: { filename: 'sample_intervention.csv', headers: ['student_id', 'type', 'status', 'reason', 'estimated_hours'], sampleRow: ['STU-20001', 'coding-practice', 'recommended', 'Low coding score', '12'] },
};

function splitCsvLine(line: string): string[] {
  const result: string[] = []; let current = ''; let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else current += char;
  }
  result.push(current.trim()); return result;
}

function parseCsv(text: string): ParsedCsv {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  return { headers: splitCsvLine(lines[0]), rows: lines.slice(1).map(splitCsvLine) };
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function DataIntegration() {
  const { students, addStudents, resetAllData } = useAppStore();
  const [category, setCategory] = useState<CsvCategory>('student');
  const [parsedCsv, setParsedCsv] = useState<ParsedCsv | null>(null);
  const [fileName, setFileName] = useState('');
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setParsedCsv(parseCsv(text)); setFileName(file.name);
      setValidationIssues([]); setImportSummary(null);
    };
    reader.readAsText(file);
  };

  const handleValidate = () => {
    if (!parsedCsv) return;
    const issues: ValidationIssue[] = [];
    const studentIds = new Set(students.map((s) => s.id));
    const seenIds = new Set<string>();
    const idIdx = parsedCsv.headers.findIndex((h) => h.toLowerCase().includes('student_id') || h.toLowerCase() === 'id');
    if (idIdx === -1) issues.push({ row: 1, field: 'header', message: 'No student_id column found', severity: 'error' });

    parsedCsv.rows.forEach((row, rowIdx) => {
      const rowNum = rowIdx + 2;
      if (idIdx >= 0) {
        const id = row[idIdx]?.trim();
        if (!id) issues.push({ row: rowNum, field: 'student_id', message: 'Missing student ID', severity: 'error' });
        else if (seenIds.has(id)) issues.push({ row: rowNum, field: 'student_id', message: `Duplicate: ${id}`, severity: 'warning' });
        else { seenIds.add(id); if (!studentIds.has(id) && category !== 'student') issues.push({ row: rowNum, field: 'student_id', message: `ID ${id} not found — will be skipped`, severity: 'warning' }); }
      }
      if (category === 'student') {
        const deptIdx = parsedCsv.headers.findIndex((h) => h.toLowerCase().includes('department'));
        if (deptIdx >= 0) { const dept = row[deptIdx]?.trim(); if (dept && !DEPARTMENTS.includes(dept as Department)) issues.push({ row: rowNum, field: 'department', message: `Unknown: ${dept}`, severity: 'warning' }); }
        const cgpaIdx = parsedCsv.headers.findIndex((h) => h.toLowerCase().includes('cgpa'));
        if (cgpaIdx >= 0) { const cgpa = parseFloat(row[cgpaIdx]); if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) issues.push({ row: rowNum, field: 'cgpa', message: `Invalid: ${row[cgpaIdx]}`, severity: 'error' }); }
      }
    });
    setValidationIssues(issues);
  };

  const handleImport = () => {
    if (!parsedCsv) return;
    const errors = validationIssues.filter((v) => v.severity === 'error');
    if (errors.length > 0) { setImportSummary(`Import blocked: ${errors.length} errors.`); setShowConfirm(false); return; }

    const existingIds = new Set(students.map((s) => s.id));
    let importedCount = 0, updatedCount = 0, skippedCount = 0;
    const newRecords: StudentRecord[] = [];
    const h = parsedCsv.headers;
    const idx = (key: string) => h.findIndex((x) => x.toLowerCase().includes(key));
    const idIdx = idx('student_id') >= 0 ? idx('student_id') : idx('id');
    const nameIdx = idx('name'); const deptIdx = idx('department'); const yearIdx = idx('academic_year');
    const semIdx = idx('semester'); const cgpaIdx = idx('cgpa'); const attIdx = idx('overall_attendance');
    const lmsIdx = idx('lms_logins'); const assignIdx = idx('assignment_completion');
    const aptIdx = idx('aptitude'); const codeIdx = idx('coding'); const mockIdx = idx('mock_interview');
    const techIdx = idx('technical_skill'); const commIdx = idx('communication');
    const eventIdx = idx('event'); const certIdx = idx('certification'); const fbIdx = idx('feedback');
    const ppIdx = idx('placement_participation'); const psIdx = idx('placement_status');

    for (const row of parsedCsv.rows) {
      const id = idIdx >= 0 ? row[idIdx]?.trim() : '';
      if (!id) { skippedCount++; continue; }
      if (existingIds.has(id)) { updatedCount++; continue; }
      newRecords.push({
        id, name: nameIdx >= 0 ? row[nameIdx] || id : id,
        department: (deptIdx >= 0 && DEPARTMENTS.includes(row[deptIdx] as Department) ? row[deptIdx] : 'Computer Science') as Department,
        academicYear: (yearIdx >= 0 ? Math.max(1, Math.min(4, parseInt(row[yearIdx]) || 1)) : 1) as AcademicYear,
        semester: (semIdx >= 0 ? Math.max(1, Math.min(8, parseInt(row[semIdx]) || 1)) : 1) as Semester,
        isSynthetic: false,
        cgpa: cgpaIdx >= 0 ? Math.max(0, Math.min(10, parseFloat(row[cgpaIdx]) || 0)) : 0,
        assessmentMarks: [], semesterTrends: [],
        overallAttendance: attIdx >= 0 ? Math.max(0, Math.min(100, parseFloat(row[attIdx]) || 0)) : 0,
        subjectAttendance: [],
        lmsLoginFrequency: lmsIdx >= 0 ? Math.max(0, parseInt(row[lmsIdx]) || 0) : 0,
        assignmentCompletion: assignIdx >= 0 ? Math.max(0, Math.min(100, parseFloat(row[assignIdx]) || 0)) : 0,
        eventParticipation: eventIdx >= 0 ? Math.max(0, parseInt(row[eventIdx]) || 0) : 0,
        certificationCount: certIdx >= 0 ? Math.max(0, parseInt(row[certIdx]) || 0) : 0,
        feedbackRating: fbIdx >= 0 ? Math.max(1, Math.min(5, parseFloat(row[fbIdx]) || 3)) : 3,
        aptitudeScore: aptIdx >= 0 && row[aptIdx] ? Math.max(0, Math.min(100, parseFloat(row[aptIdx]))) : null,
        codingScore: codeIdx >= 0 && row[codeIdx] ? Math.max(0, Math.min(100, parseFloat(row[codeIdx]))) : null,
        mockInterviewScore: mockIdx >= 0 && row[mockIdx] ? Math.max(0, Math.min(100, parseFloat(row[mockIdx]))) : null,
        technicalSkillRating: techIdx >= 0 && row[techIdx] ? Math.max(1, Math.min(5, parseFloat(row[techIdx]))) : null,
        communicationSkillRating: commIdx >= 0 && row[commIdx] ? Math.max(1, Math.min(5, parseFloat(row[commIdx]))) : null,
        placementParticipation: ppIdx >= 0 ? row[ppIdx]?.toLowerCase() === 'true' : false,
        placementStatus: psIdx >= 0 ? (row[psIdx] as StudentRecord['placementStatus']) || 'not-started' : 'not-started',
        studentFeedback: 'Imported record.',
      });
      importedCount++;
    }
    if (newRecords.length > 0) addStudents(newRecords, true);
    setImportSummary(`Import complete: ${importedCount} new, ${updatedCount} matched, ${skippedCount} skipped.`);
    setShowConfirm(false);
  };

  const handleDownloadTemplate = (cat: string) => {
    const t = SAMPLE_TEMPLATES[cat]; if (!t) return;
    downloadFile(t.filename, [t.headers.join(','), t.sampleRow.join(',')].join('\n'));
  };

  const handleDownloadReport = () => {
    if (!parsedCsv) return;
    downloadFile(`validation_report.txt`, [
      `Validation Report — ${fileName} — ${new Date().toISOString()}`,
      `Rows: ${parsedCsv.rows.length}`, ``,
      ...validationIssues.map((v) => `[${v.severity}] Row ${v.row}, ${v.field}: ${v.message}`),
    ].join('\n'));
  };

  const handleReset = () => { resetAllData(); setParsedCsv(null); setValidationIssues([]); setImportSummary(null); setFileName(''); };
  const errorCount = validationIssues.filter((v) => v.severity === 'error').length;
  const warningCount = validationIssues.filter((v) => v.severity === 'warning').length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-midnight-50">Data Integration Hub</h1>
        <p className="text-sm text-midnight-400 mt-0.5">Upload, validate, and import CSV data</p>
      </div>

      <div className="rounded-lg border border-info/20 bg-info/5 px-4 py-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
        <p className="text-xs text-midnight-300">Imported records merge by student ID. Demo data is marked as synthetic. A confirmation step appears before applying imports.</p>
      </div>

      <Card>
        <CardHeader title="Sample CSV Templates" subtitle="Download templates for each category" icon={<Download className="w-4 h-4" />} />
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORY_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => handleDownloadTemplate(opt.value)} className="flex items-center gap-2 rounded-lg border border-midnight-700/40 bg-midnight-800/20 px-3 py-2 text-xs text-midnight-300 transition-all hover:border-teal-500/30 hover:bg-teal-500/5 hover:text-midnight-100">
                <FileText className="w-3.5 h-3.5 text-teal-400 shrink-0" />{opt.label}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Upload & Import" icon={<Upload className="w-4 h-4" />} />
        <CardBody>
          <div className="space-y-4">
            <Select label="Data Category" value={category} onChange={(v) => setCategory(v as CsvCategory)} options={CATEGORY_OPTIONS} className="max-w-xs" />
            <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-midnight-600 bg-midnight-800/20 py-10 cursor-pointer transition-colors hover:border-teal-500/50 hover:bg-teal-500/5">
              <Upload className="w-8 h-8 text-midnight-400 mb-2" />
              <p className="text-sm text-midnight-200">{fileName || 'Click to select a CSV file'}</p>
              <p className="text-xs text-midnight-500 mt-1">.csv format</p>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </div>

            {parsedCsv && (
              <>
                <div>
                  <p className="text-xs font-semibold text-midnight-300 mb-2 flex items-center gap-1.5"><TableIcon className="w-3.5 h-3.5 text-teal-400" />Preview ({parsedCsv.rows.length} rows)</p>
                  <div className="overflow-x-auto rounded-lg border border-midnight-700/40 max-h-60">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-midnight-800"><tr>{parsedCsv.headers.map((h, i) => <th key={i} className="px-2 py-1.5 text-left font-semibold text-midnight-300 whitespace-nowrap">{h}</th>)}</tr></thead>
                      <tbody>{parsedCsv.rows.slice(0, 10).map((row, i) => <tr key={i} className="border-t border-midnight-700/30">{parsedCsv.headers.map((_, j) => <td key={j} className="px-2 py-1.5 text-midnight-200 whitespace-nowrap">{row[j] || <span className="text-midnight-600">—</span>}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" icon={<CheckCircle className="w-3.5 h-3.5" />} onClick={handleValidate}>Validate</Button>
                  <Button variant="primary" size="sm" icon={<Upload className="w-3.5 h-3.5" />} onClick={() => { handleValidate(); setShowConfirm(true); }}>Import</Button>
                  <Button variant="ghost" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={handleDownloadReport} disabled={validationIssues.length === 0}>Report</Button>
                  <Button variant="ghost" size="sm" icon={<X className="w-3.5 h-3.5" />} onClick={() => { setParsedCsv(null); setValidationIssues([]); setFileName(''); }}>Clear</Button>
                </div>

                {validationIssues.length > 0 && (
                  <div className="rounded-lg border border-midnight-700/40 bg-midnight-800/20 p-3">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-xs font-semibold text-midnight-200">Validation Results</p>
                      {errorCount > 0 && <Badge variant="danger" size="sm">{errorCount} errors</Badge>}
                      {warningCount > 0 && <Badge variant="warning" size="sm">{warningCount} warnings</Badge>}
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {validationIssues.slice(0, 20).map((issue, i) => (
                        <div key={i} className={`flex items-start gap-2 text-xs ${issue.severity === 'error' ? 'text-danger' : 'text-warning'}`}>
                          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" /><span>Row {issue.row}, {issue.field}: {issue.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {importSummary && (
                  <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 p-3 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" /><p className="text-xs text-midnight-200">{importSummary}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Data Overview" icon={<Database className="w-4 h-4" />} />
        <CardBody>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-midnight-700/40 bg-midnight-800/30 p-3 text-center"><p className="text-xs text-midnight-400">Total</p><p className="text-2xl font-bold text-midnight-100">{students.length}</p></div>
            <div className="rounded-lg border border-midnight-700/40 bg-midnight-800/30 p-3 text-center"><p className="text-xs text-midnight-400">Synthetic</p><p className="text-2xl font-bold text-info">{students.filter((s) => s.isSynthetic).length}</p></div>
            <div className="rounded-lg border border-midnight-700/40 bg-midnight-800/30 p-3 text-center"><p className="text-xs text-midnight-400">Imported</p><p className="text-2xl font-bold text-teal-400">{students.filter((s) => !s.isSynthetic).length}</p></div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-midnight-400">Reset all data to fresh synthetic demo records</p>
            <Button variant="danger" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={handleReset}>Reset Demo Data</Button>
          </div>
        </CardBody>
      </Card>

      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Confirm Import" size="sm"
        footer={<><Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button><Button variant="primary" onClick={handleImport} disabled={errorCount > 0}>Confirm Import</Button></>}>
        <p className="text-sm text-midnight-200">Import <span className="font-semibold">{fileName}</span> as <span className="font-semibold">{category}</span>?</p>
        <div className="mt-3 rounded-lg border border-midnight-700/40 bg-midnight-800/30 p-3 text-xs space-y-1">
          <div className="flex justify-between"><span className="text-midnight-400">Rows</span><span className="text-midnight-200">{parsedCsv?.rows.length || 0}</span></div>
          <div className="flex justify-between"><span className="text-midnight-400">Errors</span><span className={errorCount > 0 ? 'text-danger' : 'text-teal-400'}>{errorCount}</span></div>
        </div>
        {errorCount > 0 ? <p className="mt-2 text-xs text-danger">Fix errors before importing.</p> : <p className="mt-2 text-xs text-midnight-300">Records merge by student ID. New students are added; existing records updated.</p>}
      </Modal>
    </div>
  );
}
