import React from 'react';
import './explore.css';

const tiles = [
  {
    key: 'tropical',
    title: 'Tropical Escapes',
    sub: 'Maldives, Bali, Palawan',
    area: 'tropical',
    img: 'https://images.unsplash.com/photo-1520454974749-611b7248ffdb?q=80&w=1000&auto=format&fit=crop',
  },
  {
    key: 'flights',
    title: 'Non-stop Flights',
    area: 'flights',
    img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop',
  },
  {
    key: 'europe',
    title: 'Europe Tours',
    area: 'europe',
    img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop',
  },
  {
    key: 'window',
    title: 'Window Seat Views',
    area: 'window',
    img: 'https://images.unsplash.com/photo-1517479149777-5f3b1511d5ad?q=80&w=800&auto=format&fit=crop',
  },
  {
    key: 'city',
    title: 'City Explorations',
    area: 'city',
    img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800&auto=format&fit=crop',
  },
  {
    key: 'beach',
    title: 'Beach Getaways',
    sub: 'Book your dream holiday today',
    area: 'beach',
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
  },
  {
    key: 'island',
    title: 'Island Hopping',
    sub: 'Philippines & beyond',
    area: 'island',
    img: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?q=80&w=1200&auto=format&fit=crop',
  },
];

export default function Explore() {
  return (
    <section id="explore" className="explore-section">
      {/* Travel Background Layer with Opacity 0.12 */}
      <div className="explore-bg-container" aria-hidden="true">
        <img
          src="/explore_bg.jpg"
          alt=""
          className="explore-bg-img"
        />
        <div className="explore-bg-overlay" />
      </div>

      <div className="explore-container">
        <div className="explore-header">
          <div className="explore-eyebrow">
            <span className="explore-eyebrow-accent" />
            <span>GLOBAL DESTINATION HORIZONS · TRAVEL NETWORK</span>
          </div>
          <h2 className="explore-title">
            EXPLORE THE WORLD WITH <br />
            <span className="explore-title-accent">FAIRFLY NETWORK.</span>
          </h2>
          <p className="explore-sub">
            From tropical island shores to iconic world capitals — FairFly empowers operators and clients with direct ticketing and holiday tour packages across the globe.
          </p>
        </div>

        <div className="explore-grid">
          {tiles.map((t) => (
            <div key={t.key} className="explore-tile" style={{ gridArea: t.area }}>
              <img src={t.img} alt={t.title} className="explore-img" loading="lazy" />
              <div className="explore-overlay" />
              <div className="explore-caption">
                <span className="explore-tile-tag">[ DESTINATION ]</span>
                <p className="explore-tileTitle">{t.title}</p>
                {t.sub && <p className="explore-tileSub">{t.sub}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
