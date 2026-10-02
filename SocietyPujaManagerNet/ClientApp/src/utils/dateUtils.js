/**
 * Get the local date as an ISO string 'YYYY-MM-DD' safely avoiding UTC conversion shifts.
 * @param {Date|string} date - Date to convert. Defaults to current time.
 * @returns {string} - 'YYYY-MM-DD' formatted local date
 */
export const getLocalISODate = (date) => {
  const d = date ? new Date(date) : new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

// ─── Shared Helpers ──────────────────────────────────────────────────────────

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Parse any date-like value into a Date object.
 * Handles: null/undefined, Firestore Timestamps ({seconds}), ISO strings, Date objects.
 * Returns null if parsing fails.
 */
function toDate(value) {
  if (!value) return null;
  if (value.seconds !== undefined) return new Date(value.seconds * 1000);
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Format a date as a numeric string: "dd-MM-YYYY" or "MM-dd-YYYY".
 * @param {*} value - date value
 * @param {string} [fmt='dd-MM-YYYY'] - 'dd-MM-YYYY' or 'MM-dd-YYYY'
 * @returns {string}
 */
export const formatDate = (value, fmt = 'dd-MM-YYYY') => {
  const d = toDate(value);
  if (!d) return '—';
  const dd = pad2(d.getDate());
  const mm = pad2(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  return fmt === 'MM-dd-YYYY' ? `${mm}-${dd}-${yyyy}` : `${dd}-${mm}-${yyyy}`;
};

/**
 * Format a date with short month name: "dd-MMM-YYYY" or "MMM-dd-YYYY".
 * @param {*} value - date value
 * @param {string} [fmt='dd-MM-YYYY'] - 'dd-MM-YYYY' or 'MM-dd-YYYY'
 * @returns {string}
 */
export const formatShortDate = (value, fmt = 'dd-MM-YYYY') => {
  const d = toDate(value);
  if (!d) return '—';
  const dd = pad2(d.getDate());
  const mmm = SHORT_MONTHS[d.getMonth()];
  const yyyy = d.getFullYear();
  return fmt === 'MM-dd-YYYY' ? `${mmm}-${dd}-${yyyy}` : `${dd}-${mmm}-${yyyy}`;
};

/**
 * Format a date with time: "dd-MM-YYYY, hh:mm AM/PM" or "MM-dd-YYYY, hh:mm AM/PM".
 * @param {*} value - date value
 * @param {string} [fmt='dd-MM-YYYY'] - 'dd-MM-YYYY' or 'MM-dd-YYYY'
 * @returns {string}
 */
export const formatDateTime = (value, fmt = 'dd-MM-YYYY') => {
  const d = toDate(value);
  if (!d) return '—';
  const datePart = formatDate(value, fmt);
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${datePart}, ${time}`;
};

/**
 * Returns the MUI DatePicker `format` prop string matching the config.
 * @param {string} [fmt='dd-MM-YYYY'] - 'dd-MM-YYYY' or 'MM-dd-YYYY'
 * @returns {string} e.g. 'dd-MM-yyyy' or 'MM-dd-yyyy'
 */
export const getDatePickerFormat = (fmt = 'dd-MM-YYYY') => {
  return fmt === 'MM-dd-YYYY' ? 'MM-dd-yyyy' : 'dd-MM-yyyy';
};

/**
 * Calculates remaining days until targetDate (calendar days in local timezone).
 * @param {string|Date} targetDate 
 * @returns {number|null} days remaining (positive = future, 0 = today, negative = past)
 */
export const getDaysRemaining = (targetDate) => {
  if (!targetDate) return null;
  const d = toDate(targetDate);
  if (!d) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

/**
 * Gets the configured Puja start date from config (checking pujaStartDate or earliest food day).
 * @param {object} config 
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
export const getPujaStartDate = (config) => {
  if (config?.pujaStartDate) {
    return config.pujaStartDate;
  }
  if (Array.isArray(config?.foodDays) && config.foodDays.length > 0) {
    const validDates = config.foodDays
      .filter((d) => d && d.date && d.enabled !== false)
      .map((d) => d.date)
      .sort();
    if (validDates.length > 0) return validDates[0];
  }
  return '2026-10-15';
};

