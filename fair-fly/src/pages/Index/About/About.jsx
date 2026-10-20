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

  return (
    <div className="about-page">
      {/* ── Top Hero Banner ────────────────────────────────────────── */}
      <header className="about-hero">
        <div className="about-hero-inner">
          <div className="about-badge-strip">
            <span className="about-pill">
              <i className="fa-solid fa-award"></i> [ 29+ YEARS INDUSTRY HERITAGE ]
            </span>
            <span className="about-pill">
              <i className="fa-solid fa-certificate"></i> [ ISO 9001:2000 READY ]
            </span>
          </div>

          <h1 className="about-title">
            About <span className="titleBlue">Fair</span>
            <span className="titleOrange">fly</span> Travel & Tours
          </h1>

          <p className="about-subtitle">
            An ISO 9001:2000-ready cloud ecosystem delivering standardized travel documentation,
            asset-light franchise operations, and over 29 years of industry expertise across the Philippines.
          </p>

          {/* Key Heritage Metrics */}
          <div className="about-stats-grid">
            <div className="about-stat-card">
              <span className="stat-number">29+</span>
              <span className="stat-label">Years Experience</span>
            </div>
            <div className="about-stat-card">
              <span className="stat-number">100%</span>
              <span className="stat-label">Cloud Integrated</span>
            </div>
            <div className="about-stat-card">
              <span className="stat-number">ISO 9001</span>
              <span className="stat-label">Standardized Quality</span>
            </div>
            <div className="about-stat-card">
              <span className="stat-number">{loading ? '...' : branches.length || '2'}</span>
              <span className="stat-label">Active Branches</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Our Branches Section ───────────────────────────────────── */}
      <section id="our-branches" className="about-section" aria-labelledby="branches-section-title">
        <div className="branchesSectionHeader">
          <div>
            <h2 id="branches-section-title" className="sectionTitle">Our Branches</h2>
            <p className="sectionSubtitle">
              Certified FairFly locations delivering standardized travel documentation, ticketing,
              and tour assistance across the Philippines.
            </p>
          </div>

          <div className="branchesControls">
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              placeholder="Search branch by name, city, or address..."
              className="branchesSearchBar"
            />
          </div>
        </div>

        {/* Counter readout */}
        <div className="branchesCountBar">
          <span className="countText">
            {loading ? (
              'Loading branch directory...'
            ) : (
              <>
                Showing <strong>{filteredBranches.length}</strong> active branch{filteredBranches.length === 1 ? '' : 'es'} across the Philippines
              </>
            )}
          </span>
        </div>

        <div className="branchesCardsStack">
          {loading ? (
            <div className="branchWideSkeleton">
              <div className="headOfficeCard">
                <div className="headOfficeLeft">
                  <Skeleton width="40%" height="1.25rem" />
                  <Skeleton width="60%" height="1.75rem" />
                  <Skeleton width="80%" height="1rem" />
                </div>
                <div className="headOfficeRight">
                  <Skeleton width="70%" height="1.25rem" />
                  <Skeleton width="50%" height="1.25rem" />
                  <Skeleton width="40%" height="2.25rem" />
                </div>
              </div>
            </div>
          ) : filteredBranches.length === 0 ? (
            searchQuery ? (
              <div className="branchesEmptyState">
                <div className="emptyIcon">
                  <i className="fa-solid fa-store-slash"></i>
                </div>
                <h3 className="emptyTitle">No Matching Branches</h3>
                <p className="emptyDesc">
                  No branch matches &ldquo;{searchQuery}&rdquo;. Try searching for a different city or location.
                </p>
                <button
                  type="button"
                  className="btn-clear-search"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </button>
              </div>
            ) : null
          ) : (
            paginatedBranches.map((branch) => {
              const isFlagship =
                (branch.branchName || '').toLowerCase().includes('head office') ||
                (branch.address || '').toLowerCase().includes('a square mall') ||
                (branch.branchName || '').toLowerCase().includes('baliuag');
              const bAddress = branch.address || 'Address provided upon inquiry';
              const bEmail = branch.email || 'operator@fairfly.ph';
              const bPhone = branch.contactNumber || '';
              const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${branch.branchName} ${bAddress}`)}`;

              return (
                <article
                  key={branch.id}
                  className={`headOfficeCard ${isFlagship ? 'flagshipBorder' : 'branchWideCard'}`}
                >
                  <div className="headOfficeLeft">
                    <div className="headOfficeBadgeRow">
                      {isFlagship ? (
                        <>
                          <span className="badge-flagship">
                            <i className="fa-solid fa-star"></i> Flagship Headquarters
                          </span>
                          <span className="badge-iso">
                            <i className="fa-solid fa-shield-halved"></i> Central Operations Hub
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="badge-accredited">
                            <i className="fa-solid fa-circle-check"></i> Accredited Branch
                          </span>
                          {branch.isQualified && (
                            <span className="badge-iso">
                              <i className="fa-solid fa-shield-halved"></i> Specialized Services
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    <div className="headOfficeTitle">
                      <div className={`headOfficeIcon ${isFlagship ? 'flagshipIcon' : 'branchIcon'}`}>
                        <i className={`fa-solid ${isFlagship ? 'fa-building-flag' : 'fa-store'}`}></i>
                      </div>
                      <div>
                        <h3 className="branchCardHeading">{branch.branchName}</h3>
                        {/* Email used as the subheading per specification */}
                        <a
                          href={`mailto:${bEmail}`}
                          className="headOfficeEmailSubheading"
                          title={`Contact ${bEmail}`}
                        >
                          <i className="fa-regular fa-envelope"></i> {bEmail}
                        </a>
                      </div>
                    </div>

                    <p className="headOfficeAddr">
                      <i className="fa-solid fa-location-dot"></i>
                      <span>{bAddress}</span>
                    </p>
                  </div>

                  <div className="headOfficeRight">
                    <div className="headOfficeMetaRow">
                      <div className="metaItem">
                        <span className="metaLabel"><i className="fa-solid fa-phone"></i> Contact Number</span>
                        {bPhone ? (
                          <a href={`tel:${bPhone.replace(/\s+/g, '')}`} className="metaValueLink">
                            {bPhone}
                          </a>
                        ) : (
                          <span className="metaValue metaMuted">Available upon inquiry</span>
                        )}
                      </div>
                      <div className="metaItem">
                        <span className="metaLabel"><i className="fa-solid fa-clock"></i> Operational Hours</span>
                        <span className="metaValue">Mon – Sat: 9:00 AM – 6:00 PM | Sun: Closed</span>
                      </div>
                    </div>

                    <div className="headOfficeActions">
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-headOffice-map"
                        title="View location in Google Maps"
                      >
                        <i className="fa-solid fa-diamond-turn-right"></i> Directions
                      </a>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* ── Pagination Bar for Branches ────────────────────────────── */}
        {!loading && filteredBranches.length > pageSize && (
          <div className="branchesPaginationContainer">
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
      </section>

      {/* ── 29 Years Experience in 2 Months Training Academy ───────── */}
      <TrainingComparison />

      {/* ── ISO 9001-2000 Quality Management System Section ───────── */}
      <BusinessSystem />

      {/* ── Asset-Light & Zero Inventory Business Model Section ────── */}
      <BusinessModel />

      {/* ── Connect & Franchise Conversion Hub ─────────────────────── */}
      <section className="about-section connectSection" aria-labelledby="connect-heading">
        <div className="connectHubGrid">
          <div className="connectCard franchiseCard">
            <div className="connectCardHeader">
              <span className="connectCardBadge">[ FRANCHISE NETWORK ]</span>
              <h3 className="connectCardTitle">Start Your FairFly Agency</h3>
            </div>
            <p className="connectCardDesc">
              Access 29+ years of operational travel expertise, ISO 9001 SOP manuals, zero physical
              inventory lockup, and 100% online cloud workflow systems.
            </p>
            <button
              type="button"
              className="btn-connect-franchise"
              onClick={() => setIsFranchiseModalOpen(true)}
            >
              <i className="fa-solid fa-file-signature"></i> Inquire for Franchise
            </button>
          </div>

          <div className="connectCard socialCard">
            <div className="connectCardHeader">
              <span className="connectCardBadge">[ DIRECT CHANNELS ]</span>
              <h3 id="connect-heading" className="connectCardTitle">Connect With Head Office</h3>
            </div>
            <p className="connectCardDesc">
              Follow our official travel advisories, package updates, and reach out directly to
              our customer support specialists.
            </p>
            <div className="socialBtns">
              <a
                href="https://www.facebook.com/squaretravels.ph/"
                target="_blank"
                rel="noreferrer"
                className="socialBtn facebook"
              >
                <i className="fa-brands fa-facebook-f"></i>
                <span>Facebook Page</span>
              </a>
              <a
                href="https://www.facebook.com/squaretravels.ph/"
                target="_blank"
                rel="noreferrer"
                className="socialBtn messenger"
              >
                <i className="fa-brands fa-facebook-messenger"></i>
                <span>Messenger</span>
              </a>
              <a
                href="mailto:fairflytravel19@yahoo.com"
                className="socialBtn email"
              >
                <i className="fa-solid fa-envelope"></i>
                <span>Direct Email</span>
              </a>
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
