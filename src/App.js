import React, { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';
import "./App.css";

// Use environment variables for Supabase credentials
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Supabase URL or Anon Key is missing. Make sure .env file is set up correctly with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY, and that you have restarted the development server.");
  // Optionally, render an error message to the user or halt app initialization
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const kb3ImageUrl = process.env.PUBLIC_URL + '/kb3.png';

function App() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [session, setSession] = useState(null); 
  const [loadingAuthState, setLoadingAuthState] = useState(true); 
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [authError, setAuthError] = useState(''); 
  const [authMessage, setAuthMessage] = useState(''); 
  const [currentView, setCurrentView] = useState('chat'); 
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState(null); 
  const [paymentError, setPaymentError] = useState(''); 
  const [userProfile, setUserProfile] = useState(null); 
  const [isAiThinking, setIsAiThinking] = useState(false); 
  const fetchingUserIdRef = useRef(null);
  const messagesEndRef = useRef(null);

  // New state for conversation history
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) {
      setUserProfile({
        subscription_tier: 'Free',
        message_count_today: 0,
        last_message_reset_at: null,
        subscription_expires_at: null,
        username: 'User'
      });
      fetchingUserIdRef.current = null;
      return;
    }

    if (fetchingUserIdRef.current === userId) {
      return; // Already fetching this user's profile
    }

    fetchingUserIdRef.current = userId;

    try {
      const { data, error, status } = await supabase
        .from('profiles')
        .select('subscription_tier, message_count_today, last_message_reset_at, subscription_expires_at, username, avatar_url, website, id') // Added id to profile
        .eq('id', userId)
        .single();

      if (error && status !== 406) { 
        console.error('Error fetching profile:', error);
        setUserProfile({ 
          subscription_tier: 'Free', 
          message_count_today: 0, 
          last_message_reset_at: null, 
          subscription_expires_at: null,
          username: 'User',
          id: userId // Store id even if fetch fails partially
        });
      } else if (data) {
        setUserProfile(data);
        console.log("User profile data loaded.");
      } else {
        setUserProfile({ 
          subscription_tier: 'Free', 
          message_count_today: 0, 
          last_message_reset_at: null, 
          subscription_expires_at: null,
          username: session?.user?.email || 'User', // Fallback username
          id: userId // Store id
        });
      }
    } catch (e) {
      console.error("Exception fetching profile:", e);
      setUserProfile({ 
        subscription_tier: 'Free', 
        message_count_today: 0, 
        last_message_reset_at: null, 
        subscription_expires_at: null,
        username: 'User',
        id: userId // Store id
      });
    } finally {
      fetchingUserIdRef.current = null;
    }
  }, []); // Empty dependency array makes fetchUserProfile stable

  // Function to fetch messages for a given session ID
  const fetchAndSetMessagesForSession = useCallback(async (sessionId) => {
    if (!sessionId) {
        setMessages([]);
        return;
    }
    // Optional: Add a loading state for messages if desired
    // setLoadingMessages(true);
    try {
        const { data: sessionMessagesData, error } = await supabase
            .from('messages')
            .select('id, user_prompt, ai_response, created_at, session_id')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages for session:', error);
            setMessages([]); // Clear messages on error
            return;
        }

        const loadedDisplayMessages = [];
        sessionMessagesData.forEach(msg => {
            if (msg.user_prompt) {
                loadedDisplayMessages.push({ 
                    id: `${msg.id}-user-${uuidv4()}`, // Ensure unique key
                    text: msg.user_prompt, 
                    sender: 'user',
                    timestamp: msg.created_at 
                });
            }
            if (msg.ai_response) {
                loadedDisplayMessages.push({ 
                    id: `${msg.id}-ai-${uuidv4()}`, // Ensure unique key
                    text: msg.ai_response, 
                    sender: 'ai',
                    timestamp: msg.created_at 
                });
            }
        });
        setMessages(loadedDisplayMessages);
    } catch (e) {
        console.error("Exception fetching messages:", e);
        setMessages([]);
    } finally {
        // setLoadingMessages(false);
    }
  }, []); // supabase is stable, no need to list as dep

  // Function to fetch conversation history
  const fetchConversationHistory = useCallback(async (userId) => {
    if (!userId) {
        setConversationHistory([]);
        return;
    }
    setIsLoadingConversations(true);
    try {
        const { data: allMessages, error } = await supabase
            .from('messages')
            .select('session_id, user_prompt, created_at')
            .eq('user_id', userId)
            .not('session_id', 'is', null)
            .order('created_at', { ascending: true }); // Get earliest messages first to pick first prompt

        if (error) {
            console.error('Error fetching conversation history:', error);
            setConversationHistory([]);
            return;
        }

        const sessionsMap = new Map();
        allMessages.forEach(msg => {
            if (msg.session_id && !sessionsMap.has(msg.session_id)) {
                sessionsMap.set(msg.session_id, {
                    id: msg.session_id,
                    title: msg.user_prompt.substring(0, 35) + (msg.user_prompt.length > 35 ? '...' : ''),
                    timestamp: msg.created_at 
                });
            }
        });

        const sortedHistory = Array.from(sessionsMap.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Show newest sessions first
        setConversationHistory(sortedHistory);

    } catch (e) {
        console.error("Exception fetching conversation history:", e);
        setConversationHistory([]);
    } finally {
        setIsLoadingConversations(false);
    }
  }, []); // supabase is stable

  useEffect(() => {
    setLoadingAuthState(true);
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        const currentPath = window.location.pathname; 
        const newUserId = session?.user?.id;
        const currentProfileUserId = userProfile?.id;

        if (_event === 'SIGNED_IN') {
          console.log("User signed in.");
          if (newUserId) {
            if (newUserId !== currentProfileUserId && fetchingUserIdRef.current !== newUserId) {
                fetchUserProfile(newUserId); 
            }
            fetchConversationHistory(newUserId); // Fetch history on sign in
          }
          if (currentPath !== '/payment-success' && currentPath !== '/payment-cancelled') {
            setCurrentView('chat'); 
          }
          // Reset messages and session ID only if user actually changes or it's a fresh sign-in
          if (!currentProfileUserId || (newUserId && newUserId !== currentProfileUserId)) {
             setMessages([]); 
             setCurrentSessionId(null); 
          }
        } else if (_event === 'SIGNED_OUT') {
          console.log("User signed out.");
          if (currentPath !== '/payment-success' && currentPath !== '/payment-cancelled') {
             setCurrentView('chat');
          }
          setMessages([]);
          setCurrentSessionId(null);
          setEmail(''); 
          setPassword(''); 
          setUserProfile(null); 
          setConversationHistory([]); // Clear history on sign out
        } else if (_event === 'USER_UPDATED') {
          // Handle user updates if necessary, e.g., email change confirmed
          if (session && session.user && session.user.id !== currentProfileUserId && fetchingUserIdRef.current !== session.user.id) {
            fetchUserProfile(session.user.id);
          }
        }
        
        // Path-based view changes, should ideally not interfere with auth state logic causing loops
        if (currentPath === '/payment-success' && currentView !== 'paymentSuccess') {
            setCurrentView('paymentSuccess');
        } else if (currentPath === '/payment-cancelled' && currentView !== 'paymentCancelled') {
            setCurrentView('paymentCancelled');
        } else if (!session && currentPath !== '/payment-success' && currentPath !== '/payment-cancelled' && currentView !== 'chat'){
             // If no session and not on payment pages, ensure view is chat (e.g. after logout and path change)
            setCurrentView('chat');
        }
        setLoadingAuthState(false);
      }
    );

    // Initial session check on mount
    supabase.auth.getSession().then(({ data: { session: initialSess } }) => { 
        if (initialSess && initialSess.user) {
            if (!userProfile || userProfile.id !== initialSess.user.id && fetchingUserIdRef.current !== initialSess.user.id) {
                fetchUserProfile(initialSess.user.id);
            } else {
                 setLoadingAuthState(false); // Already have profile for current session
            }
            fetchConversationHistory(initialSess.user.id); // Fetch history for initial session
        } else {
             setUserProfile(null); // Ensure profile is cleared if no initial session
             setConversationHistory([]); // Clear history if no initial session
             setLoadingAuthState(false); // No initial session
        }
    }).finally(() => setLoadingAuthState(false)); // General fallback

    return () => {
      authListener?.data?.subscription?.unsubscribe();
    };
  }, [fetchUserProfile, fetchConversationHistory, userProfile?.id]);

  // useEffect to fetch messages when currentSessionId changes
  useEffect(() => {
    if (currentSessionId && session?.user?.id) { 
        fetchAndSetMessagesForSession(currentSessionId);
    } else if (!currentSessionId) { // If session ID is explicitly nulled (e.g. new chat before first message)
        setMessages([]); 
    }
  }, [currentSessionId, session?.user?.id, fetchAndSetMessagesForSession]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !session) return;

    const userMessageContent = inputValue.trim();
    const newUserMessage = {
      id: uuidv4(),
      text: userMessageContent,
      sender: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputValue("");
    setIsAiThinking(true);

    // Determine current session ID for the API call
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
        activeSessionId = uuidv4();
        setCurrentSessionId(activeSessionId); 
    }

    const requestBody = {
      message: userMessageContent,
      model: "goekdenizguelmez/JOSIEFIED-Qwen3", 
      sessionId: activeSessionId, // Ensure activeSessionId is used
      userId: session.user.id, // Pass userId to backend
    };

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include Authorization header if your backend expects it for /api/chat
          // "Authorization": `Bearer ${session.access_token}` 
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let backendErrorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          backendErrorMsg = errorData.message || errorData.error || backendErrorMsg;
        } catch (e) {
          // Ignore if error response is not JSON
        }
        console.error("Backend error:", backendErrorMsg);
        // Revert optimistic update or show error message in chat
        setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== newUserMessage.id)); 
        setMessages((prevMessages) => [...prevMessages, {id: uuidv4(), text: `Error: ${backendErrorMsg}`, sender: 'ai', error: true}]);
        return;
      }

      const data = await response.json();
      const aiResponse = {
        id: data.aiMessageId || uuidv4(), 
        text: data.message, 
        sender: "ai",
        timestamp: new Date().toISOString(), 
      };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);

      // Refresh conversation history; a new message could mean a new session or an updated 'last active' time if sorting by that.
      // Since our titles are based on the first prompt, it primarily helps if a new session was created.
      fetchConversationHistory(session.user.id); 

    } catch (error) {
      console.error("Network or other error sending message:", error);
      setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== newUserMessage.id));
      setMessages((prevMessages) => [...prevMessages, {id: uuidv4(), text: `Error: ${error.message}`, sender: 'ai', error: true}]);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Handler for starting a new chat
  const handleNewChat = () => {
    // const newSessionId = uuidv4(); // No need to set here, handleSendMessage will if currentSessionId is null
    setCurrentSessionId(null); // Signal that it's a new chat, messages will clear via useEffect
    setMessages([]); // Explicitly clear messages for immediate UI feedback
    setInputValue('');
    // setPanelOpen(false); // Optional: close panel
  };

  // Handler for loading a selected conversation
  const handleLoadConversation = (sessionId) => {
    setCurrentSessionId(sessionId); // This will trigger the useEffect to fetch messages
    // setPanelOpen(false); // Optional: close panel
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError(''); // Clear previous errors
    setAuthMessage(''); // Clear previous messages
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) {
      setAuthError(error.message);
      console.error('Sign in error:', error.message);
    } else {
      // Sign in successful, onAuthStateChange will handle setting the session
      console.log('Sign in successful');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleUpgradePayment = async (tier) => {
    if (!session || !session.user) {
      console.error("User not signed in. Cannot proceed with payment.");
      setPaymentError("You must be signed in to make a payment.");
      return;
    }

    if (!tier) {
      console.error("No upgrade tier selected.");
      setPaymentError("No upgrade tier selected. Please go back and select a plan.");
      return;
    }
    setPaymentError(''); // Clear previous errors

    let amountUSD;
    let itemDescription;

    // Define your tier details here
    // IMPORTANT: Match these tier slugs with what you set in selectedUpgradeTier
    if (tier === 'Starter') { // Assuming 'Starter' is the value for selectedUpgradeTier
      amountUSD = 9.00; 
      itemDescription = 'Keisha AI - Starter Plan (Monthly)';
    } else if (tier === 'Pro') { // Assuming 'Pro' is the value for selectedUpgradeTier
      amountUSD = 59.00; 
      itemDescription = 'Keisha AI - Pro Plan (Annual)';
    } else if (tier === 'Gold') { // Assuming 'Gold' is the value for selectedUpgradeTier
      amountUSD = 99.00; 
      itemDescription = 'Keisha AI - Gold Plan (Lifetime Deal)';
    } else {
      console.error("Invalid tier selected:", tier);
      setPaymentError("Invalid subscription tier selected.");
      return;
    }

    const paymentRequestBody = {
      amountUSD: amountUSD, 
      itemDescription: itemDescription, 
      userEmail: session.user.email,
      userId: session.user.id,
      tier: tier 
    };

    try {
      console.log("Attempting to create Coinbase charge (frontend) with requestBody:", paymentRequestBody); // Log the request body
      const response = await fetch("http://localhost:3001/api/create-coinbase-charge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "Authorization": `Bearer ${session.access_token}`, // Uncomment if backend needs auth
        },
        body: JSON.stringify(paymentRequestBody),
      });

      console.log("Frontend: Received response from backend. Status:", response.status, "StatusText:", response.statusText); // Log status

      if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json(); // Try to parse error JSON
            console.error("Frontend: Backend responded with an error:", errorData);
        } catch (e) {
            console.error("Frontend: Backend responded with an error, but couldn't parse JSON body:", await response.text());
        }
        throw new Error(errorData?.details || errorData?.error || `HTTP error! status: ${response.status}`);
      }

      // IMPORTANT: Log the raw text first, then try to parse JSON
      const responseText = await response.text();
      console.log("Frontend: Raw response text from backend:", responseText);

      let data;
      try {
          data = JSON.parse(responseText); // Manually parse the logged text
      } catch (e) {
          console.error("Frontend: Failed to parse JSON from backend response text:", e, "Raw text was:", responseText);
          throw new Error("Failed to parse response from backend.");
      }
      
      console.log("Frontend: Parsed JSON data from backend:", data); // This is the critical log

      if (data && data.hosted_url) { // Check data AND data.hosted_url
        window.location.href = data.hosted_url; 
      } else {
        console.error("Frontend: hosted_url not found in parsed data. Data was:", data); // Log data if hosted_url is missing
        throw new Error("Hosted URL not found in response from backend.");
      }

    } catch (error) {
      console.error("Error creating Coinbase charge (frontend):", error);
      setPaymentError(error.message || "An unexpected error occurred during payment.");
    }
  };

  if (loadingAuthState) {
    return <div className="loading-auth">Loading authentication...</div>; 
  }

  if (!session) {
    return (
      <div className="landing-page"> 
        <div className="entry-box">
          <h2>Welcome to Keisha AI</h2>
          <p>Please sign in or sign up to continue.</p>
          <p className="disclaimer-text">
            By signing in or registering, you confirm that you are 18 years of age or older and agree to our terms of service.
          </p>
          <form className="auth-form">
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="auth-input"
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="auth-input"
            />
            {authError && <p className="auth-error-message">{authError}</p>}
            {authMessage && <p className="auth-message">{authMessage}</p>} 
            <div className="auth-buttons">
              <button type="submit" onClick={handleSignIn} className="auth-button sign-in-btn">Sign In</button>
              <button type="button" onClick={() => setCurrentView('signUp')} className="auth-button sign-up-btn">Register</button> 
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="app-container-authed"
      style={{ backgroundImage: `url(${kb3ImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center bottom', height: '100vh', overflow: 'hidden' }}
    >
      {currentView === 'chat' && (
        <>
          <div className={panelOpen ? "side-panel" : "side-panel collapsed"}>
            <button className="panel-toggle" onClick={() => setPanelOpen((open) => !open)}>
              {panelOpen ? "←" : "☰"}
            </button>
            {panelOpen && (
              <div className="panel-content">
                <h3>Conversations</h3>
                <button onClick={handleNewChat} className="new-chat-button">+ New Chat</button>
                {isLoadingConversations ? (
                  <p className="loading-conversations">Loading history...</p>
                ) : conversationHistory.length === 0 ? (
                  <p className="no-conversations">No past conversations.</p>
                ) : (
                  <ul className="conversation-list">
                    {conversationHistory.map((conv) => (
                      <li
                        key={conv.id}
                        className={`conversation-item ${conv.id === currentSessionId ? 'selected' : ''}`}
                        onClick={() => handleLoadConversation(conv.id)}
                      >
                        {conv.title}
                      </li>
                    ))}
                  </ul>
                )}
                <hr />
                <h3>Options</h3>
                <ul className="options-list">
                  <li onClick={() => setCurrentView('settings')}>Settings</li>
                  {/* Add Sign Out to side panel for consistency */}
                  <li onClick={handleSignOut}>Sign Out</li> 
                </ul>
              </div>
            )}
          </div>
          <div className="chat-box">
            <div className="chat-content">
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.sender}`}>
                  <p>{msg.text}</p>
                </div>
              ))}
              {isAiThinking && (
                <div className="message ai-message thinking-message">
                  <p className="message-text">Keisha is thinking...</p>
                </div>
              )}
              <div ref={messagesEndRef} /> {/* For auto-scrolling */}
            </div>
            <div className="input-container">
              <input
                className="chat-input"
                type="text"
                placeholder="Type your message to Keisha..."
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && inputValue.trim() !== '') {
                    handleSendMessage(); 
                  }
                }}
                disabled={!session || isAiThinking} // Disable if not logged in or AI is thinking (for later)
              />
              <button 
                className="send-btn" 
                onClick={() => { 
                  if (inputValue.trim() !== '') {
                    handleSendMessage(); 
                  }
                }}
                disabled={!session || !inputValue.trim() || isAiThinking}
              >
                Send
              </button>
            </div>
            <p className="disclaimer-text">AI can make mistakes. Consider checking important information.</p>
          </div>
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
            <p>
              <a 
                href="mailto:abitofadviceconsulting@gmail.com?subject=Cash App Payment Inquiry for Keisha AI&body=I'm interested in paying for a Keisha AI subscription via Cash App. Please provide instructions.%0A%0ADesired Plan (select one and include price):%0A- Starter (Monthly): $15%0A- Pro (Annual): $75%0A- Gold (Lifetime): $150%0A%0AMy Keisha AI Email: [Your Keisha AI Login Email]%0A%0APlease note: Manual Cash App payments may take up to 1 hour to reflect on your account after payment confirmation."
                target="_blank" 
                rel="noopener noreferrer"
                style={{color: '#f0f0f0', textDecoration: 'underline', fontWeight: 'bold'}}
              >
                **To Pay with Cash App: Send an Email Request**
              </a>
            </p>
            <p style={{fontSize: '0.85em', marginTop: '0.5em', color: '#ccc'}}>
              (Cash App Prices: Starter: $15/mo, Pro: $75/yr, Gold: $150/life. Please allow up to 1 hour for account update after manual payment confirmation.)
            </p>
          </div>

          <div className="settings-section sign-out-section">
            <button onClick={handleSignOut} className="auth-button sign-out-settings-btn">Sign Out</button>
          </div>
        </div>
      )}

      {currentView === 'upgradeCheckout' && selectedUpgradeTier && (
        <div className="upgrade-checkout-page-full-view settings-page-full-view"> {/* Re-use settings styles for now */}
          <div className="settings-header"> {/* Re-use header style */}
            <h2>Complete Your Upgrade to <span style={{textTransform: 'capitalize'}}>{selectedUpgradeTier}</span></h2>
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
                    setPaymentError(''); // Clear payment error on cancel
                }} 
                className="tier-button secondary-tier-button"
            >
                Changed My Mind (Back to Settings)
            </button>
          </div>

        </div>
      )}

      {currentView === 'paymentSuccess' && (
        <div className="payment-result-page settings-page-full-view"> {/* Reuse styling */}
          <div className="settings-header">
            <h2>Payment Successful!</h2>
          </div>
          <div className="settings-section">
            <p>Thank you for your payment. Your upgrade is being processed.</p>
            <p>Your chat history and settings will reflect the new plan shortly.</p>
            {/* Optional: Display Charge ID */}
            {new URLSearchParams(window.location.search).get('chargeId') && (
              <p>Charge ID: {new URLSearchParams(window.location.search).get('chargeId')}</p>
            )}
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/'); // Clean URL
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
        <div className="payment-result-page settings-page-full-view"> {/* Reuse styling */}
          <div className="settings-header">
            <h2>Payment Cancelled</h2>
          </div>
          <div className="settings-section">
            <p>Your payment process was cancelled. You have not been charged.</p>
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/'); // Clean URL
                setCurrentView('settings');
              }}
              className="tier-button"
            >
              Back to Settings
            </button>
            {selectedUpgradeTier && (
                 <button 
                    onClick={() => {
                        window.history.pushState({}, '', '/'); // Clean URL
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

    </div>
  );
}

export default App;