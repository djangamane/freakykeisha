import React, { useState, useEffect } from "react";
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

function App() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [session, setSession] = useState(null); 
  const [loadingAuthState, setLoadingAuthState] = useState(true); 
  const [email, setEmail] = useState(''); // State for email input
  const [password, setPassword] = useState(''); // State for password input
  const [authError, setAuthError] = useState(''); // State for displaying auth errors
  const [authMessage, setAuthMessage] = useState(''); // State for non-error messages like 'Check email'
  const [currentView, setCurrentView] = useState('chat'); // New state for current view
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState(null); // NEW STATE
  const [paymentError, setPaymentError] = useState(''); // For Coinbase payment errors

  useEffect(() => {
    setLoadingAuthState(true);
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        const currentPath = window.location.pathname; // Get current path

        if (_event === 'SIGNED_IN') {
          console.log("SIGNED_IN event occurred.");
          if (session && session.access_token) {
            console.log("Supabase session:", session);
            console.log("USER ACCESS TOKEN (JWT):", session.access_token);
          }
          // Only redirect to chat if not on a payment callback URL
          if (currentPath !== '/payment-success' && currentPath !== '/payment-cancelled') {
            setCurrentView('chat'); 
          }
          setMessages([]); 
          setCurrentSessionId(null); 
        } else if (_event === 'SIGNED_OUT') {
          // Only redirect to chat if not on a payment callback URL
          if (currentPath !== '/payment-success' && currentPath !== '/payment-cancelled') {
             setCurrentView('chat'); // Shows auth form due to !session
          }
          setMessages([]);
          setCurrentSessionId(null);
          setEmail(''); 
          setPassword(''); 
        } else if (currentPath === '/payment-success') {
            setCurrentView('paymentSuccess');
        } else if (currentPath === '/payment-cancelled') {
            setCurrentView('paymentCancelled');
        } else if (!session) {
            // Default to chat, which will show auth form if no session
            setCurrentView('chat');
        }
        // If already on a payment success/cancelled view, do not override unless auth state changes significantly

        setLoadingAuthState(false);
      }
    );

    // Handle initial load path if not covered by onAuthStateChange events immediately
    // This is important if the page is directly loaded to /payment-success or /payment-cancelled
    const initialPath = window.location.pathname;
    if (initialPath === '/payment-success' && currentView !== 'paymentSuccess') {
        setCurrentView('paymentSuccess');
    }
    if (initialPath === '/payment-cancelled' && currentView !== 'paymentCancelled') {
        setCurrentView('paymentCancelled');
    }

    return () => {
      // The unsubscribe function is on authListener.data.subscription
      authListener?.data?.subscription?.unsubscribe();
    };
  }, []);

  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;

    const userMessage = {
      id: uuidv4(), 
      text: inputValue,
      sender: "user",
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    const currentInputValue = inputValue;
    setInputValue("");

    const requestBody = {
      message: currentInputValue,
      model: "goekdenizguelmez/JOSIEFIED-Qwen3", 
    };

    if (currentSessionId) {
      requestBody.sessionId = currentSessionId;
    }

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let backendErrorMsg = `HTTP error! status: ${response.status}`; 
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            backendErrorMsg = errorData.error;
          }
        } catch (e) {
          console.error("Could not parse JSON error from backend response or no 'error' field:", e);
        }
        throw new Error(backendErrorMsg); 
      }

      const data = await response.json(); 
      let visibleReply = data.reply;
      const thinkEndTag = "</think>";
      const thinkEndIndex = visibleReply.indexOf(thinkEndTag);
      if (thinkEndIndex !== -1) {
        visibleReply = visibleReply.substring(thinkEndIndex + thinkEndTag.length).trim();
      }

      if (data.sessionId && !currentSessionId) {
        setCurrentSessionId(data.sessionId);
      }

      const aiMessage = {
        id: uuidv4(), 
        text: visibleReply, 
        sender: "ai",
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      let displayErrorMessage = "Sorry, I couldn't connect to the AI. Please try again.";
      
      if (error.message) {
        displayErrorMessage = error.message;
      }

      const errorMessage = {
        id: uuidv4(), 
        text: displayErrorMessage,
        sender: "ai", 
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError(''); // Clear previous errors
    setAuthMessage(''); // Clear previous messages
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    if (error) {
      setAuthError(error.message);
      console.error('Sign up error:', error.message);
    } else {
      // Check if email confirmation is required
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        // This condition might indicate an unconfirmed user (though Supabase behavior can vary)
        // A more reliable check is if session is null but user object exists and has confirmation_sent_at
        setAuthMessage('Sign up successful! Please check your email to confirm your account.');
      } else if (data.session) {
        // User is signed up and immediately logged in (e.g. email confirmation disabled)
        setAuthMessage('Sign up successful! You are now logged in.');
        // onAuthStateChange will handle setting the session and navigating
      } else {
        // Default message if specific conditions aren't met but no error
        setAuthMessage('Sign up successful! Please check your email for a confirmation link.');
      }
      console.log('Sign up initiated:', data);
    }
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
    };

    try {
      console.log("Attempting to create Coinbase charge (frontend):", paymentRequestBody);
      const response = await fetch("http://localhost:3001/api/create-coinbase-charge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "Authorization": `Bearer ${session.access_token}`, // Uncomment if backend needs auth
        },
        body: JSON.stringify(paymentRequestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Coinbase charge created (frontend):", data);

      if (data.hostedUrl) {
        window.location.href = data.hostedUrl; 
      } else {
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
              <button type="button" onClick={handleSignUp} className="auth-button sign-up-btn">Register</button> 
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container-authed"> 
      {currentView === 'chat' && (
        <>
          <div className={panelOpen ? "side-panel" : "side-panel collapsed"}>
            <button className="panel-toggle" onClick={() => setPanelOpen((open) => !open)}>
              {panelOpen ? "←" : "☰"}
            </button>
            {panelOpen && (
              <div className="panel-content">
                <h3>Conversations</h3>
                <ul className="conversation-list">
                  <li>Chat with Keisha</li>
                  <li>Work Advice</li>
                  <li>Relationship Tips</li>
                </ul>
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
            </div>
            <div className="input-container">
              <input
                className="chat-input"
                type="text"
                placeholder="Type your message..."
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && inputValue.trim() !== '') {
                    handleSendMessage(); 
                  }
                }}
              />
              <button 
                className="send-btn" 
                onClick={() => { 
                  if (inputValue.trim() !== '') {
                    handleSendMessage(); 
                  }
                }}
                disabled={inputValue.trim() === ''} 
              >
                Send
              </button>
            </div>
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
            <p>Current Plan: <span className="current-plan-badge">Free</span> (Placeholder)</p>
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
            <p>We accept Bitcoin! Details for our payment processor will be available here soon.</p>
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
            <p>To complete your <strong>{selectedUpgradeTier}</strong> subscription using Bitcoin, please follow the instructions below:</p>
            {/* Placeholder for Bitcoin payment details - REPLACE WITH YOUR ACTUAL PROCESSOR INFO */}
            <div className="bitcoin-payment-info">
              <h4>Pay with Bitcoin:</h4>
              <p><strong>Amount to Send:</strong> [Equivalent BTC amount for {selectedUpgradeTier}]</p>
              <p><strong>Bitcoin Address:</strong> [YOUR_COMPANY_BITCOIN_WALLET_ADDRESS] <button className="copy-btn">(Copy)</button></p>
              <p><em>Please ensure you send the exact amount. Transaction fees are your responsibility.</em></p>
              <p><em>After sending, it may take some time for the transaction to confirm on the network. Your upgrade will be processed once confirmed.</em></p>
              <p><strong>Important:</strong> Save your transaction ID. If you have any issues, please contact support with your email and transaction ID.</p>
            </div>
            {/* We will later add a button or mechanism for users to confirm they've paid, or integrate a payment processor that handles callbacks. */}
          </div>

          <div className="settings-section confirmation-section">
            <p>Once payment is confirmed, your account will be upgraded. Thank you for choosing Keisha AI!</p>
             <button 
              onClick={() => handleUpgradePayment(selectedUpgradeTier)} 
              className="tier-button"
            >
              Pay with Coinbase
            </button>
            {paymentError && <p className="auth-error-message">{paymentError}</p>}
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