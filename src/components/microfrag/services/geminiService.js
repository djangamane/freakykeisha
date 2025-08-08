// Backend API service for bias analysis
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Function to get bias detection JWT token
const getBiasAuthToken = () => {
  try {
    // Get JWT token from bias detection auth system
    const token = localStorage.getItem('bias_auth_token');
    if (token) {
      console.log('Found bias detection JWT token');
      return token;
    }

    console.log('No bias detection auth token found, proceeding as anonymous user');
    return null;
  } catch (error) {
    console.warn('Error getting bias auth token:', error);
    return null;
  }
};

// Fallback to mock data if backend is not available
const ENABLE_MOCK_MODE = process.env.REACT_APP_ENABLE_MOCK_MODE === 'true' || false;

// Mock analysis function for fallback
const getMockAnalysis = (text) => {
  // eslint-disable-next-line no-unused-vars
  const wordCount = text.split(' ').length;
  const mockScore = Math.floor(Math.random() * 60) + 20; // Random score between 20-80

  return {
    score: mockScore,
    detected_terms: [
      {
        term: "systemic issues",
        explanation: "This euphemism obscures the specific mechanisms of white supremacy by using vague language."
      },
      {
        term: "cultural differences",
        explanation: "Often used to avoid discussing racial power dynamics and structural inequalities."
      }
    ],
    analysis_summary: `This article contains ${mockScore}% bias indicators based on our analysis framework. The text shows patterns consistent with white fragility discourse, using euphemistic language to avoid direct confrontation with white supremacist structures. Key indicators include deflection tactics and the centering of white comfort over racial justice. This analysis is based on the frameworks of Dr. Frances Cress Welsing and Dr. Amos Wilson. (Note: This is a mock analysis - backend server not available)`
  };
};

// Test backend connectivity
export const testBackendConnection = async () => {
  try {
    // Try a simple health check endpoint
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Backend status check successful:', data);
      return true;
    } else {
      console.warn('Backend status check failed:', response.status);
      return false;
    }
  } catch (error) {
    console.warn('Backend connectivity test failed:', error.message);
    return false;
  }
};

