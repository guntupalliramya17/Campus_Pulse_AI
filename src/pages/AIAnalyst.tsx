import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/AppStore';
import { Card, CardBody } from '@/components/ui/Card';
import { StudentProfile } from '@/components/StudentProfile';
import type { StudentRecord, ChatMessage } from '@/types';
import { generateId, formatScore } from '@/utils/format';
import {
  aggregateDepartmentPerformance, aggregateRiskDistribution,
  getEmergingRisks,
} from '@/utils/analytics';
import {
  MessageSquare, Send, Sparkles, Info,
} from 'lucide-react';

interface QueryResult {
  answer: string;
  evidence?: {
    count?: number;
    studentIds?: string[];
    chartData?: { label: string; value: number }[];
  };
  relatedStudents?: StudentRecord[];
}

const SUGGESTED_QUESTIONS = [
  'Which department has the highest concentration of academic risk?',
  'Which students have good CGPA but poor placement readiness?',
  'What are the strongest contributors to placement-readiness gaps?',
  'Which interventions fit the available faculty capacity?',
  'Which imported fields have missing data?',
  'What is the overall risk distribution?',
  'Which students have declining attendance trends?',
  'What are the emerging risk signals?',
];

export function AIAnalyst() {
  const { students, analyticsMap, config, recommendations } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: generateId('msg-'),
      role: 'analyst',
      content: 'Hello! I am the Campus Pulse AI Analyst. I can answer questions about student performance, risk patterns, and intervention recommendations using the analytics engine. Try one of the suggested questions below, or type your own.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [lastRelatedStudents, setLastRelatedStudents] = useState<StudentRecord[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const processQuery = (query: string): QueryResult => {
    const q = query.toLowerCase().trim();

    if (q.includes('department') && (q.includes('risk') || q.includes('concentration') || q.includes('highest'))) {
      const deptPerf = aggregateDepartmentPerformance(students, analyticsMap);
      const sorted = [...deptPerf].sort((a, b) => b.atRisk - a.atRisk);
      const top = sorted[0];
      if (!top || top.atRisk === 0) return { answer: 'No departments currently have at-risk students. All departments are performing within safe thresholds.' };
      return {
        answer: `${top.department} has the highest concentration of academic risk with ${top.atRisk} at-risk students out of ${top.count} total (${Math.round((top.atRisk / top.count) * 100)}%). Average success score: ${top.avgSuccess}. Average placement readiness: ${top.avgPlacement}.`,
        evidence: { count: top.atRisk, chartData: sorted.slice(0, 6).map((d) => ({ label: d.department.slice(0, 15), value: d.atRisk })) },
      };
    }

    if ((q.includes('cgpa') || q.includes('good academics') || q.includes('strong academics')) && (q.includes('placement') || q.includes('readiness'))) {
      const matching = students.filter((s) => analyticsMap.get(s.id)?.strongAcademicsLowPlacement);
      return {
        answer: `${matching.length} students have good CGPA (>=7.5) but poor placement readiness (<60). These students are academically strong but need focused placement preparation.`,
        evidence: { count: matching.length, studentIds: matching.map((s) => s.id) },
        relatedStudents: matching.slice(0, 10),
      };
    }

    if (q.includes('contributor') && q.includes('placement')) {
      const gapCounts: Record<string, number> = {};
      for (const s of students) {
        const a = analyticsMap.get(s.id);
        if (!a || a.placementReadiness.total == null || a.placementReadiness.total >= 70) continue;
        for (const c of a.placementReadiness.components) {
          if (!c.isMissing && c.rawValue < 60) gapCounts[c.label] = (gapCounts[c.label] || 0) + 1;
        }
      }
      const sorted = Object.entries(gapCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length === 0) return { answer: 'No significant placement readiness gaps detected across the student population.' };
      const top3 = sorted.slice(0, 3).map(([label, count]) => `${label} (${count} students below threshold)`).join(', ');
      return { answer: `The strongest contributors to placement-readiness gaps are: ${top3}. These areas should be prioritized in placement preparation programs.`, evidence: { chartData: sorted.map(([label, count]) => ({ label, value: count })) } };
    }

    if (q.includes('intervention') && (q.includes('capacity') || q.includes('faculty') || q.includes('fit') || q.includes('budget'))) {
      const recs = recommendations;
      const totalHours = recs.reduce((s, r) => s + r.estimatedHours, 0);
      return { answer: `${recs.length} interventions fit within the current faculty capacity of ${config.defaultFacultyHours} hours, using ${totalHours} hours total. The top 3 priorities are: ${recs.slice(0, 3).map((r) => `${r.type.replace(/-/g, ' ')} for ${r.studentId}`).join(', ')}.`, evidence: { count: recs.length } };
    }

    if (q.includes('missing') || q.includes('incomplete') || q.includes('data quality') || q.includes('fields')) {
      const missingCounts: Record<string, number> = {};
      for (const s of students) {
        if (s.aptitudeScore == null) missingCounts['Aptitude Score'] = (missingCounts['Aptitude Score'] || 0) + 1;
        if (s.codingScore == null) missingCounts['Coding Score'] = (missingCounts['Coding Score'] || 0) + 1;
        if (s.mockInterviewScore == null) missingCounts['Mock Interview'] = (missingCounts['Mock Interview'] || 0) + 1;
        if (s.technicalSkillRating == null) missingCounts['Technical Skill'] = (missingCounts['Technical Skill'] || 0) + 1;
        if (s.communicationSkillRating == null) missingCounts['Communication'] = (missingCounts['Communication'] || 0) + 1;
      }
      const sorted = Object.entries(missingCounts).sort((a, b) => b[1] - a[1]);
      if (sorted.length === 0) return { answer: 'All placement data fields are fully populated across all students.' };
      const topGaps = sorted.map(([field, count]) => `${field}: ${count} students (${Math.round((count / students.length) * 100)}%)`).join('; ');
      return { answer: `The following fields have missing data: ${topGaps}. Collecting this data will enable more accurate risk assessment.`, evidence: { chartData: sorted.map(([label, count]) => ({ label, value: count })) } };
    }

    if (q.includes('risk distribution') || q.includes('overall risk') || q.includes('risk breakdown')) {
      const dist = aggregateRiskDistribution(students, analyticsMap);
      const breakdown = dist.map((d) => `${d.category.replace(/-/g, ' ')}: ${d.count}`).join(', ');
      return { answer: `The overall risk distribution across ${students.length} students is: ${breakdown}.`, evidence: { chartData: dist.map((d) => ({ label: d.category.replace(/-/g, ' '), value: d.count })) } };
    }

    if (q.includes('declining') && q.includes('attendance')) {
      const matching = students.filter((s) => analyticsMap.get(s.id)?.decliningAttendance);
      return { answer: `${matching.length} students show a declining attendance trend over recent semesters (drop of more than 10 percentage points). These students should be prioritized for attendance mentoring.`, evidence: { count: matching.length, studentIds: matching.map((s) => s.id) }, relatedStudents: matching.slice(0, 10) };
    }

    if (q.includes('emerging') || q.includes('early warning') || q.includes('signals')) {
      const signals = getEmergingRisks(students, analyticsMap);
      const summary = signals.map((s) => `${s.signal}: ${s.count} students`).join('; ');
      return { answer: `The emerging risk signals are: ${summary}. These are early warning indicators that warrant proactive intervention.`, evidence: { chartData: signals.map((s) => ({ label: s.signal.slice(0, 25), value: s.count })) } };
    }

    if (q.includes('average') && (q.includes('success') || q.includes('score'))) {
      const totalSuccess = students.reduce((sum, s) => sum + (analyticsMap.get(s.id)?.successScore.total ?? 0), 0);
      const avg = students.length > 0 ? Math.round((totalSuccess / students.length) * 10) / 10 : 0;
      return { answer: `The average Student Success Score across all ${students.length} students is ${avg} out of 100.` };
    }

    if (q.includes('average') && q.includes('placement')) {
      const withPlacement = students.filter((s) => analyticsMap.get(s.id)?.placementReadiness.total != null);
      const total = withPlacement.reduce((sum, s) => sum + (analyticsMap.get(s.id)?.placementReadiness.total ?? 0), 0);
      const avg = withPlacement.length > 0 ? Math.round((total / withPlacement.length) * 10) / 10 : 0;
      return { answer: `The average Placement Readiness Score is ${avg} out of 100, based on ${withPlacement.length} students with complete placement data. ${students.length - withPlacement.length} students lack sufficient placement data.` };
    }

    return { answer: `I can't answer that specific question. I'm a rule-based analyst, not a live AI model. Try asking about: department risk concentrations, students with placement gaps, contributors to readiness gaps, interventions within faculty capacity, missing data fields, risk distribution, declining attendance, or emerging risk signals. Click a suggested question below for examples.` };
  };

  const handleSend = (text?: string) => {
    const query = text || input.trim();
    if (!query) return;

    const userMsg: ChatMessage = { id: generateId('msg-'), role: 'user', content: query, timestamp: new Date().toISOString() };
    const result = processQuery(query);
    const analystMsg: ChatMessage = { id: generateId('msg-'), role: 'analyst', content: result.answer, evidence: result.evidence, timestamp: new Date().toISOString() };

    setMessages((prev) => [...prev, userMsg, analystMsg]);
    setLastRelatedStudents(result.relatedStudents || []);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-midnight-50">AI Campus Analyst</h1>
        <p className="text-sm text-midnight-400 mt-0.5">Ask questions about student analytics — answered by a local rule-based query engine</p>
      </div>

      <div className="rounded-lg border border-info/20 bg-info/5 px-4 py-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
        <p className="text-xs text-midnight-300">
          <span className="font-medium text-info">Local rule-based engine:</span> This analyst uses deterministic rules applied to real application data. It does not call an external AI model. It cannot execute arbitrary SQL or code from user input.
        </p>
      </div>

      <Card className="flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[350px] max-h-[450px]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-4 py-3 ${msg.role === 'user' ? 'bg-teal-500/15 border border-teal-500/30 text-midnight-100' : 'bg-midnight-800/50 border border-midnight-700/50 text-midnight-200'}`}>
                {msg.role === 'analyst' && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3 h-3 text-teal-400" />
                    <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-wide">Analyst</span>
                  </div>
                )}
                <p className="text-sm">{msg.content}</p>
                {msg.evidence?.chartData && msg.evidence.chartData.length > 0 && (
                  <div className="mt-3 rounded-md bg-midnight-900/40 p-2 space-y-1">
                    <p className="text-[10px] text-midnight-400 font-medium uppercase mb-1">Supporting Data</p>
                    {msg.evidence.chartData.slice(0, 6).map((d, i) => {
                      const maxVal = Math.max(...msg.evidence!.chartData!.map((c) => c.value), 1);
                      return (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-midnight-300">{d.label}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-midnight-700 overflow-hidden">
                              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(100, (d.value / maxVal) * 100)}%` }} />
                            </div>
                            <span className="text-midnight-200 font-medium w-8 text-right">{d.value}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {msg.evidence?.studentIds && msg.evidence.studentIds.length > 0 && (
                  <p className="mt-2 text-[10px] text-midnight-400">Matching students: {msg.evidence.studentIds.slice(0, 5).join(', ')}{msg.evidence.studentIds.length > 5 ? ` and ${msg.evidence.studentIds.length - 5} more` : ''}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="border-t border-midnight-700/50 p-3">
          <div className="flex items-center gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask a question about student analytics..." className="flex-1 rounded-lg border border-midnight-700 bg-midnight-800/60 px-3 py-2.5 text-sm text-midnight-100 outline-none transition-colors focus:border-teal-500 placeholder:text-midnight-500" />
            <button onClick={() => handleSend()} disabled={!input.trim()} className="rounded-lg bg-teal-500 p-2.5 text-midnight-950 transition-colors hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Related students from last query */}
      {lastRelatedStudents.length > 0 && (
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-midnight-300 mb-3">Related Students ({lastRelatedStudents.length})</p>
            <div className="flex flex-wrap gap-2">
              {lastRelatedStudents.map((s) => {
                const a = analyticsMap.get(s.id);
                return (
                  <button key={s.id} onClick={() => setSelectedStudent(s)} className="flex items-center gap-2 rounded-lg border border-midnight-700/40 bg-midnight-800/30 px-3 py-1.5 text-xs transition-colors hover:border-teal-500/30 hover:bg-teal-500/5">
                    <span className="text-midnight-100">{s.name}</span>
                    <span className="text-midnight-400">{s.id}</span>
                    {a && <span className={`font-bold ${a.successScore.total >= 75 ? 'text-teal-400' : a.successScore.total >= 60 ? 'text-warning' : 'text-danger'}`}>{formatScore(a.successScore.total)}</span>}
                  </button>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Suggested questions */}
      <Card>
        <CardBody>
          <p className="text-xs font-semibold text-midnight-300 mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
            Suggested Questions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button key={i} onClick={() => handleSend(q)} className="flex items-center gap-2 rounded-lg border border-midnight-700/40 bg-midnight-800/20 px-3 py-2 text-left text-xs text-midnight-300 transition-all hover:border-teal-500/30 hover:bg-teal-500/5 hover:text-midnight-100">
                <Sparkles className="w-3 h-3 text-violet-400 shrink-0" />
                {q}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <StudentProfile student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  );
}
