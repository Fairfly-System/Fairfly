import React, { useState, useEffect, useMemo } from 'react';
import './about.css';
import TrainingComparison from '../../../components/Landing/TrainingComparison/TrainingComparison';
import BusinessSystem from '../../../components/Landing/BusinessSystem/BusinessSystem';
import BusinessModel from '../../../components/Landing/BusinessModel/BusinessModel';
import FranchiseApplicationForm from '../../../components/Shared/FranchiseApplicationForm/FranchiseApplicationForm';
import SearchBar from '../../../components/UI/SearchBar/SearchBar';
import Pagination from '../../../components/UI/Pagination/Pagination';
import Skeleton from '../../../components/UI/Skeleton/Skeleton';
import { fetchPublicBranches } from '../../../services/branchService';

export default function About() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(3);
  const [isFranchiseModalOpen, setIsFranchiseModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchPublicBranches(
      (data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        // Filter out obvious test placeholder records
        const sanitized = list.filter(
          (b) => !(b.branchName?.toLowerCase() === 'test' && b.address?.toLowerCase() === 'test')
        );
        setBranches(sanitized);
        setLoading(false);
      },
      (err) => {
        if (!isMounted) return;
        console.warn('Could not load branches from API, using fallback:', err);
        setBranches([
          {
            id: 'default-baliuag',
            branchName: 'Baliuag Branch',
            address: 'Unit 35 Ground Flr. A Square Mall, Brgy. Pinagbarilan, Baliuag, Bulacan, Philippines, 3006',
            contactNumber: '0923 720 8565',
            email: 'operator.baliuag@fairfly.ph',
            isQualified: true,
            status: 'Active'
          },
          {
            id: 'default-apalit',
            branchName: 'Apalit Branch',
            address: 'Apalit, Pampanga',
            contactNumber: '09123456789',
            email: 'operator.apalit@fairfly.ph',
            isQualified: false,
            status: 'Active'
          }
        ]);
        setLoading(false);
      },
      setLoading
    );

    return () => {
      isMounted = false;
    };
  }, []);

  // Reset pagination to page 1 whenever search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Sort flagship first, then filter by search query
  const filteredBranches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const sorted = [...branches].sort((a, b) => {
      const aIsFlagship =
        (a.branchName || '').toLowerCase().includes('head office') ||
        (a.address || '').toLowerCase().includes('a square mall') ||
        (a.branchName || '').toLowerCase().includes('baliuag');
      const bIsFlagship =
        (b.branchName || '').toLowerCase().includes('head office') ||
        (b.address || '').toLowerCase().includes('a square mall') ||
        (b.branchName || '').toLowerCase().includes('baliuag');
      if (aIsFlagship && !bIsFlagship) return -1;
      if (!aIsFlagship && bIsFlagship) return 1;
      return (a.branchName || '').localeCompare(b.branchName || '');
    });

    if (!q) return sorted;

    return sorted.filter((b) => {
      const name = (b.branchName || '').toLowerCase();
      const addr = (b.address || '').toLowerCase();
      const mail = (b.email || '').toLowerCase();
      return name.includes(q) || addr.includes(q) || mail.includes(q);
    });
  }, [branches, searchQuery]);

  // Paginated slice for all active branches
  const paginatedBranches = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredBranches.slice(startIndex, startIndex + pageSize);
  }, [filteredBranches, currentPage, pageSize]);

  const pad = (n) => String(n).padStart(2, '0');
  const pageOffset = (currentPage - 1) * pageSize;

  return (
    <div className="about-page">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <header className="ab-hero">
        <div className="ab-shell ab-hero-grid">
          <div className="ab-hero-copy">
            <div className="ab-tags">
              <span>[ 29+ years industry heritage ]</span>
              <span>[ ISO 9001:2000 ready ]</span>
            </div>

            <h1 className="ab-title">
              About <span className="ab-brand-fair">Fair</span>
              <span className="ab-brand-fly">fly</span> Travel &amp; Tours
            </h1>

            <p className="ab-lede">
              An ISO 9001:2000-ready cloud ecosystem delivering standardized travel documentation,
              asset-light franchise operations, and over 29 years of industry expertise across the Philippines.
            </p>
          </div>

          <figure className="ab-hero-media">
            <img
              src="https://images.unsplash.com/photo-1759430710977-a557a49897ff?auto=format&fit=crop&w=1400&q=75"
              alt="Airport lounge overlooking aircraft on the tarmac"
            />
            <figcaption>
              <span>Est. 29+ years</span>
              <span>Baliuag, Bulacan &middot; PH</span>
            </figcaption>
          </figure>
        </div>

        {/* Key heritage metrics */}
        <div className="ab-shell">
          <dl className="ab-stats">
            <div>
              <dt>Years experience</dt>
              <dd>29+</dd>
            </div>
            <div>
              <dt>Cloud integrated</dt>
              <dd>100%</dd>
            </div>
            <div>
              <dt>Standardized quality</dt>
              <dd>ISO 9001</dd>
            </div>
            <div>
              <dt>Active branches</dt>
              <dd className="ab-stats-accent">{loading ? '...' : pad(branches.length || 2)}</dd>
            </div>
          </dl>
        </div>
      </header>

      {/* ── Our Branches ──────────────────────────────────────────── */}
      <section id="our-branches" className="ab-section" aria-labelledby="branches-section-title">
        <div className="ab-shell">
          <header className="ab-split-head">
            <div>
              <span className="ab-index">[ 01 ] The network</span>
              <h2 id="branches-section-title" className="ab-h2">Our branches</h2>
            </div>
            <div className="ab-split-aside">
              <p className="ab-note">
                Certified FairFly locations delivering standardized travel documentation, ticketing,
                and tour assistance across the Philippines.
              </p>
              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                placeholder="Search branch by name, city, or address..."
                className="ab-search"
              />
            </div>
          </header>

          {/* Branch directory, styled as a departure board */}
          <div className="ab-board">
            <div className="ab-board-head">
              <span className="ab-board-title">
                <i className="fa-solid fa-plane-departure" aria-hidden="true"></i> Branch directory
              </span>
              <span className="ab-board-count" aria-live="polite">
                {loading ? (
                  'Loading branch directory...'
                ) : (
                  <>
                    Showing <strong>{pad(filteredBranches.length)}</strong> active branch
                    {filteredBranches.length === 1 ? '' : 'es'}
                  </>
                )}
              </span>
            </div>

            <div className="ab-board-cols" aria-hidden="true">
              <span>No.</span>
              <span>Branch</span>
              <span>Address</span>
              <span>Contact</span>
              <span>Hours</span>
              <span></span>
            </div>

            {loading ? (
              <div className="ab-branch ab-branch-skeleton">
                <Skeleton width="1.5rem" height="1rem" />
                <div className="ab-branch-name">
                  <Skeleton width="40%" height="0.75rem" />
                  <Skeleton width="70%" height="1.5rem" />
                </div>
                <Skeleton width="85%" height="1rem" />
                <Skeleton width="70%" height="1rem" />
                <Skeleton width="60%" height="1rem" />
              </div>
            ) : filteredBranches.length === 0 ? (
              searchQuery ? (
                <div className="ab-empty">
                  <span className="ab-empty-code">[ 00 ] No matches</span>
                  <h3 className="ab-empty-title">No matching branches</h3>
                  <p>
                    No branch matches &ldquo;{searchQuery}&rdquo;. Try searching for a different city or location.
                  </p>
                  <button type="button" className="ab-btn ab-btn-ink" onClick={() => setSearchQuery('')}>
                    Clear search
                  </button>
                </div>
              ) : null
            ) : (
              paginatedBranches.map((branch, idx) => {
                const isFlagship =
                  (branch.branchName || '').toLowerCase().includes('head office') ||
                  (branch.address || '').toLowerCase().includes('a square mall') ||
                  (branch.branchName || '').toLowerCase().includes('baliuag');
                const bAddress = branch.address || 'Address provided upon inquiry';
                const bEmail = branch.email || 'operator@fairfly.ph';
                const bPhone = branch.contactNumber || '';
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${branch.branchName} ${bAddress}`)}`;

                return (
                  <article key={branch.id} className={`ab-branch ${isFlagship ? 'is-flagship' : ''}`}>
                    <span className="ab-branch-num">{pad(pageOffset + idx + 1)}</span>

                    <div className="ab-branch-name">
                      <div className="ab-branch-tags">
                        {isFlagship ? (
                          <>
                            <span className="ab-branch-tag ab-branch-tag-accent">Flagship headquarters</span>
                            <span className="ab-branch-tag">Central operations hub</span>
                          </>
                        ) : (
                          <>
                            <span className="ab-branch-tag">Accredited branch</span>
                            {branch.isQualified && <span className="ab-branch-tag">Specialized services</span>}
                          </>
                        )}
                      </div>
                      <h3 className="ab-branch-title">{branch.branchName}</h3>
                      <a href={`mailto:${bEmail}`} className="ab-branch-email" title={`Contact ${bEmail}`}>
                        {bEmail}
                      </a>
                    </div>

                    <p className="ab-branch-cell">
                      <span className="ab-k">Address</span>
                      {bAddress}
                    </p>

                    <p className="ab-branch-cell">
                      <span className="ab-k">Contact</span>
                      {bPhone ? (
                        <a href={`tel:${bPhone.replace(/\s+/g, '')}`} className="ab-branch-phone">
                          {bPhone}
                        </a>
                      ) : (
                        <span className="ab-muted">Available upon inquiry</span>
                      )}
                    </p>

                    <p className="ab-branch-cell">
                      <span className="ab-k">Hours</span>
                      Mon &ndash; Sat: 9:00 AM &ndash; 6:00 PM
                      <span className="ab-muted">Sun: Closed</span>
                    </p>

                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ab-branch-map"
                      title="View location in Google Maps"
                    >
                      Directions
                      <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                    </a>
                  </article>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {!loading && filteredBranches.length > pageSize && (
            <div className="ab-pagination">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredBranches.length}
                pageSize={pageSize}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  const sectionEl = document.getElementById('our-branches');
                  if (sectionEl) {
                    sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[2, 3, 5]}
              />
            </div>
          )}
        </div>
      </section>

      {/* ── 29 Years Experience in 2 Months Training Academy ───────── */}
      <TrainingComparison />

      {/* ── ISO 9001-2000 Quality Management System Section ───────── */}
      <BusinessSystem />

      {/* ── Asset-Light & Zero Inventory Business Model Section ────── */}
      <BusinessModel />

      {/* ── Connect & Franchise Conversion Hub ─────────────────────── */}
      <section className="ab-section ab-connect" aria-labelledby="connect-heading">
        <div className="ab-shell">
          <span className="ab-index">[ 05 ] Next stop</span>

          <div className="ab-connect-grid">
            <div className="ab-connect-card ab-connect-franchise">
              <span className="ab-connect-code">[ Franchise network ]</span>
              <h3 className="ab-connect-title">Start your FairFly agency</h3>
              <p className="ab-connect-desc">
                Access 29+ years of operational travel expertise, ISO 9001 SOP manuals, zero physical
                inventory lockup, and 100% online cloud workflow systems.
              </p>
              <button
                type="button"
                className="ab-btn ab-btn-light"
                onClick={() => setIsFranchiseModalOpen(true)}
              >
                <span>Inquire for franchise</span>
                <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </button>
            </div>

            <div className="ab-connect-card">
              <span className="ab-connect-code">[ Direct channels ]</span>
              <h3 id="connect-heading" className="ab-connect-title">Connect with head office</h3>
              <p className="ab-connect-desc">
                Follow our official travel advisories, package updates, and reach out directly to
                our customer support specialists.
              </p>
              <ul className="ab-channels">
                <li>
                  <a href="https://www.facebook.com/squaretravels.ph/" target="_blank" rel="noreferrer">
                    <i className="fa-brands fa-facebook-f" aria-hidden="true"></i>
                    <span>Facebook page</span>
                    <i className="fa-solid fa-arrow-up-right-from-square ab-channel-go" aria-hidden="true"></i>
                  </a>
                </li>
                <li>
                  <a href="https://www.facebook.com/squaretravels.ph/" target="_blank" rel="noreferrer">
                    <i className="fa-brands fa-facebook-messenger" aria-hidden="true"></i>
                    <span>Messenger</span>
                    <i className="fa-solid fa-arrow-up-right-from-square ab-channel-go" aria-hidden="true"></i>
                  </a>
                </li>
                <li>
                  <a href="mailto:fairflytravel19@yahoo.com">
                    <i className="fa-solid fa-envelope" aria-hidden="true"></i>
                    <span>fairflytravel19@yahoo.com</span>
                    <i className="fa-solid fa-arrow-right ab-channel-go" aria-hidden="true"></i>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Shared Franchise Application Form Modal ─────────────────── */}
      <FranchiseApplicationForm
        isOpen={isFranchiseModalOpen}
        onClose={() => setIsFranchiseModalOpen(false)}
      />
    </div>
  );
}
