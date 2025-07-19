import React, { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import LandingPage from './components/LandingPage';
import "./App.css";

// Use environment variables for Supabase credentials
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const errorMsg = "CRITICAL ERROR: Supabase URL or Anon Key is missing. Check your .env file. App will not function correctly.";
  console.error(errorMsg);
  alert(errorMsg); // Make it very obvious
  // Consider throwing an error here to halt execution if preferred
  // throw new Error(errorMsg);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const kb3ImageUrl = process.env.PUBLIC_URL + '/kb3.png'; // Chat page desktop background
const desktopLandingImageUrl = process.env.PUBLIC_URL + '/kbf.png'; // Landing page desktop background
const mobileKeishaImageUrl = process.env.PUBLIC_URL + '/mobilekeish2.png'; // Chat page mobile background
const mobileLandingImageUrl = process.env.PUBLIC_URL + '/mobilekeish.png'; // Landing page mobile background

// Keisha AI System Prompt
const KEISHA_SYSTEM_PROMPT = `Your name is Keisha...`;

// Helper function to test Supabase query independently
function testSupabaseProfileQuery(userId) {
  console.log(`[testSupabaseProfileQuery] Called for userId: ${userId}`);

  // Ensure Supabase client is available
  if (!supabase) {
    console.error("[testSupabaseProfileQuery] Supabase client is not initialized!");
    return Promise.reject(new Error("Supabase client not initialized"));
  }
  if (typeof supabase.from !== 'function') {
    console.error("[testSupabaseProfileQuery] supabase.from is not a function. Client state:", supabase);
    return Promise.reject(new Error("supabase.from is not a function"));
  }

  console.log(`[testSupabaseProfileQuery] About to create Supabase promise for userId: ${userId}`);
  const queryPromise = supabase
    .from('profiles')
    .select('id, username, avatar_url, subscription_tier, website') // Ensure these columns exist in your 'profiles' table
    .eq('id', userId)
    .single();

  // Check if a promise-like object was returned
  if (!queryPromise || typeof queryPromise.then !== 'function') {
    console.error("[testSupabaseProfileQuery] Supabase query did not return a valid promise object.");
    // Attempt to log what it did return, safely
    try {
      console.log("[testSupabaseProfileQuery] Supabase returned:", JSON.stringify(queryPromise));
    } catch (e) {
      console.log("[testSupabaseProfileQuery] Supabase returned (could not stringify):", queryPromise);
    }
    return Promise.reject(new Error("Supabase query did not return a valid promise."));
  }

  console.log(`[testSupabaseProfileQuery] Supabase promise created. Attaching .then(), .catch(), and .finally().`);

  queryPromise
    .then(response => {
      // This log is crucial. If it appears, the promise resolved.
      console.log(`[testSupabaseProfileQuery] Query .then() ATTACHED HERE was CALLED. Response:`, response);
      // response will be { data, error, status, etc. }
    })
    .catch(error => {
      // This log is crucial. If it appears, the promise rejected.
      console.error(`[testSupabaseProfileQuery] Query .catch() ATTACHED HERE was CALLED. Error:`, error);
    })
    .finally(() => {
      // This log is crucial. If it appears, the promise settled (either way).
      console.log(`[testSupabaseProfileQuery] Query .finally() ATTACHED HERE was CALLED.`);
    });

  console.log(`[testSupabaseProfileQuery] Returning the original Supabase promise to be awaited by caller.`);
  return queryPromise; // Return the original promise for fetchUserProfile to await
}

function App() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showPaywallModal, setShowPaywallModal] = useState(false); // New state for paywall
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [loadingAuthState, setLoadingAuthState] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [currentView, setCurrentView] = useState('chat');
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [isInitializingNewSession, setIsInitializingNewSession] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  // Always show the under construction overlay
  const [showUnderConstruction] = useState(true);
  const fetchingUserIdRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isFetchingProfile = useRef(false);
  const [loadingProfile, setLoadingProfile] = useState(false); // Initialize to false, true when fetching
  const [profileError, setProfileError] = useState(null);

  // Handle window resize to detect mobile vs desktop
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to scroll to the bottom of the chat
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      console.log('[scrollToBottom] Attempting to scroll.');
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    } else {
      console.warn('[scrollToBottom] messagesEndRef.current is null or undefined. Cannot scroll.');
    }
  }, []); // No dependencies needed if messagesEndRef itself is stable

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    console.log('[useEffect for Messages] Messages array changed, calling scrollToBottom.');
    scrollToBottom();
  }, [messages, scrollToBottom]); // Add scrollToBottom because it's now memoized with useCallback

  // Effect to focus input when chat view is active and inputRef is available
  useEffect(() => {
    if (currentView === 'chat' && inputRef.current) {
      console.log('[useEffect for Input Focus] Chat view is active, focusing input.');
      inputRef.current.focus();
    }
  }, [currentView, inputRef]);

  const fetchUserProfile = useCallback(async (userId, userEmailIfAvailable) => {
    console.log(`[fetchUserProfile] Called for userId: ${userId}`);
    if (fetchingUserIdRef.current === userId) {
      console.log(`[fetchUserProfile] Already fetching for userId: ${userId}, skipping.`);
      return;
    }
    if (!userId) {
      console.log('[fetchUserProfile] No userId provided, setting default guest profile.');
      setUserProfile({
        subscription_tier: 'Free',
        message_count_today: 0,
        last_message_reset_at: null,
        subscription_expires_at: null,
        username: 'User', // Default for non-logged-in or new users
        id: null // No actual DB ID for guest
      });
      fetchingUserIdRef.current = null;
      return;
    }

    fetchingUserIdRef.current = userId;
    console.log(`[fetchUserProfile] Attempting to fetch profile for userId: ${userId} from Supabase.`);
    setLoadingProfile(true);

    try {
      console.log(`[fetchUserProfile] Checking Supabase client:`, supabase);
      console.log(`[fetchUserProfile] Checking supabase.from type:`, typeof supabase.from);
      console.log(`[fetchUserProfile] TRY block entered for userId: ${userId}. Calling testSupabaseProfileQuery.`);

      // Call the isolated test function
      const profileQueryResponse = await testSupabaseProfileQuery(userId);

      console.log(`[fetchUserProfile] Response from awaited testSupabaseProfileQuery:`, profileQueryResponse);

      // The structure of profileQueryResponse should be { data, error, status, ... }
      const { data: profileData, error: profileError } = profileQueryResponse;

      if (profileError) {
        console.error('[fetchUserProfile] Error fetching profile:', profileError);
        const defaultErrorProfile = {
          subscription_tier: 'Free',
          message_count_today: 0,
          last_message_reset_at: null,
          subscription_expires_at: null,
          username: userEmailIfAvailable || 'User',
          id: userId
        };
        console.log('[fetchUserProfile] Setting default profile due to error:', defaultErrorProfile);
        setUserProfile(defaultErrorProfile);
      } else if (profileData) {
        console.log('[fetchUserProfile] Profile data fetched successfully:', profileData);
        setUserProfile(profileData);
      } else {
        console.warn('[fetchUserProfile] No profile data and no error. This might mean the profile does not exist or RLS denied access silently (should not happen with .single()). Profile data:', profileData);
        // If .single() is used and no row is found (and RLS allows the query), 
        // Supabase v2 often returns data: null and error: null with a status that indicates not found (e.g., 406 or PostgrestError with code PGRST116).
        // Supabase v3 might behave differently. Let's check the whole response.
        const newDefaultProfile = {
          subscription_tier: 'Free',
          message_count_today: 0,
          last_message_reset_at: null,
          subscription_expires_at: null,
          username: userEmailIfAvailable || 'User',
          id: userId
        };
        console.log('[fetchUserProfile] No profile data in array (new user?), setting default profile:', newDefaultProfile);
        setUserProfile(newDefaultProfile);
      }
    } catch (e) {
      console.error(`[fetchUserProfile] CATCH block entered for userId: ${userId}. Exception during profile fetch:`, e);
      const exceptionProfile = {
        subscription_tier: 'Free',
        message_count_today: 0,
        last_message_reset_at: null,
        subscription_expires_at: null,
        username: userEmailIfAvailable || 'User',
        id: userId
      };
      console.log('[fetchUserProfile] Setting default profile due to exception:', exceptionProfile);
      setUserProfile(exceptionProfile);
    } finally {
      console.log(`[fetchUserProfile] FINALLY block for userId: ${userId}. Setting loadingProfile=false, fetchingUserIdRef.current=null.`);
      setLoadingProfile(false);
      fetchingUserIdRef.current = null;
    }
  }, [setUserProfile]); // Added dependency based on usage

  // Function to fetch messages for a given session ID
  const fetchAndSetMessagesForSession = useCallback(async (sessionId) => {
    if (!sessionId) {
      setMessages([]);
      return;
    }
    try {
      const { data: sessionMessagesData, error } = await supabase
        .from('messages')
        .select('id, user_prompt, ai_response, created_at, session_id') // Ensure `id` is selected for stable keys
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages for session:', error);
        setMessages([]);
        return;
      }

      const loadedDisplayMessages = [];
      sessionMessagesData.forEach(dbRow => {
        if (dbRow.user_prompt) {
          loadedDisplayMessages.push({
            id: dbRow.id + '_user', // Stable ID based on DB row ID + suffix
            text: dbRow.user_prompt,
            sender: 'user',
            timestamp: dbRow.created_at
          });
        }
        if (dbRow.ai_response) {
          loadedDisplayMessages.push({
            id: dbRow.id + '_ai', // Stable ID based on DB row ID + suffix
            text: dbRow.ai_response,
            sender: 'ai',
            timestamp: dbRow.created_at
          });
        }
      });
      setMessages(loadedDisplayMessages);
    } catch (e) {
      console.error("Exception fetching messages:", e);
      setMessages([]);
    } finally {
    }
  }, []); // Dependencies: supabase client instance if it were outside, but it's global here.

  useEffect(() => {
    console.log('[Auth Effect] Started. loadingAuthState = true');
    setLoadingAuthState(true);
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, sessionState) => {
        console.log('[Auth Listener] Event:', _event, 'Session:', sessionState);
        setSession(sessionState);
        if (sessionState?.user) {
          console.log('[Auth Listener] User found, profile fetch will be handled by dedicated effect.');
        } else {
          console.log('[Auth Listener] No user session, clearing profile.');
          setUserProfile(null);
        }
        console.log('[Auth Listener] Setting loadingAuthState = false');
        setLoadingAuthState(false);
      }
    );

    (async () => {
      console.log('[Auth Effect IIFE] Getting initial session...');
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      console.log('[Auth Effect IIFE] Initial session:', initialSession);
      setSession(initialSession);
      if (initialSession?.user) {
        console.log('[Auth Effect IIFE] Initial user found, profile fetch will be handled by dedicated effect.');
      }
      console.log('[Auth Effect IIFE] Setting loadingAuthState = false');
      setLoadingAuthState(false);
    })();

    return () => {
      console.log('[Auth Effect] Cleanup. Unsubscribing auth listener.');
      authListener?.data?.subscription?.unsubscribe();
    };
  }, []); // Changed dependency from [fetchUserProfile] to []

  useEffect(() => {
    if (session?.user && !userProfile && !loadingAuthState) {
      console.log(`[Profile Fetch Effect] Conditions met: User session found (user ID: ${session.user.id}), userProfile is NOT loaded, loadingAuthState is false. Attempting to fetch profile.`);
      fetchUserProfile(session.user.id, session.user.email);
    } else if (session?.user && userProfile) {
      console.log(`[Profile Fetch Effect] Profile already loaded for user ID: ${session.user.id}.`);
    } else if (!session?.user) {
      console.log(`[Profile Fetch Effect] No user session.`);
    } else if (loadingAuthState) {
      console.log(`[Profile Fetch Effect] Still loading auth state.`);
    }
  }, [session, userProfile, loadingAuthState, fetchUserProfile]);

  useEffect(() => {
    if (currentSessionId && session?.user?.id && !isInitializingNewSession) { // Check the flag
      fetchAndSetMessagesForSession(currentSessionId);
    } else if (!currentSessionId) {
      // This case handles 'New Chat' button press or initial load without a session
      setMessages([]);
    }
    // fetchAndSetMessagesForSession is stable due to useCallback with empty deps.
    // isAiThinking is a boolean.
    // messages.length is a number.
  }, [currentSessionId, session?.user?.id, fetchAndSetMessagesForSession, isInitializingNewSession]); // Added isInitializingNewSession to dependencies

  const handleSendMessage = async () => {
    console.log(`[handleSendMessage] Attempting to send. loadingAuthState: ${loadingAuthState}, userProfile set: ${!!userProfile}`);

    if (inputValue.trim() === "") return;

    // User login check
    if (!session?.user?.id) {
      console.error("User not logged in, cannot send message.");
      setMessages((prevMessages) => [...prevMessages, { id: uuidv4(), text: "You must be logged in to chat.", sender: 'system', error: true }]);
      setIsAiThinking(false);
      return;
    }

    // User Profile Check - This should come BEFORE setting AI thinking or adding user message to UI for sending
    // fetchUserProfile is primarily handled by useEffect listening to session changes.
    // We just check if userProfile state is populated here.
    if (!userProfile) {
      console.warn("User profile not loaded yet. Message sending deferred.");
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: uuidv4(),
          text: "Your profile is still loading, please try sending again shortly.",
          sender: 'system',
          error: true
        }
      ]);
      setIsAiThinking(false); // Ensure 'thinking' stops if profile isn't loaded
      return;
    }

    // Daily message limit check (should come after profile is confirmed loaded)
    const today = new Date().toDateString();
    if (userProfile.last_message_reset_at !== today) {
      // Reset count if it's a new day
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ message_count_today: 0, last_message_reset_at: today })
          .eq('id', userProfile.id)
          .select()
          .single();
        if (error) throw error;
        setUserProfile(data); // Update profile state with reset count
      } catch (error) {
        console.error("Error resetting daily message count:", error);
        // Optionally, inform the user or handle gracefully. For now, we'll proceed.
      }
    }

    if (userProfile.message_count_today >= (userProfile.subscription_tier === 'premium' ? 1000 : 10) && userProfile.subscription_tier !== 'unlimited') {
      setMessages((prevMessages) => [...prevMessages, { id: uuidv4(), text: "You've reached your daily message limit for your current plan.", sender: 'system', error: true }]);
      setShowPaywallModal(true);
      setIsAiThinking(false); // Stop thinking indicator
      return;
    }

    // If profile is loaded and limit not reached, proceed to add user message and set AI thinking
    const userMessageContent = inputValue.trim();
    const tempUserMessageId = `temp_${uuidv4()}`; // Create a temporary ID
    const newUserMessageOptimistic = {
      id: tempUserMessageId, // Use temporary ID
      text: userMessageContent,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prevMessages) => [...prevMessages, newUserMessageOptimistic]);
    setInputValue("");
    setIsAiThinking(true); // Set AI thinking only AFTER profile check passes and message is added

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = uuidv4();
      setIsInitializingNewSession(true); // Set flag for new session initialization
      setCurrentSessionId(activeSessionId);
    }

    const requestBody = {
      message: userMessageContent,
      model: "goekdenizguelmez/JOSIEFIED-Qwen3",
      sessionId: activeSessionId,
      userId: session.user.id,
      encrypted: true, // Flag for encryption
    };

    // Use environment variable for API endpoint
    const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || "http://localhost:3001/api/chat";

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.REACT_APP_HF_TOKEN || ''}`, // For Hugging Face if needed
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let backendErrorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          backendErrorMsg = errorData.message || errorData.error || backendErrorMsg;
        } catch (e) {
        }
        console.error("Backend error:", backendErrorMsg);
        // Remove the optimistic message if backend fails before AI response
        setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== tempUserMessageId));
        setMessages((prevMessages) => [...prevMessages, { id: uuidv4(), text: `Error: ${backendErrorMsg}`, sender: 'ai', error: true }]);
        return;
      }

      const data = await response.json(); // data should now contain { userMessage, aiMessage, sessionId }

      // Remove the optimistic user message
      setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== tempUserMessageId));

      // Process and add confirmed user message and AI message
      if (data.userMessage && data.aiMessage) {
        console.log('[handleSendMessage] Raw data.userMessage received:', JSON.stringify(data.userMessage, null, 2));
        console.log('[handleSendMessage] Raw data.aiMessage received:', JSON.stringify(data.aiMessage, null, 2));

        const cleanedAiText = data.aiMessage.text ? data.aiMessage.text.replace(/<think>.*?<\/think>/gs, "").trim() : "AI response text missing";

        const confirmedUserMessage = {
          ...data.userMessage,
          id: data.userMessage.id || `user_fallback_${uuidv4()}`, // Fallback ID
          sender: 'user',
          timestamp: data.userMessage.timestamp || new Date().toISOString(),
        };
        console.log('[handleSendMessage] Constructed confirmedUserMessage:', JSON.stringify(confirmedUserMessage, null, 2));

        const finalAiMessage = {
          ...data.aiMessage,
          text: cleanedAiText,
          id: data.aiMessage.id || `ai_fallback_${uuidv4()}`, // Fallback ID
          sender: 'ai',
          timestamp: data.aiMessage.timestamp || new Date().toISOString(),
        };
        console.log('[handleSendMessage] Constructed finalAiMessage:', JSON.stringify(finalAiMessage, null, 2));

        setMessages(prevMessages => {
          console.log('[handleSendMessage] prevMessages (before adding confirmed user & AI):', JSON.stringify(prevMessages, null, 2));

          // Check for duplicate IDs before adding new messages
          const existingIds = new Set(prevMessages.map(msg => msg.id));

          // Ensure unique IDs for new messages
          if (existingIds.has(confirmedUserMessage.id)) {
            confirmedUserMessage.id = `user_${uuidv4()}`;
          }

          if (existingIds.has(finalAiMessage.id)) {
            finalAiMessage.id = `ai_${uuidv4()}`;
          }

          // Create new messages array with deep copies to avoid reference issues
          const newMessages = [...prevMessages, { ...confirmedUserMessage }, { ...finalAiMessage }];

          console.log('[handleSendMessage] newMessages (with confirmed user & AI response):', JSON.stringify(newMessages, null, 2));

          if (newMessages.some(msg => !msg || typeof msg.id === 'undefined' || msg.id === null)) {
            console.error('[CRITICAL] Attempting to set messages with a malformed entry (missing/null ID)!', JSON.stringify(newMessages, null, 2));
          }

          return newMessages;
        });
      } else {
        console.warn('[handleSendMessage] data.userMessage or data.aiMessage was null or undefined. Full data object:', JSON.stringify(data, null, 2));
      }

      setIsAiThinking(false);
      setInputValue('');
    } catch (error) {
      console.error("Network or other error sending message:", error);
      // Remove the optimistic message if any other error occurs
      setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== tempUserMessageId));
      setMessages((prevMessages) => [...prevMessages, { id: uuidv4(), text: `Error: ${error.message}`, sender: 'ai', error: true }]);
    } finally {
      setIsAiThinking(false);
      if (isInitializingNewSession) {
        setIsInitializingNewSession(false); // Reset flag after the full send/receive cycle
      }
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null); // This will trigger the useEffect to clear messages
    // setMessages([]); // No longer strictly needed here as useEffect handles it, but harmless
    setInputValue('');
    setIsAiThinking(false);
    setIsInitializingNewSession(false); // Ensure flag is reset if a new chat is started abruptly
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) {
      setAuthError(error.message);
      console.error('Sign in error:', error.message);
    } else {
      console.log('Sign in successful');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleUpgradePayment = async (tier) => {
    setSelectedUpgradeTier(tier);
    setPaymentError('');

    if (!session?.user?.id) {
      setPaymentError("User not logged in. Please sign in to upgrade.");
      return;
    }
    await fetchUserProfile(session.user.id, session.user.email);

    let amount;
    let currency = 'USD';
    if (tier === 'Starter') {
      amount = 9.00;
      currency = 'USD';
    } else if (tier === 'Pro') {
      amount = 59.00;
      currency = 'USD';
    } else if (tier === 'Gold') {
      amount = 99.00;
      currency = 'USD';
    } else {
      console.error("Invalid tier selected:", tier);
      setPaymentError("Invalid subscription tier selected.");
      return;
    }

    const paymentRequestBody = {
      amount: amount,
      currency: currency,
      userEmail: session.user.email,
      userId: session.user.id,
      tier: tier
    };

    try {
      console.log("Attempting to create Coinbase charge (frontend) with requestBody:", paymentRequestBody);
      const response = await fetch("http://localhost:3001/api/create-coinbase-charge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentRequestBody),
      });

      console.log("Frontend: Received response from backend. Status:", response.status, "StatusText:", response.statusText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error("Frontend: Backend responded with an error:", errorData);
        } catch (e) {
          console.error("Frontend: Backend responded with an error, but couldn't parse JSON body:", await response.text());
        }
        throw new Error(errorData?.details || errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log("Frontend: Raw response text from backend:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Frontend: Failed to parse JSON from backend response text:", e, "Raw text was:", responseText);
        throw new Error("Failed to parse response from backend.");
      }

      console.log("Frontend: Parsed JSON data from backend:", data);

      if (data && data.hosted_url) {
        window.location.href = data.hosted_url;
      } else {
        console.error("Frontend: hosted_url not found in parsed data. Data was:", data);
        throw new Error("Hosted URL not found in response from backend.");
      }

    } catch (error) {
      console.error("Error creating Coinbase charge (frontend):", error);
      setPaymentError(error.message || "An unexpected error occurred during payment.");
    }
  };

  if (loadingAuthState || loadingProfile) {
    return <div className="loading-auth-container">Authenticating...</div>;
  }

  // If we reach here, loadingAuthState AND loadingProfile are BOTH false.
  if (!session) {
    return <LandingPage />;
  }

  return (
    <>
      <div
        className="app-container-authed"
        style={{
          height: '100vh',
          overflow: 'hidden'
        }}
      >
        {currentView === 'chat' && (
          <>
            {/* Kimi-Style Interface: Empty State vs Active Chat */}
            {messages.length === 0 ? (
              // Empty State - Centered Keisha Branding and Input
              <div className="chat-empty-state">
                <h1 className="keisha-branding">KEISHA</h1>
                <p className="keisha-subtitle">
                  The Counter-Racist Scholar - Ask me anything about dismantling white supremacy and systemic racism.
                </p>

                <div className="centered-input-container">
                  <input
                    className="centered-chat-input"
                    type="text"
                    placeholder={isAiThinking ? "Keisha is thinking..." : (loadingAuthState || !userProfile ? "Authenticating..." : "Ask Anything...")}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && inputValue.trim() !== '') {
                        handleSendMessage();
                      }
                    }}
                    disabled={isAiThinking || loadingAuthState || !userProfile}
                    ref={inputRef}
                  />
                  <button
                    className="centered-send-btn"
                    onClick={() => {
                      if (inputValue.trim() !== '') {
                        handleSendMessage();
                      }
                    }}
                    disabled={isAiThinking || !inputValue.trim() || loadingAuthState || !userProfile}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </div>

                {/* Suggestion Chips */}
                <div className="suggestion-chips">
                  <div className="suggestion-chip" onClick={() => setInputValue("What is white supremacy?")}>
                    What is white supremacy?
                  </div>
                  <div className="suggestion-chip" onClick={() => setInputValue("How does systemic racism work?")}>
                    How does systemic racism work?
                  </div>
                  <div className="suggestion-chip" onClick={() => setInputValue("Explain counter-racist strategies")}>
                    Explain counter-racist strategies
                  </div>
                </div>

                {/* Compact sidebar toggle for empty state */}
                <button
                  className="mobile-menu-button"
                  onClick={() => setPanelOpen(true)}
                  aria-label="Open menu"
                  style={{ position: 'fixed', top: '20px', left: '20px' }}
                >
                  <span style={{ fontSize: '24px', fontWeight: 'bold' }}>☰</span>
                </button>
              </div>
            ) : (
              // Active Chat State - Full Interface
              <div className="chat-active-state">
                <div className={panelOpen ? "side-panel compact" : "side-panel collapsed"}>
                  <button className="panel-toggle" onClick={() => setPanelOpen((open) => !open)}>
                    {panelOpen ? "←" : "☰"}
                  </button>
                  {panelOpen && (
                    <div className="side-panel-content">
                      <div className="conversation-history-section">
                        <h3>Conversations</h3>
                        <button className="new-chat-btn" onClick={handleNewChat}>+ New Chat</button>
                      </div>
                      <div className="options-section">
                        <hr />
                        <h3>Options</h3>
                        <ul className="options-list">
                          <li onClick={() => setCurrentView('settings')}>Settings</li>
                          <li onClick={handleSignOut}>Sign Out</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile hamburger menu button - only visible when panel is collapsed */}
                {!panelOpen && (
                  <button
                    className="mobile-menu-button"
                    onClick={() => setPanelOpen(true)}
                    aria-label="Open menu"
                  >
                    <span style={{ fontSize: '24px', fontWeight: 'bold' }}>☰</span>
                  </button>
                )}

                <div className="chat-main-area">
                  <div className="chat-box active">
                    <div className="chat-content">
                      {messages.map((msg, index) => {
                        if (!msg || typeof msg.id === 'undefined' || msg.id === null || typeof msg.text !== 'string' || typeof msg.sender !== 'string') {
                          console.error('Malformed message object at index:', index, msg);
                          return (
                            <div key={`error-${index}-${new Date().getTime()}`} className="message system error">
                              <p>Error: Corrupted message data. Please try again or contact support if this persists.</p>
                            </div>
                          );
                        }
                        return (
                          <div key={msg.id} className={`message ${msg.sender}`}>
                            <p>{msg.text}</p>
                          </div>
                        );
                      })}
                      {isAiThinking && (
                        <div className="ai-thinking">
                          <span>Keisha is thinking</span>
                          <div className="typing-indicator">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="input-container">
                      <input
                        className="chat-input"
                        type="text"
                        placeholder={isAiThinking ? "Keisha is thinking..." : (loadingAuthState || !userProfile ? "Authenticating..." : "Type your message to Keisha...")}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && inputValue.trim() !== '') {
                            handleSendMessage();
                          }
                        }}
                        disabled={isAiThinking || loadingAuthState || !userProfile}
                        ref={inputRef}
                      />
                      <button
                        className="send-btn"
                        onClick={() => {
                          if (inputValue.trim() !== '') {
                            handleSendMessage();
                          }
                        }}
                        disabled={isAiThinking || !inputValue.trim() || loadingAuthState || !userProfile}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      </button>
                    </div>
                    <p className="disclaimer-text">AI can make mistakes. Consider checking important information.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sidebar overlay for empty state */}
            {messages.length === 0 && panelOpen && (
              <div className="side-panel" style={{ position: 'fixed', left: 0, top: 0, zIndex: 1000 }}>
                <button className="panel-toggle" onClick={() => setPanelOpen(false)}>
                  ×
                </button>
                <div className="side-panel-content">
                  <div className="conversation-history-section">
                    <h3>Conversations</h3>
                    <button className="new-chat-btn" onClick={handleNewChat}>+ New Chat</button>
                  </div>
                  <div className="options-section">
                    <hr />
                    <h3>Options</h3>
                    <ul className="options-list">
                      <li onClick={() => setCurrentView('settings')}>Settings</li>
                      <li onClick={handleSignOut}>Sign Out</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {currentView === 'settings' && (
          <div className="settings-page-full-view">
            <div className="settings-header">
              <h2>Settings</h2>
              <button onClick={() => setCurrentView('chat')} className="close-settings-btn icon-btn">✕</button>
            </div>

            <div className="settings-section account-info">
              <h3>Account</h3>
              <p>Email: {session.user?.email}</p>
              <p>Current Plan: <span className="current-plan-badge">{userProfile ? userProfile.subscription_tier : 'Loading...'}</span></p>
              {userProfile && userProfile.subscription_tier !== 'Free' && userProfile.subscription_tier !== 'Gold' && userProfile.subscription_expires_at && (
                <p>Renews on: {new Date(userProfile.subscription_expires_at).toLocaleDateString()}</p>
              )}
              {userProfile && userProfile.subscription_tier === 'Free' && (
                <p>Messages today: {userProfile.message_count_today} / 10</p>
              )}
              <div className="support-info">
                <p className="beta-notice">Keisha AI is currently in Beta. We're continuously improving the experience based on your feedback.</p>
                <p>Have you discovered a bug or need assistance? <a href="mailto:abitofadviceconsulting@gmail.com" className="support-link">Contact our support team</a>.</p>
              </div>
            </div>

            <div className="settings-section subscription-section">
              <h3>Subscription Plans</h3>
              <div className="subscription-tiers-container">
                <div className="subscription-tier tier-free">
                  <h4>Free</h4>
                  <p className="tier-price">$0</p>
                  <ul className="tier-features">
                    <li>10 Uncensored Messages/Day</li>
                  </ul>
                  <button className="tier-button disabled-button" disabled>Current Plan</button>
                </div>

                <div className="subscription-tier tier-starter">
                  <h4>Starter</h4>
                  <p className="tier-price">$9<span className="price-period">/month</span></p>
                  <ul className="tier-features">
                    <li>Unlimited Uncensored Messages</li>
                  </ul>
                  <button className="tier-button" onClick={() => { setSelectedUpgradeTier('Starter'); setCurrentView('upgradeCheckout'); }}>Upgrade</button>
                </div>

                <div className="subscription-tier tier-pro">
                  <span className="best-value-badge">Annual Value</span>
                  <h4>Pro</h4>
                  <p className="tier-price">$59<span className="price-period">/year</span></p>
                  <ul className="tier-features">
                    <li>Unlimited Uncensored Messages</li>
                    <li>Save vs. Monthly!</li>
                  </ul>
                  <button className="tier-button" onClick={() => { setSelectedUpgradeTier('Pro'); setCurrentView('upgradeCheckout'); }}>Upgrade</button>
                </div>

                <div className="subscription-tier tier-gold">
                  <span className="best-value-badge">✨ Lifetime Deal! ✨</span>
                  <h4>Gold</h4>
                  <p className="tier-price">$99<span className="price-period"> one-time</span></p>
                  <ul className="tier-features">
                    <li>Unlimited Uncensored Messages</li>
                    <li>Lifetime Access</li>
                    <li>Early Access to New Features</li>
                  </ul>
                  <button className="tier-button tier-button-gold" onClick={() => { setSelectedUpgradeTier('Gold'); setCurrentView('upgradeCheckout'); }}>Go Gold!</button>
                </div>
              </div>
            </div>

            <div className="settings-section upcoming-features">
              <h3>Coming Soon!</h3>
              <p className="coming-soon-feature">📞 Voice Calling with Keisha</p>
            </div>

            <div className="settings-section payment-options">
              <h3>Payment Options</h3>
              <p>We Accept Bitcoin (via Coinbase on the upgrade page).</p>
              <div className="cash-app-payment">
                <h4>Pay with Cash App</h4>
                <div className="cash-app-container">
                  <img
                    src={process.env.PUBLIC_URL + '/2cashapp.png'}
                    alt="Keisha AI Cash App QR Code"
                    className="cash-app-qr"
                  />
                  <div className="cash-app-instructions">
                    <p><strong>1.</strong> Scan QR code with Cash App</p>
                    <p><strong>2.</strong> Send exact amount for your plan:</p>
                    <ul>
                      <li><strong>Starter:</strong> $15/month</li>
                      <li><strong>Pro:</strong> $75/year</li>
                      <li><strong>Gold:</strong> $150 (lifetime)</li>
                    </ul>
                    <p><strong>3.</strong> Include your email in payment note</p>
                    <p><strong>4.</strong> Account will update within 1 hour</p>
                  </div>
                </div>
                <p className="cash-app-id">Cash App ID: <strong>$KeishaAI</strong></p>
              </div>
            </div>

            <div className="settings-section sign-out-section">
              <button onClick={handleSignOut} className="auth-button sign-out-settings-btn">Sign Out</button>
            </div>
          </div>
        )}

        {currentView === 'upgradeCheckout' && selectedUpgradeTier && (
          <div className="upgrade-checkout-page-full-view settings-page-full-view">
            <div className="settings-header">
              <h2>Complete Your Upgrade to <span style={{ textTransform: 'capitalize' }}>{selectedUpgradeTier}</span></h2>
              <button
                onClick={() => { setCurrentView('settings'); setSelectedUpgradeTier(null); }}
                className="close-settings-btn icon-btn"
                title="Back to Settings"
              >
                ←
              </button>
            </div>

            <div className="settings-section upgrade-summary-section">
              <h3>Review Your Selection</h3>
              {selectedUpgradeTier === 'Starter' && (
                <>
                  <p><strong>Plan:</strong> Starter</p>
                  <p><strong>Price:</strong> $9 per month</p>
                  <p><strong>Features:</strong> Unlimited Uncensored Messages</p>
                </>
              )}
              {selectedUpgradeTier === 'Pro' && (
                <>
                  <p><strong>Plan:</strong> Pro</p>
                  <p><strong>Price:</strong> $59 per year</p>
                  <p><strong>Features:</strong> Unlimited Uncensored Messages, Save vs. Monthly!</p>
                </>
              )}
              {selectedUpgradeTier === 'Gold' && (
                <>
                  <p><strong>Plan:</strong> Gold (Lifetime)</p>
                  <p><strong>Price:</strong> $99 one-time payment</p>
                  <p><strong>Features:</strong> Unlimited Uncensored Messages, Lifetime Access, Early Access to New Features</p>
                </>
              )}
            </div>

            <div className="settings-section payment-details-section">
              <h3>Payment Information</h3>
              <p>To complete your <strong>{selectedUpgradeTier}</strong> subscription, please follow the instructions below:</p>
              <button onClick={() => handleUpgradePayment(selectedUpgradeTier)} className="tier-button">
                Proceed to Coinbase
              </button>
              {paymentError && <p className="auth-error-message">{paymentError}</p>}
            </div>

            <div className="settings-section confirmation-section">
              <p>Once payment is confirmed, your account will be upgraded. Thank you for choosing Keisha AI!</p>
              <button
                onClick={() => {
                  setCurrentView('settings');
                  setSelectedUpgradeTier(null);
                  setPaymentError('');
                }}
                className="tier-button secondary-tier-button"
              >
                Changed My Mind (Back to Settings)
              </button>
            </div>

          </div>
        )}

        {currentView === 'paymentSuccess' && (
          <div className="payment-result-page settings-page-full-view">
            <div className="settings-header">
              <h2>Payment Successful!</h2>
            </div>
            <div className="settings-section">
              <p>Thank you for your payment. Your upgrade is being processed.</p>
              <p>Your chat history and settings will reflect the new plan shortly.</p>
              {new URLSearchParams(window.location.search).get('chargeId') && (
                <p>Charge ID: {new URLSearchParams(window.location.search).get('chargeId')}</p>
              )}
              <button
                onClick={() => {
                  window.history.pushState({}, '', '/');
                  setCurrentView('chat');
                }}
                className="tier-button"
              >
                Go to Chat
              </button>
            </div>
          </div>
        )}

        {currentView === 'paymentCancelled' && (
          <div className="payment-result-page settings-page-full-view">
            <div className="settings-header">
              <h2>Payment Cancelled</h2>
            </div>
            <div className="settings-section">
              <p>Your payment process was cancelled. You have not been charged.</p>
              <button
                onClick={() => {
                  window.history.pushState({}, '', '/');
                  setCurrentView('settings');
                }}
                className="tier-button"
              >
                Back to Settings
              </button>
              {selectedUpgradeTier && (
                <button
                  onClick={() => {
                    window.history.pushState({}, '', '/');
                    setCurrentView('upgradeCheckout');
                  }}
                  className="tier-button secondary-tier-button"
                >
                  Try Again with {selectedUpgradeTier} Plan
                </button>
              )}
            </div>
          </div>
        )}

        {showPaywallModal && (
          <div className="paywall-modal">
            <div className="paywall-modal-content">
              <h2>Upgrade to Continue</h2>
              <p>You've reached your daily message limit for the free plan.</p>
              <p>Consider upgrading to one of our paid plans to continue chatting with Keisha.</p>
              <button onClick={() => setCurrentView('settings')}>Upgrade Now</button>
              <button onClick={() => setShowPaywallModal(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;