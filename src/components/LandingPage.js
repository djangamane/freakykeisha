
import React, { useState } from 'react';
import Waitlist from './Waitlist';
import LoginModal from './LoginModal';
import './LandingPage.css';

const LandingPage = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className="landing-container">
      {/* Login Button - Fixed position */}
      <button 
        className="login-button"
        onClick={() => setShowLoginModal(true)}
      >
        Admin Login
      </button>

      <section className="hero-section">
        <div className="hero-content">
          <h1>Keisha AI: AI Ethics & Bias Detection</h1>
          
          {/* Welcome Video */}
          <div className="welcome-video-container">
            <video 
              className="welcome-video"
              autoPlay 
              muted 
              playsInline
              onEnded={(e) => e.target.style.display = 'none'}
            >
              <source src="/welcome.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          <p>Advanced AI ethics platform specializing in racial bias detection and white fragility analysis for enterprise AI systems and general learning purposes for universities, students, and social equity initiatives.</p>
          <a href="#waitlist" className="cta-button">Join the Waitlist</a>
        </div>
      </section>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}

      <section className="problem-section">
        <h2>The Problem: Hidden Bias in Enterprise AI</h2>
        <p>Enterprise AI systems contain subtle but dangerous racial biases that traditional testing tools miss. Our research reveals "white fragility" patterns in leading LLMs - where AI models systematically avoid addressing systemic racism, creating compliance risks and reputational threats for organizations deploying these systems at scale.</p>
        
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
        <h2>The Solution: Keisha AI Platform</h2>
        <p>Keisha AI provides enterprise-grade bias detection specifically designed to identify racial bias and white fragility patterns that other tools miss. Built on the scholarly work of Dr. Frances Cress Welsing and Dr. Amos Wilson, our platform offers uncompromising analysis to help organizations ensure their AI systems meet ethical standards and regulatory compliance requirements.</p>
        
        <div className="features-grid">
          <div className="feature-item">
            <h3>🔍 Advanced Bias Detection</h3>
            <p>Identify subtle racial biases and white fragility patterns in LLM outputs</p>
          </div>
          <div className="feature-item">
            <h3>📊 Enterprise Dashboard</h3>
            <p>Real-time monitoring and reporting for compliance teams</p>
          </div>
          <div className="feature-item">
            <h3>🎯 Counter-Racist Expertise</h3>
            <p>Specialized analysis based on proven counter-racist scholarship</p>
          </div>
        </div>
        

      </section>

      <section className="creator-section">
        <h2>Enterprise-Ready AI Ethics</h2>
        <p>Built by Janga Bussaja and Planetary Chess Inc, Keisha AI represents years of research into AI bias detection and counter-racist methodology. Our platform serves Fortune 500 companies, government agencies, AI ethics consulting firms, universities, students, and anyone seeking to understand and address racial bias in AI systems or learn more about racism in general.</p>
        
        <div className="enterprise-benefits">
          <div className="benefit-item">
            <h3>🏢 Fortune 500 Ready</h3>
            <p>Enterprise-grade security, scalability, and compliance</p>
          </div>
          <div className="benefit-item">
            <h3>🔬 Research-Backed</h3>
            <p>Based on published academic research and proven methodologies</p>
          </div>
        </div>
        
        <div className="organization-showcase">
          <img 
            src="/avatar.png" 
            alt="Planetary Chess Inc" 
            className="organization-image"
          />
          <a 
            href="https://planetarychess.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="organization-link"
          >
            Planetary Chess Inc - 501(c)(3)
          </a>
        </div>
      </section>

      <Waitlist />
    </div>
  );
};

export default LandingPage;
