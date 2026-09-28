import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Award,
  TrendingUp,
  Cpu,
  ArrowDown,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
  Zap,
  GraduationCap,
  Target,
  Layers,
  ChevronRight
} from 'lucide-react';
import { SAMPLE_RESUMES } from './sampleResumes';

interface AnalysisResult {
  skills: string[];
  strengths: string[];
  skillsToImprove: string[];
  suggestions: string[];
  workflowLog?: { phase: string; finding: string }[];
  summary?: string;
}

const WORKFLOW_STEPS = [
  {
    id: 'resume',
    name: 'Resume',
    desc: 'Input parsed & verified',
    color: 'from-blue-500 to-indigo-500',
    lightBg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
  },
  {
    id: 'skills',
    name: 'Extract Skills',
    desc: 'Scan technical proficiencies',
    color: 'from-indigo-500 to-cyan-500',
    lightBg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
  },
  {
    id: 'strengths',
    name: 'Identify Strengths',
    desc: 'Assess impact & highlights',
    color: 'from-emerald-500 to-teal-500',
    lightBg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
  },
  {
    id: 'improve',
    name: 'Find Skills to Improve',
    desc: 'Identify competency gaps',
    color: 'from-amber-500 to-orange-500',
    lightBg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
  },
  {
    id: 'suggestions',
    name: 'Generate Suggestions',
    desc: 'Formulate actionable advice',
    color: 'from-purple-500 to-pink-500',
    lightBg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
  },
  {
    id: 'result',
    name: 'Final Result',
    desc: 'Compile student report',
    color: 'from-violet-600 to-indigo-600',
    lightBg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
  },
];

