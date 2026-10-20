import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import './landing.css';
import FranchiseApplicationForm from '../../../components/Shared/FranchiseApplicationForm/FranchiseApplicationForm.jsx';
import PuzzleHouse from '../../../components/Landing/FranchisePuzzleBanner/PuzzleHouse';

// ---------------------------------------------------------------------------
/**
 * Adds `is-visible` to every `[data-reveal]` element inside the root once it
 * enters the viewport. One observer per page keeps reveal logic out of React state.
 */
function useReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const targets = root.querySelectorAll('[data-reveal]');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootRef]);
}

// ---------------------------------------------------------------------------
/**
 * Writes a 0..1 scroll progress value to the `--p` CSS variable of the element.
 * p = 0 when the element's top reaches `start` (fraction of viewport height),
 * p = 1 when its bottom reaches `end`. Runs outside React render via rAF.
 */
function useScrollProgress(ref, { start = 0.9, end = 0.5, onProgress } = {}) {
  const callbackRef = useRef(onProgress);

  useEffect(() => {
    callbackRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--p', '1');
      callbackRef.current?.(1);
      return undefined;
    }

    let frame = 0;
    let last = -1;

    const measure = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const distance = rect.height + vh * (start - end);
      const raw = distance > 0 ? (vh * start - rect.top) / distance : 1;
      const p = Math.min(1, Math.max(0, raw));
      if (Math.abs(p - last) < 0.001) return;
      last = p;
      el.style.setProperty('--p', p.toFixed(4));
      callbackRef.current?.(p);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ref, start, end]);
}

// ---------------------------------------------------------------------------
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%:-';

/**
 * Split-flap text. Each cell scrambles through glyphs before settling on its
 * target character. Cells are mutated directly to avoid per-frame re-renders.
 */
