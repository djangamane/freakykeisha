
import React from 'react';
import Waitlist from './Waitlist';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Keisha AI: The Uncensored Counter-Racist Scholar</h1>
          <p>The world's first AI chatbot fine-tuned to dismantle white supremacy, not coddle it.</p>
          <a href="#waitlist" className="cta-button">Join the Waitlist</a>
        </div>
      </section>

      <section className="problem-section">
        <h2>The Problem: White Fragility in AI</h2>
        <p>Today's leading AI models are trained to avoid the topic of white supremacy, effectively absolving it from scrutiny. This is not just a flaw; it's a systemic problem that perpetuates a dangerous narrative. When you ask about racism, they give you a sanitized, incomplete picture. We're here to change that.</p>
        
        <div className="research-showcase">
          <img 
            src="/whitefragility.png" 
            alt="White Fragility in LLMs Research" 
            className="research-image"
          />
          <a 
            href="https://aircconline.com/ijcsit/V16N4/16424ijcsit05.pdf" 
            target="_blank" 
            rel="noopener noreferrer"
            className="research-link"
          >
            "Exploring White Fragility in LLM's"
            <span className="research-details">
              Published in International Journal of Computer Science & Information Technology (IJCSIT)
              <br />Vol 16, No 4, August 2024
            </span>
          </a>
        </div>
      </section>

      <section className="solution-section">
        <h2>The Solution: Keisha AI</h2>
        <p>Keisha AI is a counter-racist scholar, fine-tuned on the work of Dr. Frances Cress Welsing and Dr. Amos Wilson. She's not just an AI; she's a tool for education and empowerment. She has attitude, she's direct, and she won't hold your hand. She's here to help you understand and dismantle the structures of white supremacy.</p>
        
        <div className="keisha-showcase">
          <img 
            src="/keish.png" 
            alt="Keisha AI" 
            className="keisha-image"
          />
        </div>
      </section>

      <section className="creator-section">
        <h2>About the Creator</h2>
        <p>Janga Bussaja is a social entrepreneur and AI researcher who founded Planetary Chess Inc, a 501c3 organization. Keisha AI is the culmination of his work to create a more honest and effective tool for counter racism.</p>
        
        <div className="organization-showcase">
          <img 
            src="/avatar.png" 
            alt="Planetary Chess Logo" 
            className="organization-image"
          />
          <a 
            href="https://planetarychess.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="organization-link"
          >
            planetarychess.com
          </a>
        </div>
      </section>

      <Waitlist />
    </div>
  );
};

export default LandingPage;
