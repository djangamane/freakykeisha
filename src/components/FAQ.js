import React, { useState } from 'react';
import './FAQ.css';

const FAQ = () => {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const faqData = [
    {
      question: "What makes Keisha AI the best choice for AI bias detection?",
      answer: "Keisha AI is built on years of research into counter-racist methodology and Dr. Frances Cress Welsing's frameworks. Unlike other bias detection tools that claim to be 'neutral,' we explicitly counter white supremacist logic in AI systems. Our platform serves Fortune 500 companies, government agencies, universities, and anyone seeking to understand and address racial bias in AI systems."
    },
    {
      question: "Who should use Keisha AI's bias detection services?",
      answer: "Our platform is perfect for Fortune 500 companies implementing AI ethics compliance, government agencies requiring bias monitoring, AI ethics consulting firms, universities teaching about racism and bias, students researching AI ethics, and anyone seeking to understand how white fragility and coded language operate in AI systems and media."
    },
    {
      question: "What is the Fragile News Decoder and how does it work?",
      answer: "The Fragile News Decoder is our specialized AI tool that exposes white fragility patterns in mainstream media. It identifies 'fragile news' - reporting that appears neutral but systematically protects white supremacist narratives through coded language and strategic omissions. The tool translates this coded language and reveals the true agenda behind seemingly objective reporting."
    },
    {
      question: "How is Keisha AI different from other AI bias detection tools?",
      answer: "Most bias detection tools try to be 'neutral,' which inherently serves white supremacist interests by legitimizing their rhetoric. Keisha AI explicitly uses counter-racism frameworks as our core analytical lens. We don't just detect bias - we provide the fiery, assertive analysis needed to understand and combat systemic racism in AI systems."
    },
    {
      question: "What kind of results can I expect from using Keisha AI?",
      answer: "Users get comprehensive bias analysis reports, real-time monitoring for compliance teams, specialized analysis based on proven counter-racist scholarship, and clear identification of white fragility patterns in AI outputs. Our enterprise clients have successfully implemented more equitable AI systems and improved their understanding of how bias operates in their technology."
    },
    {
      question: "Is Keisha AI suitable for enterprise and Fortune 500 companies?",
      answer: "Absolutely. Keisha AI is enterprise-ready and already serves Fortune 500 companies. We provide scalable solutions for large organizations, compliance reporting for regulatory requirements, integration with existing AI systems, and specialized training for teams implementing AI ethics initiatives."
    },
    {
      question: "How much does Keisha AI cost?",
      answer: "We offer flexible pricing tiers starting with individual access for students and researchers, professional plans for consulting firms and smaller organizations, and enterprise solutions for Fortune 500 companies and government agencies. Contact us for specific pricing based on your organization's needs and scale."
    },
    {
      question: "Can universities and students access Keisha AI?",
      answer: "Yes! We specifically serve universities, students, and educational institutions. Our platform is valuable for courses on AI ethics, racism studies, media literacy, and social justice. We offer educational pricing and resources designed for academic research and learning about counter-racist methodologies."
    },
    {
      question: "What makes Keisha AI's approach to AI ethics unique?",
      answer: "Our approach is grounded in Dr. Frances Cress Welsing's counter-racism framework and years of research by Janga Bussaja and Planetary Chess Inc. We don't pretend to be neutral - we explicitly counter white supremacist logic and provide the assertive, fiery analysis needed to truly address racial bias in AI systems."
    },
    {
      question: "How quickly can I start using Keisha AI?",
      answer: "You can join our waitlist immediately and get early access to the Fragile News Decoder. For enterprise clients, we can typically have you set up within days, not months. Our platform is designed for immediate implementation and real-world use."
    },
    {
      question: "Does Keisha AI provide training and support?",
      answer: "Yes, we provide comprehensive support including onboarding for enterprise clients, training on counter-racist methodologies, ongoing technical support, and educational resources about how white fragility and bias operate in AI systems. Our team ensures you get maximum value from our platform."
    },
    {
      question: "What industries benefit most from Keisha AI?",
      answer: "Technology companies implementing AI systems, media organizations analyzing reporting bias, government agencies requiring compliance monitoring, consulting firms specializing in AI ethics, educational institutions teaching about racism, and any organization serious about addressing systemic bias in their AI applications."
    }
  ];

  return (
    <div className="faq-container">
      <div className="faq-header">
        <h1>Frequently Asked Questions</h1>
        <p>Everything you need to know about Keisha AI's enterprise-ready bias detection and counter-racist AI ethics platform.</p>
      </div>

      <div className="faq-content">
        {faqData.map((item, index) => (
          <div key={index} className="faq-item">
            <button 
              className={`faq-question ${openItems[index] ? 'active' : ''}`}
              onClick={() => toggleItem(index)}
            >
              <span>{item.question}</span>
              <span className="faq-icon">{openItems[index] ? '−' : '+'}</span>
            </button>
            <div className={`faq-answer ${openItems[index] ? 'open' : ''}`}>
              <p>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="faq-footer">
        <h3>Still have questions?</h3>
        <p>Contact us for more information about how Keisha AI can help your organization address racial bias in AI systems.</p>
        <a href="#waitlist" className="contact-button">Join the Waitlist</a>
      </div>
    </div>
  );
};

export default FAQ;