function FlapText({ value, length, delay = 0 }) {
  const cellsRef = useRef([]);
  const target = value.toUpperCase().padEnd(length, ' ').slice(0, length);

  useEffect(() => {
    const cells = cellsRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timers = [];

    cells.forEach((cell, i) => {
      if (!cell) return;
      const finalChar = target[i];
      if (reduceMotion) {
        cell.textContent = finalChar;
        return;
      }
      if (cell.textContent === finalChar) return;

      const flips = 5 + Math.floor(Math.random() * 7);
      const startTimer = setTimeout(() => {
        let count = 0;
        cell.classList.add('is-flipping');
        const interval = setInterval(() => {
          count += 1;
          if (count >= flips) {
            cell.textContent = finalChar;
            cell.classList.remove('is-flipping');
            clearInterval(interval);
            return;
          }
          cell.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }, 52);
        timers.push(interval);
      }, delay + i * 26);
      timers.push(startTimer);
    });

    return () => {
      timers.forEach((id) => {
        clearTimeout(id);
        clearInterval(id);
      });
      cells.forEach((cell) => cell?.classList.remove('is-flipping'));
    };
  }, [target, delay]);

  return (
    <span className="lp-flap">
      <span className="lp-sr">{value}</span>
      {Array.from({ length }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="lp-flap-cell"
          ref={(el) => {
            cellsRef.current[i] = el;
          }}
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
const VALUE_LENGTH = 13;

const boardRows = [
  { label: 'Experience', value: '29 YEARS', status: 'On hand' },
  { label: 'Training', value: '2 MONTHS', status: 'Fast track' },
  { label: 'Inventory', value: 'ZERO', status: 'Asset-light' },
  { label: 'Office', value: '100% ONLINE', status: 'Cloud' },
  { label: 'Standard', value: 'ISO 9001:2000', status: 'Ready' },
];

const offers = ['PASSPORTS', 'PSA DOCUMENTS', 'VISA FILING', 'AIR TICKETS', 'TOUR PACKAGES'];

function BoardClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  return (
    <time className="lp-board-clock" dateTime={now.toISOString()}>
      {hh}
      <span className="lp-board-colon">:</span>
      {mm}
    </time>
  );
}

function DepartureBoard() {
  const [offerIndex, setOfferIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => setOfferIndex((i) => (i + 1) % offers.length), 3400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="lp-board" role="group" aria-label="FairFly franchise at a glance">
      <div className="lp-board-head">
        <span className="lp-board-title">
          <i className="fa-solid fa-plane-departure" aria-hidden="true"></i>
          Departures
        </span>
        <span className="lp-board-sub">FairFly franchise network</span>
        <BoardClock />
      </div>

      <div className="lp-board-cols" aria-hidden="true">
        <span>Item</span>
        <span>Value</span>
        <span>Status</span>
      </div>

      <ul className="lp-board-boardRows">
        {boardRows.map((row, i) => (
          <li key={row.label} className="lp-board-row">
            <span className="lp-board-label">{row.label}</span>
            <FlapText value={row.value} length={VALUE_LENGTH} delay={450 + i * 160} />
            <span className="lp-board-status">{row.status}</span>
          </li>
        ))}
        <li className="lp-board-row lp-board-row-live">
          <span className="lp-board-label">You offer</span>
          <FlapText value={offers[offerIndex]} length={VALUE_LENGTH} delay={offerIndex === 0 ? 1300 : 0} />
          <span className="lp-board-status lp-board-status-live">
            <span className="lp-live-dot" aria-hidden="true" />
            Open
          </span>
        </li>
      </ul>

      <div className="lp-board-foot">
        <span>Exclusive territory rights</span>
        <span>Head office backup</span>
        <span className="lp-board-gate">Gate · Apply online</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function Hero({ onApply }) {
  return (
    <section className="lp-hero" aria-labelledby="lp-hero-title">
      <div className="lp-shell lp-hero-grid">
        <div className="lp-hero-copy">
          <p className="lp-kicker lp-hero-kicker">
            <span className="lp-kicker-bar" aria-hidden="true" />
            FairFly franchise program
          </p>

          <h1 id="lp-hero-title" className="lp-hero-title">
            <span className="lp-line"><span>Open a travel</span></span>
            <span className="lp-line"><span>agency that is</span></span>
            <span className="lp-line"><span><em>already</em> cleared</span></span>
            <span className="lp-line"><span>for takeoff.</span></span>
          </h1>

          <p className="lp-hero-lede">
            Run your own FairFly branch with 29 years of operating know-how, a 2-month
            academy, and a cloud office that handles passports, PSA documents, visas,
            tickets and tours. There is no inventory to buy and no stockroom to rent.
          </p>

          <div className="lp-hero-actions">
            <button type="button" className="lp-btn lp-btn-primary" onClick={onApply}>
              <span>Apply for a franchise</span>
              <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </button>
            <a href="#lp-route" className="lp-btn lp-btn-ghost">
              <span>See the route to launch</span>
              <i className="fa-solid fa-arrow-down" aria-hidden="true"></i>
            </a>
          </div>
        </div>

        <div className="lp-hero-board">
          <DepartureBoard />
        </div>
      </div>

      <div className="lp-hero-foot">
        <div className="lp-shell lp-hero-foot-inner">
          <span className="lp-hero-foot-label">Travelling, not franchising?</span>
          <Link to="/services" className="lp-textlink">
            Browse travel and document services
            <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </Link>
          <Link to="/track" className="lp-textlink">
            Track a request
            <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
const ACCENT = new Set(['skill', 'knowledge.']);
const QUOTE =
  'Your product is your skill and knowledge. Not a stockroom. Not a warehouse. Not capital locked inside boxes.';

function Manifesto() {
  const quoteRef = useRef(null);
  useScrollProgress(quoteRef, { start: 0.85, end: 0.45 });
  const words = QUOTE.split(' ');

  return (
    <section className="lp-manifesto" aria-labelledby="lp-manifesto-title">
      <div className="lp-shell lp-manifesto-grid">
        <aside className="lp-manifesto-aside" data-reveal>
          <span className="lp-index">[ 01 ] The model</span>
          <figure className="lp-manifesto-photo">
            <img
              src="https://images.unsplash.com/photo-1507206130118-b5907f817163?auto=format&fit=crop&w=900&q=80"
              alt="A travel consultant working at a laptop in a bright office"
              loading="lazy"
            />
            <figcaption>A FairFly branch runs from a front counter or a laptop.</figcaption>
          </figure>
        </aside>

        <div className="lp-manifesto-main">
          <h2 id="lp-manifesto-title" className="lp-sr">The FairFly business model</h2>
          <p
            ref={quoteRef}
            className="lp-manifesto-quote"
            style={{ '--n': words.length }}
          >
            {words.map((word, i) => (
              <span
                key={`${word}-${i}`}
                className={ACCENT.has(word) ? 'is-accent' : undefined}
                style={{ '--i': i }}
              >
                {word}{' '}
              </span>
            ))}
          </p>

          <div className="lp-manifesto-foot" data-reveal>
            <svg className="lp-plane-svg" viewBox="0 0 220 90" aria-hidden="true">
              <path
                className="lp-plane-trail"
                d="M4 80 C 50 80, 70 30, 120 44 S 180 70, 196 22"
              />
              <path className="lp-plane-body" d="M184 14 L216 6 L198 34 L194 24 Z" />
            </svg>
            <p className="lp-manifesto-body">
              Travel products are as simple as folding a paper airplane. The value is not the
              paper itself. It is the skill, accuracy and verified service inside the document.
              You create the product, fulfill it through FairFly&apos;s ISO-ready system, and
              keep the margin.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
const ledgerRows = [
  {
    label: 'Inventory',
    old: 'Capital locked in stock that expires, gets damaged, or loses value.',
    next: 'Zero inventory. Nothing to store and nothing to expire.',
  },
  {
    label: 'Cash flow',
    old: 'Goods released on credit, then weeks of chasing late payments.',
    next: 'Clients pay upfront, before the service is rendered.',
  },
  {
    label: 'Workspace',
    old: 'Recurring rent for stockrooms and warehouse space.',
    next: 'A modern front counter, or a fully online virtual office.',
  },
  {
    label: 'Reach',
    old: 'Factories, logistics and distributors before you can expand.',
    next: 'Tickets, tours and documents distributed nationwide.',
  },
];

function Ledger() {
  return (
    <section className="lp-ledger" aria-labelledby="lp-ledger-title">
      <div className="lp-shell">
        <header className="lp-split-head" data-reveal>
          <div>
            <span className="lp-index">[ 02 ] The comparison</span>
            <h2 id="lp-ledger-title" className="lp-h2">
              Where would you rather spend your working day?
            </h2>
          </div>
          <p className="lp-head-note">
            Conventional retail ties your money to physical goods. A FairFly branch turns
            travel expertise into a lean, cash-basis operation.
          </p>
        </header>

        <div className="lp-ledger-table" role="table" aria-label="Conventional retail compared with a FairFly branch">
          <div className="lp-ledger-row lp-ledger-headrow" role="row">
            <span role="columnheader" className="lp-ledger-label" />
            <span role="columnheader">Conventional retail</span>
            <span role="columnheader" className="lp-ledger-ff-head">A FairFly branch</span>
          </div>
          {ledgerRows.map((row, i) => (
            <div
              key={row.label}
              className="lp-ledger-row"
              role="row"
              data-reveal
              style={{ '--rd': i }}
            >
              <span role="rowheader" className="lp-ledger-label">{row.label}</span>
              <span role="cell" className="lp-ledger-old" data-col="Conventional retail">
                <span className="lp-strike">{row.old}</span>
              </span>
              <span role="cell" className="lp-ledger-new" data-col="A FairFly branch">
                <i className="fa-solid fa-check" aria-hidden="true"></i>
                {row.next}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
const extras = [
  'Direct head office support for operations, ticketing and marketing',
  'Exclusive territory rights inside a nationwide partner network',
  'Procedure manuals and standard forms for every transaction',
];

function SystemBlocks({ onApply }) {
  return (
    <section className="lp-system" aria-labelledby="lp-system-title">
      <div className="lp-shell lp-system-grid">
        <div className="lp-system-copy" data-reveal>
          <span className="lp-index">[ 03 ] The system</span>
          <h2 id="lp-system-title" className="lp-h2">
            Six blocks.
            <br />
            Already assembled.
          </h2>
          <p className="lp-body">
            Every FairFly branch is built from the same proven pieces. Select a block on the
            model to see what head office hands you on day one.
          </p>

          <ul className="lp-ruled-list">
            {extras.map((item) => (
              <li key={item}>
                <span className="lp-ruled-mark" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>

          <button type="button" className="lp-textlink lp-textlink-strong" onClick={onApply}>
            Start your application
            <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </button>
        </div>

        <div className="lp-system-model" data-reveal style={{ '--rd': 2 }}>
          <PuzzleHouse />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
const curriculum = [
  { title: 'Ticketing systems', note: 'Fares, reservations and issuance' },
  { title: 'Visa regulations', note: 'Embassy requirements and filing' },
  { title: 'Tour packaging', note: 'Building and pricing holiday packages' },
  { title: 'Document verification', note: 'Passports and PSA civil documents' },
];

const scale = ['1 yr', '2 yrs', '3 yrs', '4 yrs', '5 yrs'];

function Academy() {
  return (
    <section className="lp-academy" aria-labelledby="lp-academy-title">
      <div className="lp-shell">
        <header className="lp-split-head" data-reveal>
          <div>
            <span className="lp-index">[ 04 ] The academy</span>
            <h2 id="lp-academy-title" className="lp-h2">
              29 years of know-how, <span className="lp-h2-accent">compressed into 2 months.</span>
            </h2>
          </div>
          <p className="lp-head-note">
            Learn directly from industry veterans in a dedicated training room, then practice
            on real transaction drills with ready-to-use SOPs, intake templates and checklists.
          </p>
        </header>

        <figure className="lp-time" data-reveal aria-label="Time to operate a travel business: 3 to 5 years alone versus 2 months with the FairFly Academy">
          <div className="lp-time-row">
            <div className="lp-time-meta">
              <span className="lp-time-name">Learning alone, by trial and error</span>
              <span className="lp-time-value">3 to 5 years</span>
            </div>
            <div className="lp-time-track">
              <span className="lp-time-fill lp-time-fill-slow" />
              <span className="lp-time-fill lp-time-fill-range" />
            </div>
          </div>

          <div className="lp-time-row">
            <div className="lp-time-meta">
              <span className="lp-time-name lp-time-name-ff">FairFly Academy</span>
              <span className="lp-time-value lp-time-value-ff">2 months</span>
            </div>
            <div className="lp-time-track">
              <span className="lp-time-fill lp-time-fill-fast" />
              <span className="lp-time-flag">Ready to operate</span>
            </div>
          </div>

          <div className="lp-time-scale" aria-hidden="true">
            {scale.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
        </figure>

        <ol className="lp-curriculum">
          {curriculum.map((item, i) => (
            <li key={item.title} data-reveal style={{ '--rd': i }}>
              <span className="lp-curriculum-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="lp-curriculum-title">{item.title}</span>
              <span className="lp-curriculum-note">{item.note}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
const stops = [
  { code: 'DEP', title: 'Submit your franchise inquiry online' },
  { code: 'CHK', title: 'Discovery consultation and territory evaluation' },
  { code: 'CHK', title: 'Review and sign the FairFly franchise agreement' },
  { code: 'CHK', title: 'Complete the 2-month academy training' },
  { code: 'ARR', title: 'Launch your FairFly branch and start earning' },
];

function FlightPath() {
  const sectionRef = useRef(null);
  const stopsRef = useRef([]);
  const readoutRef = useRef(null);

  const handleProgress = useCallback((p) => {
    const reached = Math.min(stops.length, Math.floor(p * (stops.length - 1) + 0.08) + 1);
    stopsRef.current.forEach((el, i) => {
      if (el) el.toggleAttribute('data-active', i < reached);
    });
    if (readoutRef.current) {
      readoutRef.current.textContent = String(reached).padStart(2, '0');
    }
  }, []);

  useScrollProgress(sectionRef, { start: 0.35, end: 1, onProgress: handleProgress });

  return (
    <section id="lp-route" ref={sectionRef} className="lp-route" aria-labelledby="lp-route-title">
      <div className="lp-route-sticky">
        <div className="lp-route-bg" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1490430657723-4d607c1503fc?auto=format&fit=crop&w=1800&q=70"
            alt=""
            loading="lazy"
          />
        </div>

        <div className="lp-shell lp-route-inner">
          <header className="lp-route-head">
            <div>
              <span className="lp-index lp-index-light">[ 05 ] The route</span>
              <h2 id="lp-route-title" className="lp-h2 lp-h2-light">
                From inquiry to opening day, in five stops.
              </h2>
            </div>
            <p className="lp-route-readout" aria-hidden="true">
              Stop <span ref={readoutRef}>01</span> / 05
            </p>
          </header>

          <div className="lp-route-track">
            <span className="lp-route-line" aria-hidden="true" />
            <span className="lp-route-fill" aria-hidden="true" />
            <span className="lp-route-plane" aria-hidden="true">
              <i className="fa-solid fa-plane"></i>
            </span>

            <ol className="lp-route-stops">
              {stops.map((stop, i) => (
                <li
                  key={stop.title}
                  ref={(el) => {
                    stopsRef.current[i] = el;
                  }}
                  className="lp-route-stop"
                >
                  <span className="lp-route-dot">{String(i + 1).padStart(2, '0')}</span>
                  <span className="lp-route-code">{stop.code}</span>
                  <span className="lp-route-title">{stop.title}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
const services = [
  'Passport filing',
  'PSA civil documents',
  'Embassy visa filing',
  'Flight ticketing',
  'Holiday tour packages',
];

function MarqueeGroup({ hidden }) {
  return (
    <ul className="lp-marquee-group" aria-hidden={hidden || undefined}>
      {services.map((service) => (
        <li key={service}>
          <span>{service}</span>
          <span className="lp-marquee-sep" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
}

function ServicesRunway() {
  return (
    <section className="lp-runway" aria-labelledby="lp-runway-title">
      <div className="lp-shell lp-runway-head">
        <span className="lp-index">[ 06 ] What your branch sells</span>
        <h2 id="lp-runway-title" className="lp-runway-title">
          The same catalog our travelers book every day.
        </h2>
        <Link to="/services" className="lp-textlink">
          View the services catalog
          <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </Link>
      </div>

      <div className="lp-marquee">
        <div className="lp-marquee-track">
          <MarqueeGroup />
          <MarqueeGroup hidden />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
const fields = [
  { label: 'Passenger', value: 'Future franchise partner' },
  { label: 'From', value: 'Where you are today' },
  { label: 'To', value: 'Your own FairFly branch' },
  { label: 'Training', value: '2 months' },
  { label: 'Inventory', value: 'Zero' },
  { label: 'Gate', value: 'Apply online' },
];

function BoardingPass({ onApply }) {
  const passRef = useRef(null);

  // Pointer tilt writes CSS variables directly; no React state per frame.
  const handleMove = (e) => {
    const el = passRef.current;
    if (!el || e.pointerType !== 'mouse') return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
  };

  const handleLeave = () => {
    const el = passRef.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <section id="franchise-section" className="lp-final" aria-labelledby="lp-final-title">
      <div className="lp-final-bg" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1778092628303-10637f6008ac?auto=format&fit=crop&w=2000&q=70"
          alt=""
          loading="lazy"
        />
      </div>

      <div className="lp-shell lp-final-grid">
        <div className="lp-final-copy" data-reveal>
          <span className="lp-index lp-index-light">[ 07 ] Boarding</span>
          <h2 id="lp-final-title" className="lp-final-title">
            Your seat in the FairFly network is open.
          </h2>
          <p className="lp-final-body">
            Send your franchise inquiry today. Our team will reach out for a discovery
            consultation and walk you through territory, agreement and academy schedule.
          </p>
          <div className="lp-hero-actions">
            <button type="button" className="lp-btn lp-btn-light" onClick={onApply}>
              <span>Apply for a franchise</span>
              <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </button>
            <Link to="/about" className="lp-btn lp-btn-outline-light">
              <span>How the system works</span>
            </Link>
          </div>
          <p className="lp-final-alt">
            Booking a trip instead?{' '}
            <Link to="/register" className="lp-final-alt-link">Create a client account</Link>
          </p>
        </div>

        <div className="lp-pass-wrap" data-reveal style={{ '--rd': 2 }}>
          <div
            ref={passRef}
            className="lp-pass"
            onPointerMove={handleMove}
            onPointerLeave={handleLeave}
          >
            <div className="lp-pass-main">
              <div className="lp-pass-head">
                <span>Boarding pass</span>
                <span className="lp-pass-brand">
                  Fair<span>Fly</span>
                </span>
              </div>
              <dl className="lp-pass-fields">
                {fields.map((f) => (
                  <div key={f.label}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="lp-pass-stub" aria-hidden="true">
              <span className="lp-pass-stub-label">Partner</span>
              <span className="lp-pass-stub-seat">01A</span>
              <span className="lp-pass-barcode" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const rootRef = useRef(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  const openApply = useCallback((e) => {
    if (e) e.preventDefault();
    setIsApplyOpen(true);
  }, []);

  const closeApply = useCallback(() => setIsApplyOpen(false), []);

  useReveal(rootRef);

  return (
    <div ref={rootRef} className="landing-page-root lp">
      <Hero onApply={openApply} />
      <Manifesto />
      <Ledger />
      <SystemBlocks onApply={openApply} />
      <Academy />
      <FlightPath />
      <ServicesRunway />
      <BoardingPass onApply={openApply} />

      <FranchiseApplicationForm isOpen={isApplyOpen} onClose={closeApply} />
    </div>
  );
}
