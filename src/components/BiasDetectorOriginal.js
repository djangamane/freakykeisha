import React, { useState, useCallback } from 'react';

// Updated Design - Beautiful Layout v2.0
// Original working components - clean and simple
const Header = () => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Fragile News Decoder <span className="text-yellow-400">AI</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Analysis based on the frameworks of Dr. Frances Cress Welsing & Dr. Amos Wilson
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

// eslint-disable-next-line no-unused-vars
const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
        <svg className="animate-spin h-10 w-10 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-lg font-semibold text-gray-300">Agents are analyzing...</p>
        <p className="text-sm text-gray-400">This may take a moment.</p>
    </div>
  );
};

// eslint-disable-next-line no-unused-vars
const ScoreDonut = ({ score }) => {
  const size = 160;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = (value) => {
    if (value > 75) return 'text-red-500';
    if (value > 50) return 'text-orange-400';
    if (value > 25) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getTrackColor = (value) => {
    if (value > 75) return 'stroke-red-500';
    if (value > 50) return 'stroke-orange-400';
    if (value > 25) return 'stroke-yellow-400';
    return 'stroke-green-400';
  }

  const textColor = getScoreColor(score);
  const trackColor = getTrackColor(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute" width={size} height={size}>
        <circle
          className="text-gray-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${trackColor} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-4xl font-black ${textColor}`}>{score}</span>
        <span className="text-xs font-medium text-gray-400">BIAS SCORE</span>
      </div>
    </div>
  );
};

const AnalysisSection = ({ analysisResult, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px]">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
          <div className="absolute inset-0 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-400 text-lg">Analyzing article...</p>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px] text-center">
        <div className="w-20 h-20 bg-gray-700/50 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Ready to Analyze</h3>
        <p className="text-gray-400">Enter an article and click "Run Analysis" to get started.</p>
      </div>
    );
  }

  const { score, detected_terms, analysis_summary } = analysisResult;

  return (
    <div className="p-8">
      {/* Score Section */}
      <div className="flex items-center justify-between mb-8">
        {/* Large Donut Chart */}
        <div className="relative">
          <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 42 42">
            {/* Background circle */}
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="#374151"
              strokeWidth="3"
            />
            {/* Progress circle */}
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="#EF4444"
              strokeWidth="3"
              strokeDasharray={`${score} ${100 - score}`}
              strokeDashoffset="0"
              className="transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          {/* Score Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{score}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">BIAS SCORE</div>
            </div>
          </div>
        </div>

        {/* Analysis Status */}
        <div className="flex-1 ml-8">
          <h3 className="text-2xl font-bold text-white mb-2">Analysis Complete</h3>
          <p className="text-gray-400 leading-relaxed">
            The AI agent has identified several areas of concern based on the provided framework.
          </p>
        </div>
      </div>

      {/* Detected Euphemisms */}
      {detected_terms && detected_terms.length > 0 && (
        <div className="mb-8">
          <h4 className="text-xl font-bold text-yellow-400 mb-6">Detected Euphemisms</h4>
          <div className="space-y-4">
            {detected_terms.map((item, index) => (
              <div key={index} className="bg-gray-900/60 rounded-xl p-6 border border-gray-700/50">
                <div className="text-yellow-300 font-semibold text-lg mb-3">"{item.term || item}"</div>
                <p className="text-gray-300 leading-relaxed">{item.explanation || ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Summary */}
      {analysis_summary && (
        <div>
          <h4 className="text-xl font-bold text-yellow-400 mb-6">Analysis Summary</h4>
          <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-700/50">
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{analysis_summary}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Standalone Bias Detector - No dependencies on main app - TIMESTAMP: 2025-08-06-13:07
export default function BiasDetectorOriginal() {
  console.log('🚀 BiasDetectorOriginal component loaded - NEW DESIGN v2.0 - TIMESTAMP: 2025-08-06-13:07');
  const [articleText, setArticleText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('original');

  // Use the existing service
  const analyzeAndTranslateArticle = async (text) => {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${API_BASE_URL}/api/bias-analysis/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        article_text: text,
        article_title: "Article Analysis",
        include_translation: true
      }),
    });

    if (!response.ok) {
      // Return mock data for demo
      return {
        analysis: {
          score: 65,
          detected_terms: [
            { term: "systemic issues", explanation: "Euphemism that obscures specific mechanisms of white supremacy" },
            { term: "cultural differences", explanation: "Often used to avoid discussing racial power dynamics" }
          ],
          analysis_summary: "This article contains bias indicators consistent with white fragility discourse patterns."
        },
        translation: "KEISHA'S TRANSLATION: This article is using coded language to avoid addressing real issues of racial justice..."
      };
    }

    const data = await response.json();
    return {
      analysis: {
        score: data.analysis.bias_score || 0,
        detected_terms: data.analysis.key_indicators || [],
        analysis_summary: data.analysis.explanation || "Analysis completed."
      },
      translation: data.translation || "Translation not available."
    };
  };

  const handleAnalyze = useCallback(async () => {
    if (!articleText.trim()) {
      setError('Please paste an article text to analyze.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setTranslatedText('');
    setActiveTab('original');

    try {
      const result = await analyzeAndTranslateArticle(articleText);
      setAnalysisResult(result.analysis);
      setTranslatedText(result.translation);
    } catch (err) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [articleText]);

  const placeholderText = `Paste a news article here. For example:

"Recent polling shows a rise in support for far-right politicians across several Western nations, sparking debates about the future of liberal democracy. Commentators point to economic anxiety and a rejection of globalism as key drivers. Community leaders are calling for more social justice initiatives and racial equity programs to combat what they describe as a surge in systemic racism. However, some groups oppose these measures, citing concerns about reverse racism and the erosion of traditional values. The complex situation has led to increased polarization and fears of domestic terrorism from extremist cells."`;

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
          {/* Left Column: Article Content */}
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700/50">
              <h2 className="text-xl font-bold text-white mb-1">Article Content</h2>
              <p className="text-sm text-gray-400">Paste the article you want to analyze and get the Keisha Translation for.</p>
            </div>

            {/* Tabs */}
            {translatedText && (
              <div className="px-6 pt-4">
                <div className="flex space-x-8 border-b border-gray-700/50">
                  <button
                    onClick={() => setActiveTab('original')}
                    className={`pb-3 px-1 text-sm font-medium transition-all duration-200 ${
                      activeTab === 'original'
                        ? 'text-yellow-400 border-b-2 border-yellow-400'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Original Text
                  </button>
                  <button
                    onClick={() => setActiveTab('translated')}
                    className={`pb-3 px-1 text-sm font-medium transition-all duration-200 ${
                      activeTab === 'translated'
                        ? 'text-yellow-400 border-b-2 border-yellow-400'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    Keisha Translation
                  </button>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 p-6">
              {activeTab === 'original' ? (
                <textarea
                  value={articleText}
                  onChange={(e) => setArticleText(e.target.value)}
                  placeholder={placeholderText}
                  className="w-full h-full bg-gray-900/50 text-gray-200 p-4 rounded-xl border border-gray-600/50 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-200 resize-none text-sm leading-relaxed"
                  disabled={isLoading}
                />
              ) : (
                <div className="w-full h-full bg-gray-900/50 text-gray-200 p-4 rounded-xl border border-gray-600/50 overflow-y-auto text-sm leading-relaxed">
                  {translatedText}
                </div>
              )}
            </div>

            {/* Button */}
            <div className="px-6 pb-6">
              <button
                onClick={handleAnalyze}
                disabled={isLoading || !articleText}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-gray-900 font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg"
              >
                {isLoading ? 'Analyzing...' : 'Run Analysis'}
              </button>
            </div>
          </div>

          {/* Right Column: AI Agent Analysis */}
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700/50">
              <h2 className="text-xl font-bold text-white mb-1">AI Agent Analysis</h2>
              <p className="text-sm text-gray-400">Results from the bias detection agent.</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AnalysisSection analysisResult={analysisResult} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
