import React, { useState } from 'react';
import { useBiasAuth } from '../contexts/BiasAuthContext';
import BiasAuthGuard from './BiasAuthGuard';
import UsageTracker from './UsageTracker';
import BiasAuthModal from './BiasAuthModal';
import PaywallModal from './PaywallModal';
import UsageTestPanel from './UsageTestPanel';

import { useUsageEnforcement } from '../hooks/useUsageEnforcement';
import { AnalysisLoadingState } from './LoadingState';
import NetworkError from './NetworkError';
import ErrorBoundary from './ErrorBoundary';
// import './LandingPage.css'; // Temporarily disabled to test Tailwind

const BiasDetectionApp = () => {
  const { user, logout } = useBiasAuth();
  const { 
    showPaywall, 
    isAnalyzing, 
    executeWithUsageCheck, 
    handlePaywallClose, 
    handlePaywallUpgrade,
    showPaywallModal 
  } = useUsageEnforcement();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [articleText, setArticleText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');

  const handleLogout = () => {
    if (user?.isGuest) {
      // For guest users, show the auth modal instead of logging out
      setShowAuthModal(true);
    } else {
      // For authenticated users, actually log out
      logout();
    }
  };

  const handleUpgrade = () => {
    showPaywallModal();
  };

  const handleAnalysis = async () => {
    if (!articleText.trim()) {
      setAnalysisError('Please enter an article to analyze');
      return;
    }

    setAnalysisError('');
    setAnalysisResult(null);

    // Execute analysis with usage enforcement
    const result = await executeWithUsageCheck(async () => {
      // Simulate analysis API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock analysis result
      return {
        success: true,
        data: {
          biasScore: Math.floor(Math.random() * 100),
          biasType: ['racial', 'political', 'gender'][Math.floor(Math.random() * 3)],
          confidence: Math.floor(Math.random() * 40) + 60,
          summary: 'This is a mock analysis result. The actual microfrag analysis will be integrated in the next phase.',
          keyPhrases: ['example phrase 1', 'example phrase 2', 'example phrase 3'],
          timestamp: new Date().toISOString()
        }
      };
    });

    if (result.success) {
      setAnalysisResult(result.data);
      
      // Handle post-analysis actions
      if (result.hasReachedLimit) {
        // Show a notification that they've reached their limit
        setTimeout(() => {
          showPaywallModal();
        }, 3000); // Show paywall after 3 seconds
      } else if (result.shouldPromptUpgrade) {
        // Show subtle upgrade prompt for users approaching their limit
        console.log('User approaching usage limit, consider showing upgrade hint');
      }
    } else {
      setAnalysisError(result.error || 'Analysis failed');
    }
  };

  return (
    <div className="landing-container">
      {/* Navigation Header */}
      <nav className="navigation-header">
        <div className="nav-links">
          <a href="/" className="nav-link">Home</a>
          <a href="/pricing" className="nav-link">Pricing</a>
        </div>
        
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ 
              color: 'var(--text-color)', 
              fontSize: '0.9rem',
              fontFamily: 'Orbitron, sans-serif'
            }}>
              {user.isGuest ? 'Guest User' : user.email}
            </span>
            <button 
              className="login-button"
              onClick={handleLogout}
              style={{ fontSize: '0.8rem', padding: '8px 16px' }}
            >
              {user.isGuest ? 'Sign In' : 'Logout'}
            </button>
          </div>
        )}
      </nav>

      <BiasAuthGuard requireAuth={true}>
        <div className="hero-section" style={{ paddingTop: '120px' }}>
          <div className="hero-content">
            <h1>Fragile News Decoder AI</h1>
            <p>Decode fragile news and expose white fragility patterns in mainstream media using advanced AI analysis.</p>
            
            {/* Usage Tracker */}
            <UsageTracker showUpgradeModal={handleUpgrade} />
            
            {/* Analysis Interface */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.7)',
              border: '2px solid var(--secondary-color)',
              borderRadius: '20px',
              padding: '2rem',
              marginTop: '2rem',
              maxWidth: '800px',
              margin: '2rem auto 0 auto'
            }}>
              <h3 style={{
                fontFamily: 'Orbitron, sans-serif',
                color: 'var(--accent-color)',
                textAlign: 'center',
                marginBottom: '1.5rem'
              }}>
                Article Analysis Interface
              </h3>
              
              {analysisError && (
                <div style={{
                  background: 'rgba(255, 0, 0, 0.1)',
                  border: '1px solid #ff4444',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  color: '#ff6666',
                  textAlign: 'center'
                }}>
                  {analysisError}
                </div>
              )}
              
              <textarea
                value={articleText}
                onChange={(e) => setArticleText(e.target.value)}
                placeholder="Paste your news article here for bias analysis..."
                disabled={isAnalyzing}
                style={{
                  width: '100%',
                  height: '200px',
                  padding: '1rem',
                  border: '2px solid var(--accent-color)',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  color: 'var(--text-color)',
                  fontSize: '1rem',
                  fontFamily: 'Roboto, sans-serif',
                  resize: 'vertical',
                  marginBottom: '1rem',
                  opacity: isAnalyzing ? 0.6 : 1
                }}
              />
              
              <button
                onClick={handleAnalysis}
                disabled={isAnalyzing || !articleText.trim()}
                style={{
                  background: isAnalyzing || !articleText.trim()
                    ? 'rgba(128, 128, 128, 0.5)'
                    : 'linear-gradient(135deg, var(--accent-color), #0099cc)',
                  color: 'var(--background-color)',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '25px',
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: isAnalyzing || !articleText.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  opacity: isAnalyzing || !articleText.trim() ? 0.6 : 1
                }}
                onMouseOver={(e) => {
                  if (!isAnalyzing && articleText.trim()) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(0, 255, 255, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze for Bias'}
              </button>
              
              {/* Analysis Results */}
              {analysisResult && (
                <div style={{
                  marginTop: '2rem',
                  padding: '1.5rem',
                  background: 'rgba(0, 255, 0, 0.1)',
                  borderRadius: '15px',
                  border: '2px solid var(--matrix-green)'
                }}>
                  <h4 style={{
                    color: 'var(--matrix-green)',
                    fontFamily: 'Orbitron, sans-serif',
                    textAlign: 'center',
                    marginBottom: '1rem'
                  }}>
                    Analysis Results
                  </h4>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '2rem', 
                        fontWeight: 'bold', 
                        color: 'var(--primary-color)',
                        fontFamily: 'Orbitron, sans-serif'
                      }}>
                        {analysisResult.biasScore}%
                      </div>
                      <div style={{ color: 'var(--text-color)', fontSize: '0.9rem' }}>
                        Bias Score
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: 'bold', 
                        color: 'var(--accent-color)',
                        textTransform: 'capitalize'
                      }}>
                        {analysisResult.biasType}
                      </div>
                      <div style={{ color: 'var(--text-color)', fontSize: '0.9rem' }}>
                        Primary Bias Type
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: 'bold', 
                        color: 'var(--matrix-green)'
                      }}>
                        {analysisResult.confidence}%
                      </div>
                      <div style={{ color: 'var(--text-color)', fontSize: '0.9rem' }}>
                        Confidence
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '1rem',
                    borderRadius: '10px',
                    marginBottom: '1rem'
                  }}>
                    <h5 style={{ 
                      color: 'var(--accent-color)', 
                      marginBottom: '0.5rem',
                      fontFamily: 'Orbitron, sans-serif'
                    }}>
                      Summary:
                    </h5>
                    <p style={{ 
                      color: 'var(--text-color)', 
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      {analysisResult.summary}
                    </p>
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-color)', opacity: 0.7, textAlign: 'center' }}>
                    Analysis completed at {new Date(analysisResult.timestamp).toLocaleString()}
                  </div>
                </div>
              )}
              
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(0, 255, 255, 0.1)',
                borderRadius: '10px',
                border: '1px solid var(--accent-color)',
                fontSize: '0.9rem',
                color: 'var(--text-color)',
                textAlign: 'center'
              }}>
                <strong style={{ color: 'var(--accent-color)' }}>Note:</strong> This is a demo interface with mock results. 
                The actual microfrag analysis components will be integrated in the next development phase.
              </div>
            </div>
          </div>
        </div>
      </BiasAuthGuard>

      {/* Auth Modal */}
      <BiasAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => setShowAuthModal(false)}
        onGuestMode={() => setShowAuthModal(false)}
      />

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={handlePaywallClose}
        onUpgrade={handlePaywallUpgrade}
      />

      {/* Development Testing Panels - Remove in production */}
      {process.env.NODE_ENV === 'development' && <UsageTestPanel />}
    </div>
  );
};

export default BiasDetectionApp;