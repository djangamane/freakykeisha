import React, { useState } from "react";
import "./App.css";

function App() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [showLanding, setShowLanding] = useState(true);

  const handleStartChat = () => {
    setShowLanding(false);
  };

  return (
    <>
      {showLanding ? (
        // Landing Page
        <div className="landing-page">
          <div className="entry-box">
            <h2>Welcome to Keisha AI</h2>
            <p>Your personal AI companion for advice, conversation, and support.</p>
            <button onClick={handleStartChat}>Start Chatting</button>
          </div>
        </div>
      ) : (
        // Chat Interface
        <div className="chat-background">
          <div className={`side-panel${panelOpen ? " open" : ""}`}>
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
                  <li>Settings</li>
                  <li>Profile</li>
                  <li onClick={() => setShowLanding(true)}>Back to Welcome</li>
                </ul>
              </div>
            )}
          </div>
          <div className={`chat-box${panelOpen ? " with-panel" : ""}`}>
            <div className="chat-content">
              {/* Chat messages will appear here */}
            </div>
            <div className="input-container">
              <input
                className="chat-input"
                type="text"
                placeholder="Type your message..."
              />
              <button className="send-btn">Send</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;