export default function App() {
  const [resumeText, setResumeText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
    };
  }, []);

  const handleAnalyze = async () => {
    const trimmed = resumeText.trim();
    if (!trimmed) {
      setErrorMessage('Please paste your resume into the text box before analyzing.');
      return;
    }

    if (trimmed.length < 25) {
      setErrorMessage('Your resume text seems too short. Please paste more details (education, skills, projects, experience).');
      return;
    }

    setErrorMessage(null);
    setIsAnalyzing(true);
    setResult(null);
    setCurrentStepIndex(0);

    let step = 0;
    stepIntervalRef.current = setInterval(() => {
      step++;
      if (step < WORKFLOW_STEPS.length - 1) {
        setCurrentStepIndex(step);
      }
    }, 700);

    try {
      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: trimmed }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const data: AnalysisResult = await response.json();

      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
      setCurrentStepIndex(WORKFLOW_STEPS.length - 1);

      setTimeout(() => {
        setResult(data);
        setIsAnalyzing(false);
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    } catch (err: any) {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
      setIsAnalyzing(false);
      setCurrentStepIndex(-1);
      setErrorMessage(err.message || 'Failed to analyze resume. Please try again.');
    }
  };

  const handleLoadSample = (index: number) => {
    setResumeText(SAMPLE_RESUMES[index].content);
    setErrorMessage(null);
    setResult(null);
    setCurrentStepIndex(-1);
  };

  const handleClear = () => {
    setResumeText('');
    setResult(null);
    setErrorMessage(null);
    setCurrentStepIndex(-1);
  };

  const handleCopyReport = () => {
    if (!result) return;
    const reportText = `AI Resume Analyzer - Results Report
--------------------------------------
${result.summary ? `Summary: ${result.summary}\n` : ''}
1. TECHNICAL SKILLS:
${result.skills.map((s) => `• ${s}`).join('\n')}

2. STRENGTHS:
${result.strengths.map((s) => `• ${s}`).join('\n')}

3. SKILLS TO IMPROVE:
${result.skillsToImprove.map((s) => `• ${s}`).join('\n')}

4. AI SUGGESTIONS:
${result.suggestions.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}
--------------------------------------`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0;
  const charCount = resumeText.length;

  return (
    <div className="min-h-screen bg-mesh-pattern bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-pink-50/30 text-slate-800 flex flex-col font-sans selection:bg-purple-200 selection:text-purple-900 relative">
      {/* Decorative ambient background glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-10 w-96 h-96 bg-pink-300/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-indigo-100/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20 ring-2 ring-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-800 via-purple-800 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                AI Resume Analyzer
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border border-indigo-200/70 shadow-xs">
                  Agentic AI
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200/60 shadow-xs">
              <Cpu className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">Powered by</span> Gemini 3
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Header / Subtitle */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-100/90 via-purple-100/90 to-pink-100/90 text-indigo-900 border border-indigo-200/80 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Interactive Student Career Assistant</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Analyze your resume and get{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI-powered suggestions.
            </span>
          </h2>
          <p className="text-slate-600 text-sm sm:text-base font-normal leading-relaxed">
            Paste your resume below to activate our multi-step AI Agent and receive instant, tailored feedback on your skills, strengths, and areas for growth.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white/90 backdrop-blur-xs rounded-2xl shadow-sm border border-indigo-100 p-5 sm:p-7 space-y-4 ring-1 ring-slate-900/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label
              htmlFor="resume-input"
              className="font-heading text-base font-bold text-slate-900 flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              Paste Your Resume
            </label>

            {/* Colorful Sample Pills */}
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                Try Sample:
              </span>
              <button
                type="button"
                onClick={() => handleLoadSample(0)}
                disabled={isAnalyzing}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 transition-all hover:shadow-xs disabled:opacity-50 cursor-pointer"
              >
                CS Sophomore
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample(1)}
                disabled={isAnalyzing}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 transition-all hover:shadow-xs disabled:opacity-50 cursor-pointer"
              >
                Data Science & AI
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample(2)}
                disabled={isAnalyzing}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-all hover:shadow-xs disabled:opacity-50 cursor-pointer"
              >
                Frontend Web
              </button>
              {resumeText && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isAnalyzing}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="relative group">
            <textarea
              id="resume-input"
              rows={11}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              disabled={isAnalyzing}
              placeholder="Paste your complete resume here (Education, Technical Skills, Projects, Experience, Leadership, Coursework)..."
              className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm leading-relaxed transition-all resize-y disabled:opacity-70 font-mono shadow-inner"
            />
          </div>

          {/* Counts & Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="text-xs font-medium text-slate-500 flex items-center gap-4">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {wordCount} words
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {charCount} characters
              </span>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !resumeText.trim()}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-heading font-bold text-sm tracking-wide shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AI Agent Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-pink-200 animate-pulse" />
                  <span>Analyze Resume</span>
                  <ChevronRight className="w-4 h-4 text-purple-200" />
                </>
              )}
            </button>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Agentic AI Workflow Diagram & Status */}
        <section className="bg-white/90 backdrop-blur-xs rounded-2xl shadow-sm border border-purple-100 p-5 sm:p-7 space-y-5 ring-1 ring-slate-900/5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900">
                  Agentic AI Workflow
                </h3>
                <p className="text-[11px] text-slate-500">Autonomous multi-stage evaluation pipeline</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              6-Phase Pipeline
            </span>
          </div>

          {/* Active Status Banner when Analyzing */}
          {isAnalyzing && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-purple-200 flex items-center justify-center gap-3 text-purple-900 animate-pulse">
              <div className="w-5 h-5 border-2 border-purple-400 border-t-purple-700 rounded-full animate-spin shrink-0" />
              <p className="font-heading font-bold text-sm sm:text-base text-purple-950">
                AI Agent is analyzing your resume...
              </p>
            </div>
          )}

          {/* Workflow Flowchart Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {WORKFLOW_STEPS.map((step, idx) => {
              const isActive = isAnalyzing && currentStepIndex === idx;
              const isCompleted = result !== null || (isAnalyzing && currentStepIndex > idx);

              const logEntry = result?.workflowLog?.find(
                (l) =>
                  l.phase.toLowerCase().includes(step.name.toLowerCase()) ||
                  step.name.toLowerCase().includes(l.phase.toLowerCase())
              );

              return (
                <div
                  key={step.id}
                  className={`relative p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isActive
                      ? 'bg-gradient-to-b from-indigo-50 to-purple-50 border-purple-400 ring-2 ring-purple-300 shadow-md shadow-purple-500/10 -translate-y-0.5'
                      : isCompleted
                      ? 'bg-white border-indigo-200/80 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200/70 text-slate-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                            : isCompleted
                            ? `bg-gradient-to-r ${step.color} text-white`
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        Step {idx + 1}
                      </span>

                      {isCompleted ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : isActive ? (
                        <div className="w-4 h-4 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </div>

                    <div className="font-heading font-bold text-xs sm:text-sm text-slate-900">
                      {step.name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {step.desc}
                    </div>

                    {isCompleted && logEntry?.finding && (
                      <div className="mt-2 text-[10px] text-purple-900 bg-purple-50 p-2 rounded-lg border border-purple-100/80 leading-relaxed font-medium">
                        {logEntry.finding}
                      </div>
                    )}
                  </div>

                  {/* Flow arrow indicators */}
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <>
                      {/* Down arrow on small screens */}
                      <div className="lg:hidden flex justify-center pt-2 text-indigo-400">
                        <ArrowDown className="w-4 h-4" />
                      </div>
                      {/* Right arrow on desktop */}
                      <div className="hidden lg:flex items-center justify-center absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-5 h-5 bg-white rounded-full shadow-xs border border-indigo-200 text-indigo-500">
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-1 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Autonomous agent pipeline designed for beginner demonstration in workshops</span>
          </div>
        </section>

        {/* Results Section */}
        {result && (
          <div ref={resultsRef} className="space-y-6 pt-2">
            {/* Results Header Card with Colorful Accent */}
            <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-5 rounded-2xl border border-purple-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <h3 className="font-heading text-xl font-extrabold text-slate-900 tracking-tight">
                    Analysis Complete
                  </h3>
                </div>
                {result.summary && (
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-2xl">
                    {result.summary}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200/80 text-xs font-bold transition-all shadow-xs hover:shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Full Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* The 4 Required Sections with Rich, Modern Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Section 1: Skills (Blue/Indigo Theme) */}
              <div className="bg-white/95 rounded-2xl shadow-sm border border-blue-200 p-5 sm:p-6 space-y-4 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />

                <div className="flex items-center justify-between border-b border-blue-50 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-xs">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-slate-900 text-lg">
                        1. Skills
                      </h4>
                      <p className="text-xs text-slate-500">
                        Technical skills found in the resume
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {result.skills?.length || 0} Found
                  </span>
                </div>

                <div className="flex-1">
                  {result.skills && result.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {result.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50/80 text-blue-800 text-xs font-semibold border border-blue-200/90 flex items-center gap-1.5 shadow-xs hover:border-blue-400 transition-colors"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No specific technical skills were detected.</p>
                  )}
                </div>
              </div>

              {/* Section 2: Strengths (Emerald/Teal Theme) */}
              <div className="bg-white/95 rounded-2xl shadow-sm border border-emerald-200 p-5 sm:p-6 space-y-4 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />

                <div className="flex items-center justify-between border-b border-emerald-50 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-slate-900 text-lg">
                        2. Strengths
                      </h4>
                      <p className="text-xs text-slate-500">
                        Strong points identified in the resume
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {result.strengths?.length || 0} Strengths
                  </span>
                </div>

                <div className="flex-1">
                  {result.strengths && result.strengths.length > 0 ? (
                    <ul className="space-y-3 pt-1">
                      {result.strengths.map((strength, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No standout strengths detected.</p>
                  )}
                </div>
              </div>

              {/* Section 3: Skills to Improve (Amber/Orange Theme) */}
              <div className="bg-white/95 rounded-2xl shadow-sm border border-amber-200 p-5 sm:p-6 space-y-4 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />

                <div className="flex items-center justify-between border-b border-amber-50 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-slate-900 text-lg">
                        3. Skills to Improve
                      </h4>
                      <p className="text-xs text-slate-500">
                        Skills that the student could improve or learn
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Growth Areas
                  </span>
                </div>

                <div className="flex-1">
                  {result.skillsToImprove && result.skillsToImprove.length > 0 ? (
                    <ul className="space-y-3 pt-1">
                      {result.skillsToImprove.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed bg-amber-50/50 p-2.5 rounded-xl border border-amber-100"
                        >
                          <span className="w-5 h-5 rounded-full bg-amber-200/90 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            ▲
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No specific improvement areas noted.</p>
                  )}
                </div>
              </div>

              {/* Section 4: AI Suggestions (Violet/Purple Theme) */}
              <div className="bg-white/95 rounded-2xl shadow-sm border border-purple-200 p-5 sm:p-6 space-y-4 flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />

                <div className="flex items-center justify-between border-b border-purple-50 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-xs">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-slate-900 text-lg">
                        4. AI Suggestions
                      </h4>
                      <p className="text-xs text-slate-500">
                        3–5 simple suggestions to improve the resume
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    High Impact
                  </span>
                </div>

                <div className="flex-1">
                  {result.suggestions && result.suggestions.length > 0 ? (
                    <ul className="space-y-3 pt-1">
                      {result.suggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 leading-relaxed bg-purple-50/60 p-3 rounded-xl border border-purple-100"
                        >
                          <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-600 text-white font-heading font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                            {index + 1}
                          </span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No suggestions generated.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Clean, Colorful Footer */}
      <footer className="border-t border-indigo-100 bg-white/80 backdrop-blur-xs py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <strong className="font-heading font-semibold text-slate-800">
              AI Resume Analyzer
            </strong>{' '}
            — Student-friendly Agentic AI demonstration.
          </p>
          <p className="text-slate-400">
            Powered by Google AI Studio Gemini API & Express
          </p>
        </div>
      </footer>
    </div>
  );
}
