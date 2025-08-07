
export interface DetectedTerm {
  term: string;
  explanation: string;
}

export interface AnalysisResult {
  score: number;
  detected_terms: DetectedTerm[];
  analysis_summary: string;
}
