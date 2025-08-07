import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './LandingPage.css'; // Reuse the same styling

const PricingPage = () => {
  const navigate = useNavigate();

  const handlePayment = async (tier, paymentMethod) => {
    // Define pricing based on tier and payment method
    const pricing = {
      monthly: {
        bitcoin: { amount: 10, currency: 'USD' },
        cashapp: { amount: 20, currency: 'USD' }
      },
      annual: {
        bitcoin: { amount: 100, currency: 'USD' },
        cashapp: { amount: 150, currency: 'USD' }
      }
    };

    const selectedPricing = pricing[tier][paymentMethod];
    
    if (!selectedPricing) {
      console.error('Invalid pricing configuration');
      return;
    }

    // For now, we'll integrate with the existing payment infrastructure
    // This will be connected to the backend payment endpoints later
    const paymentData = {
      tier: tier,
      paymentMethod: paymentMethod,
      amount: selectedPricing.amount,
      currency: selectedPricing.currency,
      service: 'bias-detection'
    };

    console.log('Payment initiated:', paymentData);
    
    // Navigate to bias detection app after payment (for demo purposes)
    // In production, this would handle actual payment processing
    navigate('/bias-detection');
  };

  const handleFreeStart = () => {
    // Navigate directly to bias detection app for free tier
    navigate('/bias-detection');
  };
  return (
    <div className="landing-container">
      {/* Navigation Header */}
      <nav className="navigation-header">
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/bias-detection" className="nav-link">BS Article Bias-Detection</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Pricing</h1>
          <p>Choose the right AI ethics solution for your needs</p>
        </div>
      </div>

      {/* Pricing Container */}
      <div className="pricing-container">
        {/* Keisha AI Main Service Section */}
        <section className="keisha-ai-pricing">
          <h2>Keisha AI</h2>
          <p>Advanced AI ethics platform for enterprise bias detection and white fragility analysis</p>
          <div className="waitlist-cta">
            <h3>Coming Soon</h3>
            <p>Join our waitlist to be the first to access our comprehensive AI ethics platform</p>
            <a href="/#waitlist" className="cta-button">Join the Waitlist</a>
          </div>
        </section>

        {/* Keisha News Micro-SaaS Section */}
        <section className="keisha-news-pricing">
          <h2>Keisha News</h2>
          <p>News article bias detection service - Available now</p>
          <div className="pricing-tiers">
            {/* Free Tier */}
            <div className="tier-free">
              <h3>Free</h3>
              <div className="tier-price">$0</div>
              <div className="tier-usage">3 uses per day</div>
              <ul className="tier-features">
                <li>Basic bias detection</li>
                <li>IP-based tracking</li>
                <li>Daily usage reset</li>
              </ul>
              <button className="tier-button free-tier-btn" onClick={handleFreeStart}>
                Get Started Free
              </button>
            </div>

            {/* Monthly Tier */}
            <div className="tier-monthly">
              <h3>Monthly</h3>
              <div className="tier-pricing-options">
                <div className="bitcoin-price recommended">
                  <span className="price-label">💰 Bitcoin Payment</span>
                  <div className="tier-price">$10/month</div>
                  <span className="price-incentive">50% OFF - Best Value!</span>
                  <div className="savings-highlight">Save $10/month vs Cash App</div>
                </div>
                <div className="cashapp-price">
                  <span className="price-label">💳 Cash App Payment</span>
                  <div className="tier-price">$20/month</div>
                  <div className="standard-price">Standard Rate</div>
                </div>
              </div>
              <div className="tier-usage">10 uses per day</div>
              <div className="usage-details">
                <span className="usage-comparison">vs 3 free daily uses</span>
              </div>
              <ul className="tier-features">
                <li>Advanced bias detection</li>
                <li>User account & history</li>
                <li>Priority support</li>
                <li>Detailed analysis reports</li>
                <li>Email notifications</li>
              </ul>
              <div className="payment-buttons">
                <button 
                  className="tier-button bitcoin-btn" 
                  onClick={() => handlePayment('monthly', 'bitcoin')}
                >
                  Pay with Bitcoin - $10/mo
                </button>
                <button 
                  className="tier-button cashapp-btn" 
                  onClick={() => handlePayment('monthly', 'cashapp')}
                >
                  Pay with Cash App - $20/mo
                </button>
              </div>
            </div>

            {/* Annual Tier */}
            <div className="tier-annual">
              <h3>Annual</h3>
              <div className="tier-pricing-options">
                <div className="bitcoin-price recommended">
                  <span className="price-label">💰 Bitcoin Payment</span>
                  <div className="tier-price">$100/year</div>
                  <span className="price-incentive">33% OFF - Maximum Savings!</span>
                  <div className="savings-highlight">
                    Save $50/year vs Cash App<br/>
                    Save $140/year vs monthly Bitcoin
                  </div>
                </div>
                <div className="cashapp-price">
                  <span className="price-label">💳 Cash App Payment</span>
                  <div className="tier-price">$150/year</div>
                  <div className="savings-note">Save $90/year vs monthly Cash App</div>
                </div>
              </div>
              <div className="tier-usage">Unlimited uses</div>
              <div className="usage-details">
                <span className="usage-comparison">No daily limits</span>
              </div>
              <ul className="tier-features">
                <li>Unlimited bias detection</li>
                <li>Premium analysis features</li>
                <li>Priority support</li>
                <li>Export capabilities</li>
                <li>API access</li>
                <li>Advanced reporting</li>
                <li>White-label options</li>
              </ul>
              <div className="payment-buttons">
                <button 
                  className="tier-button bitcoin-btn" 
                  onClick={() => handlePayment('annual', 'bitcoin')}
                >
                  Pay with Bitcoin - $100/year
                </button>
                <button 
                  className="tier-button cashapp-btn" 
                  onClick={() => handlePayment('annual', 'cashapp')}
                >
                  Pay with Cash App - $150/year
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PricingPage;