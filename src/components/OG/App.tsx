
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import AnalysisSection from './components/AnalysisSection';
import { analyzeArticle, translateArticle } from './services/geminiService';
import { AnalysisResult } from './types';

const App: React.FC = () => {
  const [articleText, setArticleText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'original' | 'translated'>('original');

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
      // Run both calls in parallel for efficiency
      const [analysis, translation] = await Promise.all([
        analyzeArticle(articleText),
        translateArticle(articleText)
      ]);
      
      setAnalysisResult(analysis);
      setTranslatedText(translation);

    } catch (err: any) {
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
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Input and Output Text */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg flex flex-col">
              <div className="p-4 border-b border-gray-700">
                  <h2 className="text-xl font-bold text-white">Article Content</h2>
                  <p className="text-sm text-gray-400">Paste the article you want to analyze and get the Keisha Translation for.</p>
              </div>
              <div className="flex-grow p-4 flex flex-col">
                {translatedText ? (
                    <div className="border-b border-gray-600 mb-4">
                        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('original')}
                                className={`${activeTab === 'original' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition`}
                            >
                                Original Text
                            </button>
                            <button
                                onClick={() => setActiveTab('translated')}
                                className={`${activeTab === 'translated' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition`}
                            >
                                Keisha Translation
                            </button>
                        </nav>
                    </div>
                ) : null }

                <div className="flex-grow">
                    {activeTab === 'original' && (
                         <textarea
                            value={articleText}
                            onChange={(e) => setArticleText(e.target.value)}
                            placeholder={placeholderText}
                            className="w-full h-full min-h-[300px] bg-gray-900 text-gray-200 p-4 rounded-md border border-gray-600 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 resize-none"
                            disabled={isLoading}
                        />
                    )}
                    {activeTab === 'translated' && (
                        <div className="w-full h-full min-h-[300px] bg-gray-900 text-gray-200 p-4 rounded-md border border-gray-600 overflow-y-auto">
                            <p className="whitespace-pre-wrap leading-relaxed">{translatedText}</p>
                        </div>
                    )}
                </div>
              </div>
              <div className="p-4 border-t border-gray-700">
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading || !articleText}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                    {isLoading ? 'Analyzing...' : 'Run Analysis'}
                </button>
              </div>
          </div>

          {/* Right Column: Analysis */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">AI Agent Analysis</h2>
                <p className="text-sm text-gray-400">Results from the bias detection agent.</p>
            </div>
            <div className="overflow-y-auto" style={{maxHeight: 'calc(100vh - 200px)'}}>
                <AnalysisSection analysisResult={analysisResult} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