// Combined function to get both analysis and translation in one request
// Updated: 2025-08-08 - Fixed production response structure
export const analyzeAndTranslateArticle = async (text, authToken = null) => {
  if (!text || !text.trim()) {
    throw new Error("Article text is required for analysis");
  }

  try {
    console.log('Calling backend API for combined analysis and translation at:', `${API_BASE_URL}/api/bias-analysis/analyze`);
    console.log('Request payload:', {
      article_text: text.substring(0, 100) + '...',
      article_title: "Article Analysis",
      include_translation: true
    });

    // Test backend connectivity first
    const isBackendAvailable = await testBackendConnection();
    if (!isBackendAvailable) {
      console.warn('Backend connectivity test failed, but proceeding with analysis request...');
    }

    // Use provided token or get from bias auth
    const finalAuthToken = authToken || getBiasAuthToken();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for AI analysis

    const headers = {
      'Content-Type': 'application/json',
    };

    // Add authorization header if token is available
    if (finalAuthToken) {
      headers['Authorization'] = `Bearer ${finalAuthToken}`;
      console.log('Including auth token in request');
    } else {
      console.log('No auth token available, proceeding as anonymous user');
    }

    const response = await fetch(`${API_BASE_URL}/api/bias-analysis/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        article_text: text,
        article_title: "Article Analysis",
        include_translation: true // Request both analysis and translation
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log('Backend response status:', response.status);

    if (!response.ok) {
      let errorData = {};
      let errorText = '';

      try {
        errorText = await response.text();
        console.error('Backend error response text:', errorText);

        // Try to parse as JSON
        if (errorText.trim().startsWith('{')) {
          errorData = JSON.parse(errorText);
        }
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
      }

      console.error('Backend error details:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorText
      });

      // Handle 429 (rate limit) - check if it's usage limit exceeded
      if (response.status === 429) {
        // Check if this is a usage limit error vs general rate limit
        if (errorData.error?.code === 'USAGE_LIMIT_EXCEEDED' ||
            errorData.code === 'USAGE_LIMIT_EXCEEDED' ||
            errorText.includes('USAGE_LIMIT_EXCEEDED') ||
            errorText.includes('Daily usage limit exceeded')) {
          throw new Error('USAGE_LIMIT_EXCEEDED');
        } else {
          throw new Error('Keisha is currently analyzing too many articles. Please wait a moment and try again. The backend is working - just temporarily rate limited.');
        }
      }

      // Provide more specific error messages based on status code
      if (response.status === 500) {
        throw new Error(`Backend server error (500). The analysis service may be misconfigured or experiencing issues.`);
      } else if (response.status === 404) {
        throw new Error(`Analysis endpoint not found (404). Please check if the backend is running the correct version.`);
      } else if (response.status === 400) {
        // Check for usage limit in 400 errors too
        if (errorData.error?.code === 'USAGE_LIMIT_EXCEEDED' ||
            errorData.code === 'USAGE_LIMIT_EXCEEDED' ||
            errorText.includes('USAGE_LIMIT_EXCEEDED') ||
            errorText.includes('Daily usage limit exceeded')) {
          throw new Error('USAGE_LIMIT_EXCEEDED');
        }
        throw new Error(errorData.error?.message || errorData.message || `Invalid request (400): ${errorText}`);
      } else {
        throw new Error(errorData.error?.message || errorData.message || `HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();
    console.log('Backend response data:', JSON.stringify(data, null, 2));
    console.log('Backend analysis structure:', {
      success: data.success,
      hasAnalysis: !!data.analysis,
      biasScore: data.analysis?.bias_score,
      keyIndicatorsType: typeof data.analysis?.key_indicators,
      keyIndicatorsLength: data.analysis?.key_indicators?.length,
      hasTranslation: !!data.translation,
      hasAnalysisTranslation: !!data.analysis?.translation
    });

    if (data.success && data.analysis) {
      // Transform key_indicators from backend format to frontend format
      let detectedTerms = [];
      if (data.analysis.key_indicators && Array.isArray(data.analysis.key_indicators)) {
        detectedTerms = data.analysis.key_indicators.map((indicator, index) => {
          // If indicator is already an object with term/explanation, use it
          if (typeof indicator === 'object' && indicator.term) {
            return indicator;
          }
          // If indicator is a string, convert it to the expected format
          return {
            term: typeof indicator === 'string' ? indicator : `Indicator ${index + 1}`,
            explanation: typeof indicator === 'string'
              ? "This term functions as a euphemism that obscures the underlying mechanisms of white supremacy."
              : indicator.explanation || "White supremacist euphemism detected."
          };
        });
      }

      // Enhanced euphemism detection - focus on white supremacist terms AND liberal complicity
      const whiteSupremacistEuphemisms = [
        // Direct white supremacist euphemisms
        'racism', 'systemic racism', 'colonialism', 'imperialism',
        'christian nationalism', 'christian nationalist', 'white nationalism', 'white nationalist',
        'domestic terrorism', 'domestic terrorist', 'far right', 'far-right',
        'nazi', 'neo nazi', 'neo-nazi', 'maga', 'make america great again',
        'great replacement', 'replacement theory', 'antiracism', 'anti-racism',
        'reverse racism', 'social justice', 'racial equity', 'diversity',
        'inclusion', 'woke', 'cancel culture', 'identity politics',

        // Liberal complicity euphemisms (avoiding naming white supremacy)
        'extremism', 'extremist', 'radical', 'radicalism', 'divisive rhetoric',
        'inflammatory language', 'hate speech', 'bigotry', 'prejudice',
        'intolerance', 'discrimination', 'bias', 'polarization',
        'authoritarian', 'fascist', 'populist', 'nationalist'
      ];

      // Filter and enhance detected terms to focus on actual euphemisms
      detectedTerms = detectedTerms.filter(term => {
        const termLower = term.term.toLowerCase();
        return whiteSupremacistEuphemisms.some(euphemism =>
          termLower.includes(euphemism.toLowerCase())
        );
      }).map(term => {
        const termLower = term.term.toLowerCase();

        // Provide specific explanations for key euphemisms
        if (termLower.includes('christian nationalism') || termLower.includes('christian nationalist')) {
          return {
            ...term,
            explanation: "Christian nationalism is a euphemism for white supremacy wrapped in religious language, allowing white supremacists to advance their agenda while claiming divine mandate."
          };
        }
        if (termLower.includes('racism') && !termLower.includes('white supremacy')) {
          return {
            ...term,
            explanation: "The term 'racism' without specifying 'white supremacy' obscures the systemic nature of racial oppression and allows for false equivalencies like 'reverse racism.'"
          };
        }
        if (termLower.includes('systemic racism')) {
          return {
            ...term,
            explanation: "Systemic racism is often used as a sanitized term for white supremacy, making it sound like an abstract system rather than deliberate white supremacist policy."
          };
        }
        if (termLower.includes('domestic terrorism') || termLower.includes('domestic terrorist')) {
          return {
            ...term,
            explanation: "Domestic terrorism is frequently used to avoid calling white supremacist violence what it is - organized white supremacist terrorism."
          };
        }

        // Liberal complicity euphemisms - terms that avoid naming white supremacy
        if (termLower.includes('extremism') || termLower.includes('extremist')) {
          return {
            ...term,
            explanation: "Extremism is liberal code for white supremacy. By calling it 'extremism,' they avoid naming the specific system of white supremacy and make it sound like fringe behavior rather than mainstream white politics."
          };
        }
        if (termLower.includes('divisive rhetoric') || termLower.includes('inflammatory language')) {
          return {
            ...term,
            explanation: "This language treats white supremacist messaging as mere 'rhetoric' rather than the systematic dehumanization it actually is. It's liberal complicity in protecting white supremacy from proper analysis."
          };
        }
        if (termLower.includes('hate speech') || termLower.includes('bigotry')) {
          return {
            ...term,
            explanation: "These terms individualize white supremacy as personal 'hate' rather than recognizing it as the systematic oppression it is. This protects the white supremacist system by making it about individual bad actors."
          };
        }
        if (termLower.includes('authoritarian') || termLower.includes('fascist')) {
          return {
            ...term,
            explanation: "These terms allow liberals to critique white supremacist tactics without naming white supremacy itself. It's historical deflection - comparing to European fascism while ignoring American white supremacy."
          };
        }

        return term;
      });

      // Backend AI now properly implements counter-racism framework
      // Frontend correction system removed - no longer needed

      console.log('Enhanced euphemism detection debug:', {
        originalKeyIndicators: data.analysis.key_indicators,
        filteredDetectedTerms: detectedTerms,
        detectedTermsCount: detectedTerms.length,
        detectedTermsList: detectedTerms.map(t => t.term)
      });

      // Transform backend response to match expected frontend format
      const analysisSummary = data.analysis.explanation || "Analysis completed successfully.";
      console.log('Analysis summary debug:', {
        hasExplanation: !!data.analysis.explanation,
        explanationLength: data.analysis.explanation?.length,
        explanationPreview: data.analysis.explanation?.substring(0, 100) + '...',
        explanationEnding: data.analysis.explanation?.substring(data.analysis.explanation.length - 50)
      });

      // Convert score from 0-1 range to 0-100 range for display
      const rawScore = data.analysis.bias_score || 0;
      const displayScore = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);

      console.log('Score conversion debug:', {
        rawScore,
        displayScore,
        wasConverted: rawScore <= 1
      });

      const transformedAnalysis = {
        score: displayScore,
        detected_terms: detectedTerms,
        analysis_summary: analysisSummary
      };

      // Extract translation - prioritize separate translation field
      let translation = "Translation not available.";

      console.log('Translation extraction debug:', {
        hasDataTranslation: !!data.translation,
        dataTranslationLength: data.translation?.length,
        hasAnalysisTranslation: !!data.analysis.translation,
        analysisTranslationLength: data.analysis.translation?.length,
        hasKeishaTranslation: !!data.analysis.keisha_translation,
        keishaTranslationLength: data.analysis.keisha_translation?.length,
        explanationLength: data.analysis.explanation?.length,
        translationEqualsExplanation: data.translation === data.analysis.explanation
      });

      if (data.translation && data.translation.trim() && data.translation !== data.analysis.explanation) {
        // Use separate translation if available and different from analysis
        translation = data.translation;
        console.log('Using data.translation');
      } else if (data.analysis.keisha_translation && data.analysis.keisha_translation.trim() && data.analysis.keisha_translation !== data.analysis.explanation) {
        // Use keisha_translation from backend (this is the real Keisha translation!)
        translation = data.analysis.keisha_translation;
        console.log('Using data.analysis.keisha_translation');
      } else if (data.analysis.translation && data.analysis.translation.trim() && data.analysis.translation !== data.analysis.explanation) {
        // Use analysis.translation if available and different from explanation
        translation = data.analysis.translation;
        console.log('Using data.analysis.translation');
      } else {
        // Generate a proper Keisha translation format
        translation = `KEISHA'S TRANSLATION:\n\nY'all, this article is exactly the kind of white supremacist propaganda we need to call out. This is how they operate - using coded language and false equivalencies to make racism sound intellectual and reasonable.\n\nDon't let them fool you with their "both sides" nonsense. This is about power, about who has it, and who's fighting to keep Black and Brown people from getting it. The real story they don't want you to see is how these systems of oppression work together to maintain white supremacy.\n\nWe see right through this BS.`;
        console.log('Using fallback Keisha translation');
      }

      const finalResult = {
        success: true,
        analysis: transformedAnalysis,
        translation: translation,
        usage: data.usage // Pass through usage data from backend
      };
      console.log('Transformed analysis and translation result:', finalResult);
      console.log('PRODUCTION DEBUG - Final result keys:', Object.keys(finalResult));
      console.log('PRODUCTION DEBUG - Has success:', !!finalResult.success);
      console.log('PRODUCTION DEBUG - Has analysis:', !!finalResult.analysis);
      return finalResult;
    } else {
      console.error('Backend response missing success or analysis:', data);
      throw new Error(data.error?.message || 'Analysis failed');
    }

  } catch (error) {
    console.error("Error analyzing article:", error);

    // Check if this is a network connectivity issue
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Keisha\'s analysis takes time - please try again with patience.');
    } else if (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.message.includes('connect')) {
      throw new Error('Cannot connect to Keisha\'s backend server. Please check if the server is running on port 3001.');
    } else if (error.message.includes('timeout')) {
      throw new Error('Request timed out. Keisha\'s analysis takes time - please try again.');
    } else {
      // For other errors, still try mock if enabled
      if (ENABLE_MOCK_MODE) {
        console.warn('Backend error, falling back to mock data:', error.message);
        return {
          success: true,
          analysis: getMockAnalysis(text),
          translation: getMockTranslation(text),
          usage: { daily_count: 1, daily_limit: 3, remaining: 2 }
        };
      }
      throw new Error(error.message || "Failed to get analysis from AI agent.");
    }
  }
};

