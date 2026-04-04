import React from 'react';
import { Link } from 'react-router-dom';
import { LandingNav } from '../components/layout/LandingNav';
import { LandingFooter } from '../components/layout/LandingFooter';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export const LandingPage = () => {
  useScrollAnimation('.animate-fade-in-up');

  return (
    <>
      <LandingNav />
      <main>
        {/* ── Hero ── */}
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-bg" aria-hidden="true">
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>
          </div>
          <div className="hero-content">
            <h1 id="hero-heading">Your community becomes<br /><em>your credit score.</em></h1>
            <p>TrustChain is a lending platform where identity, behaviour, and community guarantees unlock fair loans for people without traditional credit histories.</p>
            <div className="hero-actions">
              <Link to="/app/dashboard" className="btn btn-primary btn-lg">Launch App</Link>
              <a href="#how-it-works" className="btn btn-ghost btn-lg">
                See how it works
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 3v10M3 8l5 5 5-5"/></svg>
              </a>
            </div>
            <div className="hero-trust-row" aria-label="Platform trust indicators">
              <div className="hero-trust-item">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 1L2 4v5c0 3.5 2.5 6.5 6 7 3.5-.5 6-3.5 6-7V4L8 1z"/></svg>
                <span>End-to-end encrypted</span>
              </div>
              <div className="hero-trust-item">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="M5.5 8.5l2 2 3-4"/></svg>
                <span>Verified community lenders</span>
              </div>
              <div className="hero-trust-item">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="5" width="12" height="9" rx="2"/><path d="M5 5V3.5A3 3 0 0111 3.5V5"/></svg>
                <span>No collateral required</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Benefits ── */}
        <section className="benefits" aria-labelledby="benefits-heading">
          <div className="section-header">
            <h2 id="benefits-heading">Built for real people, not paperwork</h2>
            <p>We believe credit should reflect who you are, not just your bank balance.</p>
          </div>
          <div className="benefits-grid">
            <div className="benefit-card animate-fade-in-up stagger-1" style={{ opacity: 0, transform: 'translateY(28px)' }}>
              <div className="benefit-icon" aria-hidden="true">
                <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 14c0-3.86 3.14-7 7-7s7 3.14 7 7-3.14 7-7 7"/>
                  <path d="M7 14H3M14 7V3M3 7l3.5 3.5M3 21l3.5-3.5"/>
                  <circle cx="14" cy="14" r="3"/>
                </svg>
              </div>
              <h3>Built for gig workers &amp; small businesses</h3>
              <p>Delivery riders, street vendors, freelancers — anyone with a community and a phone can get started today. No formal employment letter needed.</p>
            </div>
            <div className="benefit-card animate-fade-in-up stagger-2" style={{ opacity: 0, transform: 'translateY(28px)' }}>
              <div className="benefit-icon" aria-hidden="true">
                <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="14" cy="14" r="10" strokeDasharray="3 2"/>
                  <circle cx="14" cy="14" r="4"/>
                  <path d="M14 4v4M14 20v4M4 14h4M20 14h4"/>
                </svg>
              </div>
              <h3>Transparent, explainable Trust Score</h3>
              <p>Your Trust Level is calculated from real behaviours — repayments, pod strength, verified identity — and we always explain exactly how it was calculated.</p>
            </div>
            <div className="benefit-card animate-fade-in-up stagger-3" style={{ opacity: 0, transform: 'translateY(28px)' }}>
              <div className="benefit-icon" aria-hidden="true">
                <svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="10" r="3"/>
                  <circle cx="19" cy="10" r="3"/>
                  <circle cx="14" cy="7" r="2"/>
                  <path d="M3 22c0-4 2.7-7 6-7h2M19 15h2c3.3 0 6 3 6 7M10 22c0-2.8 1.8-5 4-5s4 2.2 4 5"/>
                </svg>
              </div>
              <h3>Community-backed loans, not collateral</h3>
              <p>Join a Community Pod. When your group vouches for you, it reduces your risk — making loans cheaper and more accessible for everyone.</p>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="how-it-works" id="how-it-works" aria-labelledby="how-heading">
          <div className="how-it-works-inner">
            <div className="section-header">
              <h2 id="how-heading">Three simple steps to your first loan</h2>
              <p>From sign-up to funds in your account — it's designed to be simple.</p>
            </div>
            <div className="steps-grid">
              <div className="step-card animate-fade-in-up stagger-1" style={{ opacity: 0, transform: 'translateY(28px)' }}>
                <div className="step-number" aria-hidden="true">1</div>
                <h3>Verify your identity</h3>
                <p>Connect your phone number, gig platform account, or NGO verification. We only ask for what's needed to keep your community safe.</p>
              </div>
              <div className="step-card animate-fade-in-up stagger-2" style={{ opacity: 0, transform: 'translateY(28px)' }}>
                <div className="step-number" aria-hidden="true">2</div>
                <h3>Join a Community Pod</h3>
                <p>Group up with 3–8 people you trust. Your pod's collective strength reduces individual risk and unlocks better rates for everyone.</p>
              </div>
              <div className="step-card animate-fade-in-up stagger-3" style={{ opacity: 0, transform: 'translateY(28px)' }}>
                <div className="step-number" aria-hidden="true">3</div>
                <h3>Request your first loan</h3>
                <p>Pick your amount, purpose, and duration. Your Trust Score and pod guarantee determine your personalised rate — explained clearly.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta-section" aria-labelledby="cta-heading">
          <div className="cta-banner">
            <h2 id="cta-heading">Ready to build your Trust Level?</h2>
            <p>Join thousands of gig workers and small merchants who are already unlocking fair credit through their community.</p>
            <Link to="/app/dashboard" className="btn btn-primary" style={{ background: 'var(--color-surface)', color: 'var(--color-primary)' }}>
              Get started — it's free
            </Link>
          </div>
        </section>
      </main>
      <LandingFooter />
    </>
  );
};
