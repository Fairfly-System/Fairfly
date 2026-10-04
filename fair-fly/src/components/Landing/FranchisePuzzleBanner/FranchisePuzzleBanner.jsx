import React from 'react';
import './franchise-puzzle-banner.css';
import PuzzleHouse from './PuzzleHouse';

/**
 * FranchisePuzzleBanner
 * Matches the iconic Fairfly Franchise Business Offer card aesthetic:
 * - Brand logo & 'travel & tours'
 * - 'Franchise business offer' bold header
 * - 'The best option to start your travel agency business' stylish script
 * - 3D Puzzle House illustration representing interlocking business pillars
 */
export default function FranchisePuzzleBanner({ onApplyClick }) {
  return (
    <div className="franchise-puzzle-card">
      {/* Decorative subtle ambient backdrop accents */}
      <div className="puzzle-card-glow-bg" />
      
      <div className="puzzle-card-grid">
        
        {/* Left Column: Brand, Title & Tagline matching the photo */}
        <div className="puzzle-card-left">
          
          {/* Logo & Brand Header */}
          <div className="puzzle-brand-header">
            <div className="puzzle-brand-logo-wrap">
              <img
                src="/FairflyLogo.png"
                alt="Fairfly Travel & Tours Logo"
                className="puzzle-brand-logo-img"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="puzzle-brand-text-block">
                <div className="puzzle-brand-main">
                  <span className="brand-fair">fair</span>
                  <span className="brand-fly">fly</span>
                </div>
                <div className="puzzle-brand-sub">travel &amp; tours</div>
              </div>
            </div>
          </div>

          {/* Bold Orange Business Offer Headline */}
          <div className="puzzle-headline-block">
            <h2 className="puzzle-main-headline">
              Franchise business offer
            </h2>
            <p className="puzzle-script-tagline">
              The best option to start your travel agency business
            </p>
          </div>

          {/* Value Bullet Points / Feature Badges */}
          <div className="puzzle-features-grid">
            <div className="puzzle-feat-pill">
              <i className="fa-solid fa-puzzle-piece feat-icon-orange"></i>
              <span>Turnkey Cloud Setup</span>
            </div>
            <div className="puzzle-feat-pill">
              <i className="fa-solid fa-box-open feat-icon-green"></i>
              <span>Zero Inventory Risk</span>
            </div>
            <div className="puzzle-feat-pill">
              <i className="fa-solid fa-certificate feat-icon-yellow"></i>
              <span>ISO 9001:2000 System</span>
            </div>
            <div className="puzzle-feat-pill">
              <i className="fa-solid fa-graduation-cap feat-icon-purple"></i>
              <span>2-Month Fast Track</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="puzzle-action-row">
            <button
              type="button"
              className="btn-puzzle-apply"
              onClick={onApplyClick}
            >
              <i className="fa-solid fa-suitcase"></i>
              <span>Apply for Franchise</span>
            </button>
            <a href="#business-system" className="btn-puzzle-explore">
              <i className="fa-solid fa-circle-info"></i>
              <span>Explore System</span>
            </a>
          </div>

          <p className="puzzle-hint-text">
            <i className="fa-regular fa-hand-pointer"></i> Hover or tap puzzle pieces on the house to explore each business pillar!
          </p>
        </div>

        {/* Right Column: 3D Puzzle House Graphic */}
        <div className="puzzle-card-right">
          <PuzzleHouse onPieceClick={onApplyClick} />
        </div>

      </div>
    </div>
  );
}