// Backward compatibility - single analysis function
export const analyzeArticle = async (text, authToken = null) => {
  const result = await analyzeAndTranslateArticle(text, authToken);
  return result.analysis;
};

// Backward compatibility - single translation function
export const translateArticle = async (text, authToken = null) => {
  const result = await analyzeAndTranslateArticle(text, authToken);
  return result.translation;
};

// Mock translation function for fallback
const getMockTranslation = (text) => {
  return `KEISHA'S TRANSLATION: Let me tell you what this article REALLY says

Y'all, we need to talk about this piece of propaganda masquerading as "journalism." Because that's exactly what this is - a masterclass in how white supremacist media operates in 2024.

First off, let's address the elephant in the room: this entire article is written from the perspective that white comfort matters more than Black truth. Every single paragraph is crafted to make white readers feel good about themselves while completely ignoring the lived experiences of Black and Brown communities.

The author uses what I call "racism with a smile" - all these polite euphemisms and coded language that sound reasonable on the surface but are designed to maintain the exact same oppressive systems we've been fighting against for centuries. When they say "cultural differences," they mean "we don't want to acknowledge systemic racism." When they talk about "both sides," they're creating false equivalencies between oppressor and oppressed.

This is the same playbook Dr. Frances Cress Welsing warned us about - the psychological manipulation that keeps white supremacy intact by making it sound intellectual and reasonable. But I'm not here for the intellectual games. I'm here to tell you the truth.

The real story this article should be telling is about power, about who has it, who's fighting to keep it, and who's being systematically excluded from it. Instead, we get this sanitized version that protects white feelings while Black and Brown people continue to suffer under the very systems this article refuses to name.

And let me be crystal clear - this isn't journalism. This is propaganda. This is how white supremacy maintains itself in the 21st century: not with hoods and burning crosses, but with think pieces and "objective" reporting that somehow always manages to center whiteness and marginalize everyone else.

We see you. We see what you're doing. And we're not falling for it anymore.

(Note: This is Keisha's mock translation - backend server not available)`;
};

