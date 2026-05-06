import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useCompass } from '../contexts/CompassContext';
import useGooglePlacesAutocomplete from '../hooks/useGooglePlacesAutocomplete';
import { searchPoliticiansByName } from '../lib/api';

const COVERAGE_AREAS = [
  { county: 'Monroe County', state: 'Indiana', address: '100 W Kirkwood Ave, Bloomington, IN 47404' },
  { county: 'Los Angeles County', state: 'California', browseGeoId: '06037', browseMtfcc: 'G4020', browseCityFilter: 'los angeles', browseSchoolFilter: 'los angeles unified' },
  { county: 'Collin County', state: 'Texas', browseStateAbbrev: 'TX', browseCountyGeoId: '48085', browseGovernmentList: ['4801924','4803300','4808872','4813684','4825224','4825488','4827684','4838068','4841800','4844308','4845012','4845744','4847496','4850100','4850760','4855152','4863000','4863276','4863432','4863500','4864220','4875960','4877740'] },
];

const STEPS = [
  { n: '01', heading: 'Choose Your Area', body: 'Pick an Alpha County or enter your address — we\'ll find everyone who represents you.', active: true },
  { n: '02', heading: 'See Their Stances', body: 'Browse each official\'s verified positions on the issues that shape your community.' },
  { n: '03', heading: 'Vote with Confidence', body: 'Know every name on your ballot before you step into the booth.' },
];

