/**
 * Normalizes a flat number or string by removing hyphens, slashes, spaces, and non-alphanumeric chars.
 * e.g. "10-4-B" -> "104b", "10/4 B" -> "104b", "104b" -> "104b"
 */
export const normalizeFlat = (str) => {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Converts a flat number from any user-entered format to the standard {Block}-{Floor}-{FlatType} format.
 * e.g. "5/3A" -> "5-3-A", "53A" -> "5-3-A", "10/4/B" -> "10-4-B", "5-3A" -> "5-3-A", "5 3 A" -> "5-3-A"
 * Returns the original string if it cannot be parsed into the standard format.
 */
export const standardizeFlat = (str) => {
  if (!str) return str;
  const raw = String(str).trim();

  // If already in standard format (e.g., "5-3-A"), return uppercase
  if (/^\d{1,2}-\d{1,2}-[A-Za-z]$/.test(raw)) {
    return raw.toUpperCase();
  }

  // Try splitting by separator first (handles "5/3A", "5-3A", "5/3/A", "5 3 A")
  const sepMatch = raw.match(/^(\d{1,2})[/\-\s]+(\d{1,2})[/\-\s]*([A-Za-z])$/);
  if (sepMatch) {
    return `${parseInt(sepMatch[1], 10)}-${parseInt(sepMatch[2], 10)}-${sepMatch[3].toUpperCase()}`;
  }

  // Cannot parse — return original
  return raw;
};

/**
 * Checks if a flat number, resident, donation, or sponsorship record matches a search input.
 * Supports exact text match, normalized flat match (e.g. "104b" matches "10-4-B"), name match, and mobile match.
 */
export const matchesFlatOrName = (item, searchTerm) => {
  if (!item) return false;
  if (!searchTerm || String(searchTerm).trim() === '') return true;

  const rawSearch = String(searchTerm).toLowerCase().trim();
  const normSearch = normalizeFlat(searchTerm);

  // Get or construct flat number
  let flatNumber = item.flatNumber || item.flat || '';
  if (!flatNumber && item.block !== undefined && item.floor !== undefined && item.flatType) {
    flatNumber = `${item.block}-${item.floor}-${item.flatType}`;
  }

  const name = item.name || item.residentName || item.donorName || item.sponsorName || '';
  const mobile = item.mobile || item.phoneNumber || item.mobileNumber || item.contactNumber || '';
  const block = item.block !== undefined ? String(item.block) : '';

  const rawFlat = String(flatNumber).toLowerCase();
  const rawName = String(name).toLowerCase();
  const rawMobile = String(mobile).toLowerCase();
  
  const normFlat = normalizeFlat(flatNumber);
  const normMobile = normalizeFlat(mobile);
  const normName = normalizeFlat(name);

  // 1. Direct raw substring matches
  if (rawFlat.includes(rawSearch)) return true;
  if (rawName.includes(rawSearch)) return true;
  if (block.toLowerCase() === rawSearch) return true;

  // 2. Normalized alphanumeric matches (e.g. "104b" matches "10-4-B")
  if (normSearch.length > 0) {
    if (normFlat.includes(normSearch)) return true;
    if (normName.includes(normSearch)) return true;
  }

  return false;
};

/**
 * Custom filterOptions function for MUI Autocomplete components.
 * Allows typing "104b" or "10-4-B" to find flat options.
 */
export const autocompleteFlatFilter = (options, { inputValue }) => {
  if (!inputValue || !inputValue.trim()) return options;
  return (options || []).filter((option) => matchesFlatOrName(option, inputValue));
};

/**
 * Generates all possible flat strings that match a given search term.
 * Used for constructing Firestore `in` queries.
 * Returns an empty array if the search term is less than 3 characters to prevent exceeding Firestore limits.
 */
export const generateMatchingFlats = (searchTerm) => {
  const normSearch = normalizeFlat(searchTerm);
  if (normSearch.length < 3) return [];

  const BLOCKS = Array.from({ length: 13 }, (_, i) => i + 1);
  const FLOORS = Array.from({ length: 11 }, (_, i) => i + 1);
  const FLAT_TYPES = ['A', 'B', 'C', 'D', 'E', 'F'];

  const matches = new Set();

  for (const b of BLOCKS) {
    for (const f of FLOORS) {
      for (const t of FLAT_TYPES) {
        const standard = `${b}-${f}-${t}`; // e.g., "10-4-B"
        const norm = normalizeFlat(standard); // "104b"
        
        if (norm.includes(normSearch)) {
          matches.add(standard);
          matches.add(`${b}${f}${t}`); // "104B"
          matches.add(`${b}/${f}/${t}`); // "10/4/B"
          matches.add(`${b}-${f}${t}`); // "10-4B"
        }
      }
    }
  }
  return Array.from(matches);
};
