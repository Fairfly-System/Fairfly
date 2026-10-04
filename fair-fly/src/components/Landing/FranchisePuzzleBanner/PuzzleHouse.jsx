import React, { useState } from 'react';
import './puzzle-house.css';

/**
 * 3D Jigsaw Puzzle House Component
 * Represents the modular, turnkey Fairfly Franchise Business System.
 * Each interlocking piece represents a foundational pillar of the business.
 */
export default function PuzzleHouse({ onPieceClick, activePillar }) {
  const [hoveredPiece, setHoveredPiece] = useState(null);

  const pieces = {
    roof: {
      id: 'roof',
      title: 'ISO: 9001-2000 Ready System',
      badge: 'Quality Standard',
      color: '#EAB308',
      desc: 'Standardized operational procedures that guarantee high service quality and zero customer friction.'
    },
    chimney: {
      id: 'chimney',
      title: 'Head Office Brand Power',
      badge: 'Operational Backup',
      color: '#EF4444',
      desc: 'Marketing leverage, authorized agency credentials, and centralized ticketing issuance.'
    },
    blueWall: {
      id: 'blueWall',
      title: '100% Cloud Virtual Office',
      badge: 'Modern Technology',
      color: '#0284C7',
      desc: 'Anywhere access to ticketing, client tracking, and automated document generation.'
    },
    purpleWall: {
      id: 'purpleWall',
      title: '2-Month Fast-Track Academy',
      badge: '29 Yrs Experience Transfer',
      color: '#8B5CF6',
      desc: 'Master the travel and documentation business in just 60 days with complete mentorship.'
    },
    greenBase: {
      id: 'greenBase',
      title: 'Zero Physical Inventory',
      badge: 'Asset-Light',
      color: '#84CC16',
      desc: 'No warehouse rent, no expiring merchandise, no locked capital. 100% service-based.'
    },
    orangeBase: {
      id: 'orangeBase',
      title: 'Cash-Basis Upfront Profit',
      badge: 'High Margin',
      color: '#F97316',
      desc: 'Clients pay before booking execution, ensuring steady positive cash flow and zero bad debt.'
    }
  };

  const currentInfo = hoveredPiece ? pieces[hoveredPiece] : null;

  return (
    <div className="puzzle-house-wrapper">
      <div className="puzzle-house-stage">
        <svg
          viewBox="0 0 540 520"
          className="puzzle-house-svg"
          aria-label="Fairfly Franchise Puzzle House Illustration"
        >
          <defs>
            {/* Filter for 3D Specular and Soft Drop Shadows */}
            <filter id="puzzle-shadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.18" />
            </filter>
            
            <filter id="puzzle-hover-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#F97316" floodOpacity="0.4" />
            </filter>

            {/* Linear and Radial Gradients for 3D Glossy Finish */}
            {/* 1. Yellow Roof */}
            <linearGradient id="grad-roof" x1="0%" y1="0%" x2="40%" y2="100%">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="35%" stopColor="#FACC15" />
              <stop offset="85%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>

            {/* 2. Red Chimney */}
            <linearGradient id="grad-chimney" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="40%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>

            {/* 3. Blue Piece */}
            <linearGradient id="grad-blue" x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="40%" stopColor="#0284C7" />
              <stop offset="85%" stopColor="#0369A1" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>

            {/* 4. Purple Piece */}
            <linearGradient id="grad-purple" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#C084FC" />
              <stop offset="40%" stopColor="#8B5CF6" />
              <stop offset="85%" stopColor="#6D28D9" />
              <stop offset="100%" stopColor="#4C1D95" />
            </linearGradient>

            {/* 5. Green Piece */}
            <linearGradient id="grad-green" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#BEF264" />
              <stop offset="35%" stopColor="#84CC16" />
              <stop offset="85%" stopColor="#65A30D" />
              <stop offset="100%" stopColor="#365314" />
            </linearGradient>

            {/* 6. Orange Piece */}
            <linearGradient id="grad-orange" x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stopColor="#FDBA74" />
              <stop offset="35%" stopColor="#FB923C" />
              <stop offset="75%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#9A3412" />
            </linearGradient>

            {/* Reflection Gradient Mask */}
            <linearGradient id="reflection-mask-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            <mask id="reflection-mask">
              <rect x="0" y="420" width="540" height="100" fill="url(#reflection-mask-grad)" />
            </mask>
          </defs>

          {/* Ground Mirror Reflection & Floor Shadow */}
          <g className="puzzle-ground-shadow">
            <ellipse cx="270" cy="425" rx="200" ry="18" fill="rgba(15, 23, 42, 0.14)" />
            <ellipse cx="270" cy="425" rx="140" ry="9" fill="rgba(15, 23, 42, 0.22)" />
          </g>

          {/* Mirrored Reflection Group */}
          <g
            transform="translate(0, 842) scale(1, -0.65)"
            mask="url(#reflection-mask)"
            opacity="0.55"
            style={{ filter: 'blur(2px)' }}
          >
            {/* Mirror Chimney */}
            <rect x="365" y="40" width="48" height="110" rx="4" fill="url(#grad-chimney)" />
            {/* Mirror Roof */}
            <polygon points="270,60 365,150 295,150 240,110" fill="url(#grad-roof)" />
            {/* Mirror Blue */}
            <polygon points="270,60 60,250 110,250 110,335 250,335 250,250 270,200" fill="url(#grad-blue)" />
            {/* Mirror Purple */}
            <polygon points="270,60 480,250 430,250 430,335 250,335 270,200" fill="url(#grad-purple)" />
            {/* Mirror Green */}
            <rect x="110" y="335" width="140" height="85" fill="url(#grad-green)" />
            {/* Mirror Orange */}
            <rect x="250" y="335" width="180" height="85" fill="url(#grad-orange)" />
          </g>

          {/* MAIN 3D PUZZLE HOUSE BODY */}
          <g className="puzzle-house-main" filter="url(#puzzle-shadow)">
            
            {/* 1. CHIMNEY (Red) - Top Right */}
            <g
              className={`puzzle-piece chimney-piece ${hoveredPiece === 'chimney' ? 'active-piece' : ''}`}
              onMouseEnter={() => setHoveredPiece('chimney')}
              onMouseLeave={() => setHoveredPiece(null)}
              onClick={() => onPieceClick && onPieceClick('chimney')}
            >
              {/* Chimney Shaft */}
              <rect x="368" y="42" width="46" height="100" rx="3" fill="url(#grad-chimney)" />
              {/* Chimney 3D Left Shadow */}
              <path d="M 368 42 L 376 42 L 376 142 L 368 142 Z" fill="rgba(255,255,255,0.22)" />
              {/* Chimney 3D Right Shadow */}
              <path d="M 406 42 L 414 42 L 414 142 L 406 142 Z" fill="rgba(0,0,0,0.25)" />
              {/* Chimney Cap */}
              <ellipse cx="391" cy="42" rx="25" ry="6" fill="#DC2626" />
              <ellipse cx="391" cy="40" rx="22" ry="4.5" fill="#EF4444" />
              <ellipse cx="391" cy="39" rx="16" ry="3" fill="#7F1D1D" />
            </g>

            {/* 2. YELLOW ROOF PEAK PIECE */}
            <g
              className={`puzzle-piece roof-piece ${hoveredPiece === 'roof' ? 'active-piece' : ''}`}
              onMouseEnter={() => setHoveredPiece('roof')}
              onMouseLeave={() => setHoveredPiece(null)}
              onClick={() => onPieceClick && onPieceClick('roof')}
            >
              {/* Yellow Roof Peak with Interlocking Bottom-Right Tab */}
              <path
                d="M 270 58
                   L 370 148
                   C 362 154, 355 158, 345 158
                   C 335 158, 332 150, 325 142
                   C 316 130, 298 130, 290 142
                   C 283 150, 280 158, 270 158
                   C 260 158, 252 148, 240 138
                   L 270 58 Z"
                fill="url(#grad-roof)"
              />
              {/* Gloss Highlight on Ridge */}
              <path
                d="M 270 65 L 360 145"
                stroke="rgba(255,255,255,0.55)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="280" cy="80" r="3" fill="#ffffff" opacity="0.8" />
            </g>

            {/* 3. PURPLE PIECE (Upper Right & Roof Slope) */}
            <g
              className={`puzzle-piece purple-piece ${hoveredPiece === 'purpleWall' ? 'active-piece' : ''}`}
              onMouseEnter={() => setHoveredPiece('purpleWall')}
              onMouseLeave={() => setHoveredPiece(null)}
              onClick={() => onPieceClick && onPieceClick('purpleWall')}
            >
              {/* Interlocking with Yellow (left), Blue (center), and Orange (bottom) */}
              <path
                d="M 370 148
                   L 476 242
                   L 426 242
                   L 426 332
                   L 348 332
                   C 348 346, 354 358, 342 368
                   C 330 378, 314 374, 310 358
                   C 306 344, 312 332, 312 332
                   L 270 332
                   L 270 275
                   C 286 275, 298 268, 304 254
                   C 310 240, 302 226, 288 222
                   C 276 218, 270 224, 270 224
                   L 270 158
                   C 280 158, 283 150, 290 142
                   C 298 130, 316 130, 325 142
                   C 332 150, 335 158, 345 158
                   C 355 158, 362 154, 370 148 Z"
                fill="url(#grad-purple)"
              />
              {/* Eave Under-Shadow & Specular Light */}
              <path d="M 426 242 L 476 242 L 468 250 L 426 250 Z" fill="rgba(0,0,0,0.2)" />
              <path
                d="M 374 154 L 468 238"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>

            {/* 4. BLUE PIECE (Roof Overhang, Left Gable & Upper-Left Wall) */}
            <g
              className={`puzzle-piece blue-piece ${hoveredPiece === 'blueWall' ? 'active-piece' : ''}`}
              onMouseEnter={() => setHoveredPiece('blueWall')}
              onMouseLeave={() => setHoveredPiece(null)}
              onClick={() => onPieceClick && onPieceClick('blueWall')}
            >
              {/* Blue Jigsaw Piece with rounded interlocking knobs */}
              <path
                d="M 270 58
                   L 240 138
                   C 252 148, 260 158, 270 158
                   L 270 224
                   C 270 224, 276 218, 288 222
                   C 302 226, 310 240, 304 254
                   C 298 268, 286 275, 270 275
                   L 270 332
                   L 204 332
                   C 204 346, 210 358, 198 368
                   C 186 378, 170 374, 166 358
                   C 162 344, 168 332, 168 332
                   L 114 332
                   L 114 242
                   L 64 242
                   L 270 58 Z"
                fill="url(#grad-blue)"
              />
              {/* Eave Under-Shadow */}
              <path d="M 64 242 L 114 242 L 114 250 L 72 250 Z" fill="rgba(0,0,0,0.22)" />
              {/* Glossy Highlight on Blue Roof Slope */}
              <path
                d="M 266 66 L 76 236"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </g>

            {/* 5. LIME GREEN PIECE (Bottom Left Base) */}
            <g
              className={`puzzle-piece green-piece ${hoveredPiece === 'greenBase' ? 'active-piece' : ''}`}
              onMouseEnter={() => setHoveredPiece('greenBase')}
              onMouseLeave={() => setHoveredPiece(null)}
              onClick={() => onPieceClick && onPieceClick('greenBase')}
            >
              {/* Fits with Blue (top) and Orange (right) */}
              <path
                d="M 114 332
                   L 168 332
                   C 168 332, 162 344, 166 358
                   C 170 374, 186 378, 198 368
                   C 210 358, 204 346, 204 332
                   L 270 332
                   L 270 360
                   C 286 360, 298 368, 302 380
                   C 306 394, 298 408, 284 412
                   C 274 414, 270 408, 270 408
                   L 270 422
                   L 114 422
                   Z"
                fill="url(#grad-green)"
              />
              {/* Specular Front Bevel */}
              <path
                d="M 116 334 L 116 420"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
              />
              <path
                d="M 116 420 L 268 420"
                stroke="rgba(0,0,0,0.25)"
                strokeWidth="2.5"
              />
            </g>

            {/* 6. VIBRANT ORANGE PIECE (Bottom Right Base) */}
            <g
              className={`puzzle-piece orange-piece ${hoveredPiece === 'orangeBase' ? 'active-piece' : ''}`}
              onMouseEnter={() => setHoveredPiece('orangeBase')}
              onMouseLeave={() => setHoveredPiece(null)}
              onClick={() => onPieceClick && onPieceClick('orangeBase')}
            >
              {/* Fits with Purple (top) and Green (left) */}
              <path
                d="M 270 332
                   L 312 332
                   C 312 332, 306 344, 310 358
                   C 314 374, 330 378, 342 368
                   C 354 358, 348 346, 348 332
                   L 426 332
                   L 426 422
                   L 270 422
                   L 270 408
                   C 270 408, 274 414, 284 412
                   C 298 408, 306 394, 302 380
                   C 298 368, 286 360, 270 360
                   Z"
                fill="url(#grad-orange)"
              />
              {/* 3D Side Shadow & Bottom Bevel */}
              <path
                d="M 424 334 L 424 420"
                stroke="rgba(0,0,0,0.28)"
                strokeWidth="2.5"
              />
              <path
                d="M 272 420 L 424 420"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="2.5"
              />
            </g>

            {/* Seamless 3D Jigsaw Seam Highlights */}
            <g className="puzzle-seam-overlays" pointerEvents="none">
              <path
                d="M 270 158 L 270 332 M 270 332 L 270 422"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </g>
          </g>
        </svg>

        {/* Dynamic Tooltip / Interactive Benefit Pill on Hover */}
        {currentInfo && (
          <div className="puzzle-piece-tooltip" style={{ borderColor: currentInfo.color }}>
            <div className="tooltip-header">
              <span className="tooltip-badge" style={{ background: currentInfo.color }}>
                {currentInfo.badge}
              </span>
              <span className="tooltip-title">{currentInfo.title}</span>
            </div>
            <p className="tooltip-desc">{currentInfo.desc}</p>
          </div>
        )}
      </div>
    </div>
  );
}
