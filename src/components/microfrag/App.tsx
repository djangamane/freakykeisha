
import React, { useState, useCallback } from 'react';
import Header from './components/Header.tsx';
import AnalysisSection from './components/AnalysisSection.tsx';

// analyzeAndTranslateArticle now called via useUsageEnforcement hook
import { AnalysisResult } from './types.ts';
import BiasAuthGuard from '../BiasAuthGuard.js';
import PaywallModal from '../PaywallModal.js';
import { useUsageEnforcement } from '../../hooks/useUsageEnforcement.js';

const App: React.FC = () => {
  const [articleText, setArticleText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'original' | 'translated'>('original');

  // Use usage enforcement hook
  const {
    showPaywall,
    isAnalyzing,
    executeRealAnalysis,
    handlePaywallClose,
    handlePaywallUpgrade
  } = useUsageEnforcement();

  const handleAnalyze = useCallback(async () => {
    if (!articleText.trim()) {
      setError('Please paste an article text to analyze.');
      return;
    }

    setError(null);
    setAnalysisResult(null);
    setTranslatedText('');
    setActiveTab('original');

    try {
      // Use usage-enforced analysis instead of direct API call
      const result = await executeRealAnalysis(articleText);

      console.log('App.tsx: Received result from executeRealAnalysis:', result);
      console.log('App.tsx: result.success:', result.success);
      console.log('App.tsx: result.analysis:', result.analysis);
      console.log('App.tsx: result.translation:', result.translation);

      if (result.success) {
        console.log('App.tsx: Setting analysis result:', result.analysis);
        console.log('App.tsx: Setting translated text:', result.translation);
        setAnalysisResult(result.analysis);
        setTranslatedText(result.translation);
        console.log('App.tsx: State should be updated now');
      } else {
        // Don't show error if paywall should be shown
        if (!result.showPaywall) {
          setError(result.error || 'Analysis failed');
        }
      }

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    }
  }, [articleText, executeRealAnalysis]);

  const placeholderText = `Paste a news article here. For example:

"Recent polling shows a rise in support for far-right politicians across several Western nations, sparking debates about the future of liberal democracy. Commentators point to economic anxiety and a rejection of globalism as key drivers. Community leaders are calling for more social justice initiatives and racial equity programs to combat what they describe as a surge in systemic racism. However, some groups oppose these measures, citing concerns about reverse racism and the erosion of traditional values. The complex situation has led to increased polarization and fears of domestic terrorism from extremist cells."`;

  // Debug current state values
  console.log('App.tsx RENDER: Current analysisResult state:', analysisResult);
  console.log('App.tsx RENDER: Current translatedText state:', translatedText);
  console.log('App.tsx RENDER: Current isAnalyzing state:', isAnalyzing);
  console.log('App.tsx RENDER: Current error state:', error);

  return (
    <>
      <BiasAuthGuard>
        <div className="min-h-screen bg-black relative overflow-hidden">
          {/* Matrix Video Background */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-20 z-0"
          >
            <source src="/matrix.mp4" type="video/mp4" />
          </video>

          {/* Content Overlay */}
          <div className="relative z-10">
            <Header />
          <main className="max-w-7xl mx-auto px-6 py-8">
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">

          {/* Left Column: Input and Output Text */}
          <div className="bg-black/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-green-500/30 shadow-green-500/20 flex flex-col overflow-hidden hover:border-green-400/50 transition-all duration-300">
              <div className="px-6 py-4 border-b border-green-500/30 bg-black/50">
                  <h2 className="text-xl font-bold text-green-400 mb-1 font-mono">Article Content</h2>
                  <p className="text-sm text-green-300/70 font-mono">Paste the article you want to analyze and get the Keisha Translation for.</p>
              </div>
              <div className="flex-1 p-6 flex flex-col min-h-0">
                {translatedText ? (
                    <div className="border-b border-green-500/30 mb-4 flex-shrink-0">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('original')}
                                className={`${activeTab === 'original' ? 'text-green-400 border-b-2 border-green-400 shadow-sm shadow-green-400/50' : 'text-green-300/70 hover:text-green-300'} whitespace-nowrap py-3 px-1 font-medium text-sm font-mono transition-all duration-200`}
                            >
                                Original Text
                            </button>
                            <button
                                onClick={() => setActiveTab('translated')}
                                className={`${activeTab === 'translated' ? 'text-cyan-400 border-b-2 border-cyan-400 shadow-sm shadow-cyan-400/50' : 'text-green-300/70 hover:text-green-300'} whitespace-nowrap py-3 px-1 font-medium text-sm font-mono transition-all duration-200`}
                            >
                                Keisha Translation
                            </button>
                        </nav>
                    </div>
                ) : null }

                <div className="flex-1 min-h-0">
                    {activeTab === 'original' && (
                         <textarea
                            value={articleText}
                            onChange={(e) => setArticleText(e.target.value)}
                            placeholder={placeholderText}
                            className="w-full h-full bg-black/70 text-green-300 p-4 rounded-xl border border-green-500/30 focus:ring-2 focus:ring-green-400/50 focus:border-green-400/70 transition-all duration-200 resize-none text-sm leading-relaxed font-mono placeholder-green-500/50 shadow-inner shadow-green-500/10"
                            disabled={isAnalyzing}
                        />
                    )}
                    {activeTab === 'translated' && (
                        <div className="w-full h-full bg-black/70 text-cyan-300 p-4 rounded-xl border border-cyan-500/30 overflow-y-auto text-sm leading-relaxed font-mono shadow-inner shadow-cyan-500/10">
                            <p className="whitespace-pre-wrap leading-relaxed">{translatedText}</p>
                        </div>
                    )}
                </div>
              </div>
              <div className="px-6 pb-6 flex-shrink-0">
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !articleText}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 disabled:from-gray-800 disabled:to-gray-900 disabled:cursor-not-allowed text-black font-bold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-green-500/30 hover:shadow-green-400/40 font-mono border border-green-400/50 hover:border-green-300"
                >
                    {isAnalyzing ? 'ANALYZING...' : 'RUN ANALYSIS'}
                </button>
              </div>
          </div>

          {/* Right Column: Analysis */}
          <div className="bg-black/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-cyan-500/30 shadow-cyan-500/20 flex flex-col overflow-hidden hover:border-cyan-400/50 transition-all duration-300">
            <div className="px-6 py-4 border-b border-cyan-500/30 bg-black/50">
                <h2 className="text-xl font-bold text-cyan-400 mb-1 font-mono">AI Agent Analysis</h2>
                <p className="text-sm text-cyan-300/70 font-mono">Results from the bias detection agent.</p>
            </div>
            <div className="overflow-y-auto" style={{maxHeight: 'calc(100vh - 200px)'}}>
                <AnalysisSection analysisResult={analysisResult} isLoading={isAnalyzing} />
            </div>
          </div>
        </div>
        </main>
          </div>
      </div>
      </BiasAuthGuard>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={handlePaywallClose}
        onUpgrade={handlePaywallUpgrade}
      />
    </>
  );
};

export default App;