export default function Landing() {
  const [addressInput, setAddressInput] = useState('');
  const addressInputRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const { isLoggedIn, userName, myRepresentatives, myLocationNotSet, compassLoading } = useCompass();

  useGooglePlacesAutocomplete(addressInputRef, {
    onPlaceSelected: (addr) => {
      setAddressInput(addr);
      navigate(`/results?q=${encodeURIComponent(addr)}`);
    },
  });

  // Auto-redirect Connected users who have representatives data
  useEffect(() => {
    if (!compassLoading && isLoggedIn && myRepresentatives && myRepresentatives.length > 0) {
      navigate('/results?prefilled=true', { replace: true });
    }
  }, [compassLoading, isLoggedIn, myRepresentatives, navigate]);

  // Re-check when user returns to tab after setting location elsewhere
  useEffect(() => {
    if (!myLocationNotSet) return;
    const handleVisible = () => {
      if (document.visibilityState === 'visible') window.location.reload();
    };
    document.addEventListener('visibilitychange', handleVisible);
    return () => document.removeEventListener('visibilitychange', handleVisible);
  }, [myLocationNotSet]);

  const handleSearch = () => {
    if (!addressInput.trim()) return;
    navigate(`/results?q=${encodeURIComponent(addressInput.trim())}`);
  };

  const scrollToSearch = () => {
    searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCountyClick = (area) => {
    if (area.browseGovernmentList) {
      const params = new URLSearchParams({
        browse_government_list: area.browseGovernmentList.join(','),
        browse_label: area.county,
      });
      if (area.browseStateAbbrev) params.set('browse_state', area.browseStateAbbrev);
      if (area.browseCountyGeoId) params.set('browse_county_geo_id', area.browseCountyGeoId);
      navigate(`/results?${params}`);
    } else if (area.browseGeoId) {
      const params = new URLSearchParams({
        browse_geo_id: area.browseGeoId,
        browse_mtfcc: area.browseMtfcc,
        browse_label: area.county,
      });
      if (area.browseCityFilter) params.set('browse_city_filter', area.browseCityFilter);
      if (area.browseSchoolFilter) params.set('browse_school_filter', area.browseSchoolFilter);
      navigate(`/results?${params}`);
    } else {
      navigate(`/results?q=${encodeURIComponent(area.address)}`);
    }
  };

  // Name search state
  const [nameQuery, setNameQuery] = useState('');
  const [nameResults, setNameResults] = useState([]);
  const [nameStatus, setNameStatus] = useState('idle');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = nameQuery.trim();
    if (q.length < 2) {
      setNameResults([]);
      setNameStatus('idle');
      return;
    }
    setNameStatus('loading');
    debounceRef.current = setTimeout(async () => {
      const { status, data } = await searchPoliticiansByName(q);
      setNameResults(Array.isArray(data) ? data : []);
      setNameStatus(status === 'fresh' ? 'fresh' : 'error');
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [nameQuery]);

  return (
    <Layout>

      {/* ── Hero ── */}
      <section className="bg-ev-navy text-white min-h-[calc(100vh-73px)] flex items-center">
        <div className="w-full px-12 sm:px-16 lg:px-24 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16 lg:gap-24 items-center">

            {/* Left: headline + copy + CTA */}
            <div>
              <p className="text-ev-teal-light text-xs font-bold uppercase tracking-widest mb-5">
                Empowered Essentials
              </p>
              <h1 className="text-5xl sm:text-6xl font-bold leading-tight text-white">
                Meet everyone<br />who represents you,
              </h1>
              <p className="text-5xl sm:text-6xl font-bold text-ev-teal-light leading-tight mt-1 mb-8">
                at every level.
              </p>
              <p className="text-gray-400 text-lg leading-relaxed mb-3">
                Most voters can't name half the people on their ballot — let alone where they stand on the issues.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed mb-10">
                Our Alpha Counties show exactly where we're headed: your full government, from city hall to Congress, all in one place.
              </p>
              <button
                onClick={scrollToSearch}
                className="inline-flex items-center gap-2 bg-ev-yellow text-black font-bold px-8 py-4 rounded-xl hover:bg-ev-yellow-dark transition-colors text-lg"
              >
                Find My Representatives →
              </button>
            </div>

            {/* Right: step cards */}
            <div className="space-y-3">
              {STEPS.map(({ n, heading, body, active }) => (
                <div
                  key={n}
                  className={`flex items-start gap-4 p-5 rounded-2xl border transition-colors ${
                    active
                      ? 'bg-ev-navy-card border-ev-teal-light'
                      : 'bg-ev-navy-elevated border-white/10'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    active ? 'bg-ev-teal-light/20 text-ev-teal-light' : 'bg-white/10 text-gray-500'
                  }`}>
                    {n}
                  </div>
                  <div>
                    <p className={`font-bold mb-1 ${active ? 'text-white' : 'text-gray-400'}`}>{heading}</p>
                    <p className={`text-sm leading-relaxed ${active ? 'text-gray-300' : 'text-gray-600'}`}>{body}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Search Section ── */}
      <div ref={searchRef} className="scroll-mt-20">
        <main className="container mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col items-center justify-center gap-12">
            <div className="flex-1 max-w-xl w-full text-center">

              <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--ev-teal)] dark:text-ev-teal-light mb-2">
                Choose an Alpha County
              </h2>
              <p className="text-base text-gray-500 dark:text-gray-400 mb-6">
                Each one is a preview of the full Essentials experience.
              </p>

              {/* Coverage area cards */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-2">
                {COVERAGE_AREAS.map((area) => (
                  <button
                    key={area.county}
                    onClick={() => handleCountyClick(area)}
                    className="flex-1 text-left px-4 py-3 bg-white dark:bg-gray-900 border-2 border-[var(--ev-teal)] dark:border-ev-teal-light rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)] focus:ring-offset-2"
                  >
                    <div className="text-base font-semibold text-[var(--ev-teal)] dark:text-ev-teal-light">{area.county}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{area.state}</div>
                  </button>
                ))}
              </div>

              {/* Browse by location link */}
              <div className="text-center mt-2 mb-2">
                <button
                  onClick={() => navigate('/results?mode=browse')}
                  className="text-sm text-[var(--ev-teal)] dark:text-ev-teal-light hover:underline cursor-pointer bg-transparent border-none"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  Browse by location →
                </button>
              </div>

              {!compassLoading && isLoggedIn && myLocationNotSet && (
                <div className="mt-4 px-4 py-3 bg-white dark:bg-gray-900 border border-[var(--ev-teal)] dark:border-ev-teal-light rounded-lg shadow-sm text-center text-sm">
                  <a
                    href="https://app.empowered.vote/settings/location"
                    className="font-semibold text-[var(--ev-teal)] dark:text-ev-teal-light hover:underline"
                  >
                    Set your home location in your profile
                  </a>
                  {' '}<span className="text-gray-700 dark:text-gray-300">to get taken straight to your elected leaders on every visit.</span>
                </div>
              )}

              {/* "or search by address" divider */}
              <div className="relative my-6">
                <hr className="border-gray-200 dark:border-gray-700" />
                <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-[var(--ev-bg-light)] dark:bg-ev-navy px-3 text-sm text-gray-400 dark:text-gray-500">
                  or search by address
                </span>
              </div>

              {/* Search Input + Button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  ref={addressInputRef}
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter your full street address"
                  className="flex-1 min-w-0 px-4 py-3 text-lg border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)] bg-white dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 shadow-sm"
                />
                <button
                  onClick={handleSearch}
                  disabled={!addressInput.trim()}
                  className="px-4 sm:px-8 py-3 text-lg font-bold text-white bg-[var(--ev-teal)] rounded-lg hover:bg-[var(--ev-teal-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Search
                </button>
              </div>

              {/* "or search by name" divider */}
              <div className="relative my-6">
                <hr className="border-gray-200 dark:border-gray-700" />
                <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-[var(--ev-bg-light)] dark:bg-ev-navy px-3 text-sm text-gray-400 dark:text-gray-500">
                  or search by name
                </span>
              </div>

              {/* Name Search Input */}
              <div className="relative">
                <svg
                  width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={nameQuery}
                  onChange={(e) => setNameQuery(e.target.value)}
                  placeholder="Search candidates by name…"
                  aria-label="Search candidates by name"
                  className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)] bg-white dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 shadow-sm"
                />
              </div>

              {/* Name Search Results */}
              {nameQuery.trim().length >= 2 && (
                <div className="mt-2 text-left">
                  {nameStatus === 'loading' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-2">Searching&hellip;</p>
                  )}
                  {nameStatus === 'fresh' && nameResults.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No candidates match &ldquo;{nameQuery.trim()}&rdquo;.</p>
                  )}
                  {nameStatus === 'error' && (
                    <p className="text-sm text-red-500 py-2">Search failed. Try again.</p>
                  )}
                  {nameStatus === 'fresh' && nameResults.length > 0 && (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                      {nameResults.map((pol) => (
                        <li key={pol.id}>
                          <Link
                            to={`/politician/${pol.id}`}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--ev-bg-light)] dark:hover:bg-gray-800 transition-colors"
                          >
                            {pol.photo_origin_url && (
                              <img
                                src={pol.photo_origin_url}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-[var(--ev-teal)] dark:text-ev-teal-light truncate">{pol.full_name}</div>
                              {(pol.office_title || pol.representing_state) && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {[pol.office_title, pol.representing_state].filter(Boolean).join(' — ')}
                                </div>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {nameQuery.trim().length < 2 && nameQuery.trim().length > 0 && (
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500 text-left">Type at least 2 letters to search.</p>
              )}

            </div>
          </div>
        </main>
      </div>

    </Layout>
  );
}
