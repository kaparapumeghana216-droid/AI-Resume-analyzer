export interface AnalysisResult {
  skills: string[];
  strengths: string[];
  skillsToImprove: string[];
  suggestions: string[];
  workflowLog?: { phase: string; finding: string }[];
  summary?: string;
  isFallback?: boolean;
}
