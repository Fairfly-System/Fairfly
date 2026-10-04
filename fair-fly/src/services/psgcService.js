// PSGC Cloud API — Philippine Standard Geographic Code Service
const PSGC_BASE = 'https://psgc.cloud/api';

export const NCR_REGION = {
  name: 'Metro Manila (NCR)',
  code: '1300000000',
  isRegion: true
};

// In-memory session caches to avoid repetitive network requests across modals
let provincesCache = null;
const municipalitiesCache = new Map();
const barangaysCache = new Map();

async function fetchPsgc(path) {
  const res = await fetch(`${PSGC_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`PSGC API error (${res.status}): Failed to fetch ${path}`);
  }
  return res.json();
}

/**
 * Fetch all Philippine provinces with Metro Manila (NCR) prepended
 * @returns {Promise<Array<{ code: string, name: string, isRegion?: boolean }>>}
 */
export async function fetchProvinces() {
  if (provincesCache) {
    return provincesCache;
  }

  const data = await fetchPsgc('/provinces');
  const sorted = [
    NCR_REGION,
    ...[...data].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  ];

  provincesCache = sorted;
  return sorted;
}

/**
 * Fetch cities and municipalities for a province or NCR region
 * @param {string} provinceCode 
 * @returns {Promise<Array<{ code: string, name: string }>>}
 */
export async function fetchMunicipalities(provinceCode) {
  if (!provinceCode) return [];
  if (municipalitiesCache.has(provinceCode)) {
    return municipalitiesCache.get(provinceCode);
  }

  const endpoint = provinceCode === NCR_REGION.code
    ? `/regions/${provinceCode}/cities-municipalities`
    : `/provinces/${provinceCode}/cities-municipalities`;

  const data = await fetchPsgc(endpoint);
  const sorted = [...data].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  municipalitiesCache.set(provinceCode, sorted);
  return sorted;
}

/**
 * Fetch barangays for a given city / municipality code
 * @param {string} municipalityCode 
 * @returns {Promise<Array<{ code: string, name: string }>>}
 */
export async function fetchBarangays(municipalityCode) {
  if (!municipalityCode) return [];
  if (barangaysCache.has(municipalityCode)) {
    return barangaysCache.get(municipalityCode);
  }

  const data = await fetchPsgc(`/cities-municipalities/${municipalityCode}/barangays`);
  const sorted = [...data].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  barangaysCache.set(municipalityCode, sorted);
  return sorted;
}

/**
 * Formats structured location fields into a canonical comma-separated address string
 * @param {{ building?: string, barangay?: string, municipality?: string, province?: string }} parts 
 * @returns {string}
 */
export function formatAddressString({ building = '', barangay = '', municipality = '', province = '' } = {}) {
  const parts = [];
  if (building && building.trim()) parts.push(building.trim());
  if (barangay && barangay.trim()) parts.push(barangay.trim());
  if (municipality && municipality.trim()) parts.push(municipality.trim());
  if (province && province.trim()) parts.push(province.trim());
  return parts.join(', ');
}

/**
 * Helper to split a legacy single string full name into First Name, Middle Initial, and Last Name
 * Correctly handles common Philippine surnames (e.g., Dela Cruz, Del Rosario, De Los Santos)
 * @param {string} fullName 
 * @returns {{ firstName: string, middleInitial: string, lastName: string }}
 */
export function splitFullName(fullName = '') {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: '', middleInitial: '', lastName: '' };
  }

  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: '', middleInitial: '', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], middleInitial: '', lastName: '' };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], middleInitial: '', lastName: parts[1] };
  }

  // 3 or more parts: e.g. "Juan D. Dela Cruz" or "Juan Dela Cruz"
  // Check if second token is an explicit middle initial (e.g. "D.", "D", "A.")
  const second = parts[1];
  const isSecondMiddleInitial =
    (second.length === 1 && /^[A-Za-z]$/.test(second)) ||
    (second.length === 2 && second.endsWith('.')) ||
    (second.length === 2 && /^[A-Za-z]{2}$/.test(second) && parts.length > 3);

  if (isSecondMiddleInitial) {
    const mi = second.replace('.', '').toUpperCase();
    return {
      firstName: parts[0],
      middleInitial: mi ? `${mi}.` : '',
      lastName: parts.slice(2).join(' ')
    };
  }

  // Not a middle initial: firstName is first token, remainder is compound surname (e.g., "Dela Cruz")
  return {
    firstName: parts[0],
    middleInitial: '',
    lastName: parts.slice(1).join(' ')
  };
}
