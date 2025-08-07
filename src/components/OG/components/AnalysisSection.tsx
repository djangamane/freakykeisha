
import React from 'react';
import { AnalysisResult } from '../types';
import ScoreDonut from './ScoreDonut';
import Loader from './Loader';

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
      <div className="flex flex-col items-center justify-center p-8 text-center h-full text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        <p className="mt-4 text-lg font-medium">Analysis will appear here.</p>
        <p className="text-sm">Paste an article and click "Analyze" to begin.</p>
      </div>
    );
  }

  const { score, detected_terms, analysis_summary } = analysisResult;

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
        <ScoreDonut score={score} />
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-2xl font-bold text-white">Analysis Complete</h3>
          <p className="text-gray-300 mt-1">The AI agent has identified several areas of concern based on the provided framework.</p>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-yellow-400 mb-3">Detected Euphemisms</h4>
        {detected_terms.length > 0 ? (
          <div className="space-y-3">
            {detected_terms.map((item, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg">
                <p className="font-bold text-white text-md">"{item.term}"</p>
                <p className="text-gray-300 text-sm mt-1">{item.explanation}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No specific euphemisms from the list were detected.</p>
        )}
      </div>

      <div>
        <h4 className="text-lg font-semibold text-yellow-400 mb-3">Analyst Summary</h4>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{analysis_summary}</p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisSection;
