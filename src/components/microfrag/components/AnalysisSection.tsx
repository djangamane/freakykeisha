
import React from 'react';
import { AnalysisResult } from '../types.ts';
import ScoreDonut from './ScoreDonut.tsx';
import Loader from './Loader.tsx';

interface AnalysisSectionProps {
  analysisResult: AnalysisResult | null;
  isLoading: boolean;
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ analysisResult, isLoading }) => {
  if (isLoading) {
    return <Loader />;
  }

  if (!analysisResult) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px] text-center">
        <div className="w-20 h-20 bg-black/70 rounded-full flex items-center justify-center mb-6 border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
          <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-cyan-400 mb-2 font-mono">Ready to Analyze</h3>
        <p className="text-cyan-300/70 font-mono">Enter an article and click "RUN ANALYSIS" to get started.</p>
      </div>
    );
  }

  const { score, detected_terms, analysis_summary } = analysisResult;

  return (
    <div className="p-6 space-y-6">
      <div className="bg-black/70 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
        <ScoreDonut score={score} />
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-2xl font-bold text-cyan-400 font-mono">Analysis Complete</h3>
          <p className="text-cyan-300/70 mt-1 font-mono">The AI agent has identified several areas of concern based on the provided framework.</p>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-green-400 mb-3 font-mono">Detected Euphemisms</h4>
        {detected_terms.length > 0 ? (
          <div className="space-y-3">
            {detected_terms.map((item, index) => (
              <div key={index} className="bg-black/70 p-4 rounded-lg border border-green-500/30 shadow-sm shadow-green-500/10">
                <p className="font-bold text-green-300 text-md font-mono">"{item.term}"</p>
                <p className="text-green-300/70 text-sm mt-1 font-mono">{item.explanation}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-green-300/50 font-mono">No specific euphemisms from the list were detected.</p>
        )}
      </div>

      <div>
        <h4 className="text-lg font-semibold text-cyan-400 mb-3 font-mono">Analyst Summary</h4>
        <div className="bg-black/70 p-4 rounded-lg border border-cyan-500/30 shadow-sm shadow-cyan-500/10">
          <p className="text-cyan-300/90 whitespace-pre-wrap leading-relaxed font-mono">{analysis_summary}</p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisSection;
