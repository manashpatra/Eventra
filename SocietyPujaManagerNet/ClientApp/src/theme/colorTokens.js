/**
 * Centralized Color Tokens
 * ────────────────────────────────────────────────────────────────────────────
 * ALL application colors are defined here.  Never use a raw hex / rgba value
 * in a component – always import from this file.
 *
 * To change a colour across the whole app, edit it ONLY here.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { alpha } from '@mui/material/styles';

// ═══════════════════════════════════════════════════════════════════════════
// 1. BRAND PALETTE  — the core identity colours used throughout the app
// ═══════════════════════════════════════════════════════════════════════════
export const brand = {
  orange:       '#FF8F00',
  orangeDark:   '#E65100',
  orangeDeep:   '#BF360C',
  gold:         '#FFB300',
  goldDark:     '#FFA000',
  goldDeep:     '#F57C00',
  red:          '#C62828',
  deepPurple:   '#4A148C',
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. PALETTE – semantic colours derived from the brand tokens
// ═══════════════════════════════════════════════════════════════════════════

// --- Primary (mode-aware helpers) ---
export const primary = {
  main:     (isDark) => isDark ? brand.orange : brand.orangeDark,
  light:    (isDark) => isDark ? brand.gold   : brand.orange,
  dark:     (isDark) => isDark ? brand.orangeDark : brand.orangeDeep,
  contrastText: '#fff',
};

// --- Secondary ---
export const secondary = {
  main:     (isDark) => isDark ? '#CE93D8' : '#9C27B0',
  light:    (isDark) => isDark ? '#E1BEE7' : '#BA68C8',
  dark:     (isDark) => isDark ? '#AB47BC' : '#7B1FA2',
  contrastText: '#fff',
};

// --- Success / Warning / Error / Info ---
export const status = {
  success: {
    main:  (isDark) => isDark ? '#66BB6A' : '#2E7D32',
    light: (isDark) => isDark ? '#81C784' : '#4CAF50',
    dark:  (isDark) => isDark ? '#388E3C' : '#1B5E20',
    codeGreen: (isDark) => isDark ? '#66BB6A' : '#15803D',
  },
  warning: {
    main:  (isDark) => isDark ? '#FFA726' : '#ED6C02',
    light: (isDark) => isDark ? '#FFB74D' : '#FF9800',
    dark:  (isDark) => isDark ? '#F57C00' : brand.orangeDark,
  },
  error: {
    main:  (isDark) => isDark ? '#EF5350' : '#D32F2F',
    light: (isDark) => isDark ? '#E57373' : '#EF5350',
    dark:  (isDark) => isDark ? '#D32F2F' : brand.red,
  },
  info: {
    main:  (isDark) => isDark ? '#42A5F5' : '#0288D1',
    light: (isDark) => isDark ? '#64B5F6' : '#03A9F4',
    dark:  (isDark) => isDark ? '#1E88E5' : '#01579B',
  },
};

// Flat shorthand for frequently-used status colours
export const errorRed     = '#EF5350';
export const errorRedDark = '#D32F2F';

// ═══════════════════════════════════════════════════════════════════════════
// 3. SURFACE / BACKGROUND  — page backgrounds, cards, drawers, menus, etc.
// ═══════════════════════════════════════════════════════════════════════════
export const surface = {
  // Page-level backgrounds
  pageDark:     '#0A0E1A',
  pageLight:    '#F8FAFC',
  page:         (isDark) => isDark ? '#0A0E1A' : '#F8FAFC',
  bgDark:       '#0A0E1A',
  bgLight:      '#F8FAFC',
  warmCream:    '#FFF7ED',
  adDark:       '#1E1E1E',
  scannerDark:  '#0D0D14',

  // Cards / Paper
  paperDark:    '#111827',
  paperLight:   '#FFFFFF',
  paper:        (isDark) => isDark ? '#111827' : '#FFFFFF',

  // Drawers & elevated surfaces
  drawerDark:   '#0D1117',
  drawerLight:  '#FFFFFF',
  drawer:       (isDark) => isDark ? '#0D1117' : '#FFFFFF',

  // Menus / Popovers
  menuDark:     '#1E2333',
  menuLight:    '#FFFFFF',
  menu:         (isDark) => isDark ? '#1E2333' : '#FFFFFF',
  menuDarkAlt:  '#151924',  // gradient endpoint for dark menus

  // Loading / splash screen background
  loadingBg:    '#0B0F19',

  // Select option / dropdown dark bg
  selectOptionDark: '#1a1f2e',

  // Table header
  tableHeadDark:  '#0D1117',
  tableHeadLight: '#F8FAFC',
  tableHead:      (isDark) => isDark ? '#0D1117' : '#F8FAFC',
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. TEXT COLOURS
// ═══════════════════════════════════════════════════════════════════════════
export const text = {
  primaryDark:    '#F1F5F9',
  primaryLight:   '#090D16',
  primary:        (isDark) => isDark ? '#F1F5F9' : '#090D16',

  secondaryDark:  '#94A3B8',
  secondaryLight: '#334155',
  secondary:      (isDark) => isDark ? '#94A3B8' : '#334155',

  dark:           '#1a1a2e',   // very dark text for certain surfaces
  white:          '#FFFFFF',
  black:          '#000000',
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. BORDERS / DIVIDERS
// ═══════════════════════════════════════════════════════════════════════════
export const border = {
  divider:  (isDark) => isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  subtle:   (isDark) => isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
  medium:   (isDark) => isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.08)',
  input:    (isDark) => isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.16)',
  inputHover:    (isDark) => isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)',
  light:    (isDark) => isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  code:     (isDark) => isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',

  brandSubtle:  (isDark) => isDark ? 'rgba(255,143,0,0.2)' : 'rgba(230,81,0,0.25)',
  brandMedium:  (isDark) => isDark ? 'rgba(255,143,0,0.3)' : 'rgba(230,81,0,0.4)',
  brandStrong:  (isDark) => isDark ? 'rgba(255,143,0,0.5)' : 'rgba(230,81,0,0.4)',

  // Gold variant (theme toggle, language switcher)
  goldSubtle:   (isDark) => isDark ? 'rgba(255,179,0,0.2)' : 'rgba(230,81,0,0.25)',
  goldMedium:   (isDark) => isDark ? 'rgba(255,179,0,0.3)' : 'rgba(230,81,0,0.3)',
  goldStrong:   (isDark) => isDark ? 'rgba(255,179,0,0.45)' : 'rgba(230,81,0,0.5)',
};

// ═══════════════════════════════════════════════════════════════════════════
// 6. TRANSPARENT OVERLAYS / TINTS (background highlights, hover states)
// ═══════════════════════════════════════════════════════════════════════════
export const overlay = {
  // Brand-tinted overlays
  brandXLight: (isDark) => isDark ? 'rgba(255,143,0,0.04)' : 'rgba(255,143,0,0.06)',
  brandLight:  (isDark) => isDark ? 'rgba(255,143,0,0.08)' : 'rgba(230,81,0,0.06)',
  brandMedium: (isDark) => isDark ? 'rgba(255,143,0,0.12)' : 'rgba(230,81,0,0.1)',
  brandStrong: (isDark) => isDark ? 'rgba(255,143,0,0.16)' : 'rgba(230,81,0,0.15)',
  brandBold:   (isDark) => isDark ? 'rgba(255,143,0,0.22)' : 'rgba(230,81,0,0.18)',

  // Gold-tinted overlays (for theme/language toggles)
  goldXLight:  (isDark) => isDark ? 'rgba(255,179,0,0.06)' : 'rgba(230,81,0,0.04)',
  goldLight:   (isDark) => isDark ? 'rgba(255,179,0,0.1)'  : 'rgba(230,81,0,0.08)',
  goldMedium:  (isDark) => isDark ? 'rgba(255,179,0,0.12)' : 'rgba(230,81,0,0.1)',
  goldStrong:  (isDark) => isDark ? 'rgba(255,179,0,0.15)' : 'rgba(230,81,0,0.12)',

  // Neutral overlays (white / black tints)
  neutralXLight: (isDark) => isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
  neutralLight:  (isDark) => isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
  neutralMedium: (isDark) => isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  neutralStrong: (isDark) => isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)',

  // White overlays (used in scrollbar / banner etc.)
  whiteLight:   'rgba(255,255,255,0.02)',
  whiteMedium:  'rgba(255,255,255,0.04)',
  whiteStrong:  'rgba(255,255,255,0.06)',
  whiteBold:    'rgba(255,255,255,0.15)',
  whiteXBold:   'rgba(255,255,255,0.25)',

  // Error / red tint
  errorLight:     'rgba(239,83,80,0.08)',
  errorMedium:    'rgba(239,83,80,0.12)',
  errorStrong:    'rgba(239,83,80,0.15)',
  errorBorder:    'rgba(239,83,80,0.25)',
  errorBorderStrong: 'rgba(239,83,80,0.3)',

  // Glass panels for AppBars / Update prompt
  glassDark:  'rgba(18, 18, 18, 0.95)',
  glassLight: 'rgba(255, 255, 255, 0.95)',
  glass:      (isDark) => isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',

  // Backdrop overlays
  backdropDark:       'rgba(0,0,0,0.7)',
  backdropLight:      'rgba(0,0,0,0.4)',
  backdrop:           (isDark) => isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
  processingBackdrop: 'rgba(11, 15, 25, 0.7)',

  // Selection highlight
  selectionBg:   'rgba(255, 143, 0, 0.3)',

  // Brand shadow overlay for banner indicator dots
  brandDot:       'rgba(255,143,0,0.7)',
  brandDotInactive: 'rgba(255,255,255,0.15)',

  // Brand glow used on box-shadows
  brandGlow:      'rgba(255,143,0,0.3)',
  brandGlowLight: 'rgba(255,143,0,0.15)',
  brandGlowStrong:'rgba(255,143,0,0.4)',
  brandGlowHero:  'rgba(255,143,0,0.12)',
  brandGlowXLight:'rgba(255,143,0,0.08)',

  // Black shadows
  shadowDark:     'rgba(0,0,0,0.4)',
  shadowMedium:   'rgba(0,0,0,0.2)',
  shadowLight:    'rgba(0,0,0,0.12)',
  shadowXLight:   'rgba(0,0,0,0.05)',
  shadowBlack:    'rgba(0,0,0,0.3)',
  shadowXDark:    'rgba(0,0,0,0.6)',
  shadowXXLight:  'rgba(0,0,0,0.03)',
  shadowMild:     'rgba(0,0,0,0.08)',
  shadowCard:     'rgba(0,0,0,0.04)',
};

// ═══════════════════════════════════════════════════════════════════════════
// 7. GRADIENTS
// ═══════════════════════════════════════════════════════════════════════════
export const gradient = {
  // Primary brand gradients
  brand:          `linear-gradient(135deg, ${brand.orange} 0%, ${brand.orangeDark} 100%)`,
  brandHover:     `linear-gradient(135deg, ${brand.gold} 0%, ${brand.orange} 100%)`,
  brandDark:      `linear-gradient(135deg, ${brand.orangeDark} 0%, ${brand.orangeDeep} 100%)`,
  brandHorizontal:`linear-gradient(90deg, ${brand.orange}, ${brand.gold})`,

  // Install / CTA gradients
  ctaGold:        `linear-gradient(135deg, ${brand.gold} 0%, ${brand.orange} 100%)`,
  ctaGoldHover:   `linear-gradient(135deg, ${brand.goldDark} 0%, ${brand.goldDeep} 100%)`,

  // Text gradient (for brand headings)
  brandText:      `linear-gradient(135deg, ${brand.gold}, ${brand.orange})`,
  brandTextFull:  `linear-gradient(135deg, ${brand.gold}, ${brand.orange}, ${brand.orangeDark})`,

  // Special UI gradients
  purpleVibrant:      'linear-gradient(135deg, #7C4DFF 0%, #651FFF 100%)',
  purpleVibrantHover: 'linear-gradient(135deg, #651FFF 0%, #6200EA 100%)',
  success:            'linear-gradient(135deg, #66BB6A, #43A047)',

  // Surface gradients (for dialogs, sidebar header)
  surfaceDark:   'linear-gradient(135deg, rgba(17,24,39,0.98) 0%, rgba(13,17,23,0.98) 100%)',
  surfaceDarkAlt:'linear-gradient(to bottom, #1E2333, #151924)',
  menuDark:      `linear-gradient(165deg, ${surface.menuDark} 0%, ${surface.menuDarkAlt} 100%)`,

  // Background glow tints
  brandTint:      (isDark) => isDark
    ? 'linear-gradient(135deg, rgba(255,143,0,0.15) 0%, rgba(230,81,0,0.08) 100%)'
    : 'linear-gradient(135deg, rgba(255,143,0,0.10) 0%, rgba(230,81,0,0.04) 100%)',
  brandPreview:   'linear-gradient(135deg, rgba(255,143,0,0.08) 0%, rgba(255,179,0,0.04) 100%)',
  heroLight:      'linear-gradient(135deg, #FFFFFF 0%, #FFF8EE 50%, #FEF3C7 100%)',

  // Error surface
  errorSurface:   `linear-gradient(135deg, rgba(239, 83, 80, 0.08) 0%, rgba(17, 24, 39, 0.95) 100%)`,

  // Accent line
  accentLine:     `linear-gradient(90deg, transparent, ${brand.orange}, ${brand.gold}, ${brand.orange}, transparent)`,

  // Radial brand glow
  radialBrandGlow:'radial-gradient(circle, rgba(255,143,0,0.15) 0%, transparent 70%)',

  // Menu CTA gradient
  menuButton:      'linear-gradient(45deg, #FF9800, #F44336)',
  menuButtonHover: 'linear-gradient(45deg, #F57C00, #D32F2F)',

  // Purple / Indigo unlock gradient
  indigoPurple:     'linear-gradient(135deg, #7C4DFF 0%, #536DFE 100%)',
  indigoPurpleHover:'linear-gradient(135deg, #651FFF 0%, #304FFE 100%)',

  // Danger / test gradient
  danger:          'linear-gradient(135deg, #EF5350 0%, #B71C1C 100%)',

  // Gold tint subtle (language selection dialog)
  goldTint: (isDark) => isDark
    ? 'linear-gradient(135deg, rgba(255,179,0,0.1), rgba(230,81,0,0.05))'
    : 'linear-gradient(135deg, rgba(255,179,0,0.15), rgba(230,81,0,0.08))',
};

// ═══════════════════════════════════════════════════════════════════════════
// 8. SHADOWS (composite box-shadow strings)
// ═══════════════════════════════════════════════════════════════════════════
export const shadow = {
  danger:           '0 4px 14px rgba(239, 83, 80, 0.4)',
  menuButton:       '0 4px 12px rgba(244,67,54,0.3)',
  cardHoverDark:    `0 8px 32px ${overlay.brandGlowHero}`,
  cardHoverLight:   `0 10px 25px ${overlay.shadowMild}, 0 0 12px ${overlay.brandGlowHero}`,
  cardHover:        (isDark) => isDark ? shadow.cardHoverDark : shadow.cardHoverLight,

  dialogDark:       `0 20px 60px ${overlay.shadowXDark}`,
  dialogLight:      `0 20px 40px ${overlay.shadowLight}`,
  dialog:           (isDark) => isDark ? `0 20px 60px ${overlay.shadowXDark}` : `0 20px 40px ${overlay.shadowLight}`,

  menuDark:         `0 10px 30px rgba(0,0,0,0.5)`,
  menuLight:        `0 10px 30px ${overlay.shadowLight}`,
  menu:             (isDark) => isDark ? '0 10px 30px rgba(0,0,0,0.5)' : `0 10px 30px ${overlay.shadowLight}`,

  paperDark:        'none',
  paperLight:       `0 1px 3px 0 ${overlay.shadowXLight}, 0 1px 2px -1px ${overlay.shadowXLight}`,

  brandBtn:         `0 2px 12px ${overlay.brandGlow}`,
  brandBtnHover:    `0 4px 16px ${overlay.brandGlowStrong}`,

  tooltipShadow:    `0 4px 14px ${overlay.shadowMedium}`,

  installIcon:      `0 4px 10px ${overlay.brandGlow}`,
  logoShadow:       `0 4px 16px ${overlay.brandGlow}`,
  loadingLogo:      `0 10px 40px ${overlay.brandGlow}`,

  glass:            (isDark) => isDark ? `0 8px 32px ${overlay.shadowDark}` : `0 8px 32px ${overlay.shadowLight}`,

  notifCard:        (isDark) => isDark ? `0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)` : `0 20px 40px ${overlay.shadowLight}`,
};

// ═══════════════════════════════════════════════════════════════════════════
// 9. SCROLLBAR
// ═══════════════════════════════════════════════════════════════════════════
export const scrollbar = {
  thumbDark:  '#334155',
  thumbLight: '#CBD5E1',
  thumb:      (isDark) => isDark ? '#334155' : '#CBD5E1',
};

// ═══════════════════════════════════════════════════════════════════════════
// 10. ROLE COLOURS  — for user role badges in admin panel
// ═══════════════════════════════════════════════════════════════════════════
export const roleColors = {
  'Super Admin': { text: '#EF5350', bg: 'rgba(239,83,80,0.12)', border: 'rgba(239,83,80,0.25)' },
  'Admin':       { text: '#5C6BC0', bg: 'rgba(92,107,192,0.12)', border: 'rgba(92,107,192,0.25)' },
  'Treasurer':       { text: '#42A5F5', bg: 'rgba(66,165,245,0.12)', border: 'rgba(66,165,245,0.25)' },
  'Joint Treasurer': { text: '#42A5F5', bg: 'rgba(66,165,245,0.12)', border: 'rgba(66,165,245,0.25)' },
  'Secretary':       { text: '#29B6F6', bg: 'rgba(41,182,246,0.12)', border: 'rgba(41,182,246,0.25)' },
  'Joint Secretary': { text: '#29B6F6', bg: 'rgba(41,182,246,0.12)', border: 'rgba(41,182,246,0.25)' },
  'Auditor':     { text: '#AB47BC', bg: 'rgba(171,71,188,0.12)', border: 'rgba(171,71,188,0.25)' },
  'Standard':    { text: '#FFA726', bg: 'rgba(255,167,38,0.12)', border: 'rgba(255,167,38,0.25)' },
  'Cultural':    { text: '#26A69A', bg: 'rgba(38,166,154,0.12)', border: 'rgba(38,166,154,0.25)' },
  'Collection':  { text: '#FFB74D', bg: 'rgba(255,183,77,0.12)', border: 'rgba(255,183,77,0.25)' },
  'FoodCoupon':  { text: '#FF7043', bg: 'rgba(255,112,67,0.12)', border: 'rgba(255,112,67,0.25)' },
  'Food Seller': { text: '#7C4DFF', bg: 'rgba(124,77,255,0.12)', border: 'rgba(124,77,255,0.25)' },
  default:       { text: '#FFFFFF', bg: 'rgba(255,255,255,0.1)',  border: 'rgba(255,255,255,0.2)' },
};

export const getRoleColor = (role = '') => {
  if (!role) return roleColors.default;
  if (roleColors[role]) return roleColors[role];
  const normalized = String(role).toLowerCase().replace(/[\s_-]+/g, '');
  for (const [key, val] of Object.entries(roleColors)) {
    if (key.toLowerCase().replace(/[\s_-]+/g, '') === normalized) return val;
  }
  if (normalized.includes('super')) return roleColors['Super Admin'];
  if (normalized.includes('admin')) return roleColors['Admin'];
  return roleColors.default;
};

// Status badges (used for info/success/warning/error chips and summary counters)
export const statusBadge = {
  info:    { text: '#42A5F5', bg: 'rgba(66,165,245,0.12)' },
  success: { text: '#66BB6A', bg: 'rgba(102,187,106,0.12)' },
  warning: { text: '#FFA726', bg: 'rgba(255,167,38,0.12)' },
  error:   { text: '#EF5350', bg: 'rgba(239,83,80,0.12)' },
  purple:  { text: '#7C4DFF', bg: 'rgba(124,77,255,0.12)', dark: '#5E35B1', border: 'rgba(124,77,255,0.25)' },
  donation: { text: '#CE93D8', bg: 'rgba(206,147,216,0.12)' },
  souvenir: { text: '#4FC3F7', bg: 'rgba(79,195,247,0.12)' },
  expense: { text: '#4DD0E1', bg: 'rgba(77,208,225,0.12)' },
  teal:    { text: '#26A69A', bg: 'rgba(38,166,154,0.12)' },
  gold:    { text: '#FFCA28', bg: 'rgba(255,202,40,0.12)' },
  lightGreen: { text: '#9CCC65', bg: 'rgba(156,204,101,0.12)' },
  slate:   { text: '#78909C', bg: 'rgba(120,144,156,0.12)' },
  inactive: { text: '#9E9E9E', bg: 'rgba(158,158,158,0.1)' },
};

// ═══════════════════════════════════════════════════════════════════════════
// 11. MEAL TYPE COLOURS — food menu indicators
// ═══════════════════════════════════════════════════════════════════════════
export const mealType = {
  Veg:       { color: (isDark) => isDark ? '#4CAF50' : '#2E7D32', bg: (isDark) => isDark ? 'rgba(102,187,106,0.15)' : 'rgba(46,125,50,0.12)' },
  Khichuri:  { color: (isDark) => isDark ? '#66BB6A' : '#388E3C', bg: (isDark) => isDark ? 'rgba(129,199,132,0.15)' : 'rgba(56,142,60,0.12)' },
  Lucchi:    { color: (isDark) => isDark ? '#388E3C' : '#2E7D32', bg: (isDark) => isDark ? 'rgba(76,175,80,0.15)'  : 'rgba(46,125,50,0.12)' },
  Chicken:   { color: (isDark) => isDark ? '#FF5722' : '#E65100', bg: (isDark) => isDark ? 'rgba(255,112,67,0.15)' : 'rgba(230,81,0,0.12)' },
  Mutton:    { color: (isDark) => isDark ? '#D32F2F' : '#C62828', bg: (isDark) => isDark ? 'rgba(211,47,47,0.15)'  : 'rgba(198,40,40,0.12)' },
  'Non-Veg': { color: (isDark) => isDark ? '#F44336' : '#D32F2F', bg: (isDark) => isDark ? 'rgba(239,83,80,0.15)'  : 'rgba(211,47,47,0.12)' },
  default:   { color: (isDark) => isDark ? '#FFA726' : '#E65100', bg: (isDark) => isDark ? 'rgba(255,167,38,0.15)' : 'rgba(230,81,0,0.12)' },
};

export const getMealTypeColor = (type, isDark) => {
  const entry = mealType[type] || mealType.default;
  return { bg: entry.bg(isDark), color: entry.color(isDark) };
};

// ═══════════════════════════════════════════════════════════════════════════
// 12. UPI PAYMENT CARD ACCENT COLOURS
// ═══════════════════════════════════════════════════════════════════════════
export const upiAccent = {
  donation: { accent: '#CE93D8', gradientStart: '#CE93D8', gradientEnd: '#AB47BC' },
  event:    { accent: brand.gold, gradientStart: brand.gold, gradientEnd: brand.goldDeep },
  default:  { accent: brand.orange, gradientStart: brand.orange, gradientEnd: brand.orangeDark },
};

export const getUpiAccent = (isDonation, isEvent) => {
  if (isDonation) return upiAccent.donation;
  if (isEvent)    return upiAccent.event;
  return upiAccent.default;
};

// ═══════════════════════════════════════════════════════════════════════════
// 13. THIRD-PARTY / EXTERNAL BRAND COLOURS  — kept separate intentionally
// ═══════════════════════════════════════════════════════════════════════════
export const thirdParty = {
  // iOS
  iosBlue:      '#007AFF',
  iosBlueHover: '#0056b3',

  // WhatsApp
  whatsapp:     '#25D366',

  // Google brand colours (for Google Translate attribution)
  googleBlue:   '#4285F4',
  googleRed:    '#EA4335',
  googleYellow: '#FBBC05',
  googleGreen:  '#34A853',
};

// ═══════════════════════════════════════════════════════════════════════════
// 14. URGENT / NOTICE TICKER
// ═══════════════════════════════════════════════════════════════════════════
export const ticker = {
  bg:           '#FFEBEE',
  border:       '#EF5350',
  tagBg:        '#EF5350',
  tagColor:     '#FFFFFF',
  textColor:    '#C62828',
  hoverBg:      'rgba(239, 83, 80, 0.12)',
};

// ═══════════════════════════════════════════════════════════════════════════
// 15. APPBAR
// ═══════════════════════════════════════════════════════════════════════════
export const appBar = {
  bg: (isDark) => isDark ? `rgba(10, 14, 26, 0.85)` : `rgba(255, 255, 255, 0.88)`,
};

// ═══════════════════════════════════════════════════════════════════════════
// 16. TOOLTIP
// ═══════════════════════════════════════════════════════════════════════════
export const tooltip = {
  bgDark:  '#1E293B',
  bgLight: '#0F172A',
  bg:      (isDark) => isDark ? '#1E293B' : '#0F172A',
  color:   '#FFFFFF',
};

// ═══════════════════════════════════════════════════════════════════════════
// 17. FOOD COUPON TICKETS
// ═══════════════════════════════════════════════════════════════════════════
export const foodTicketTheme = {
  Veg:       { bg: 'rgba(76,175,80,0.08)',  accent: '#4CAF50', border: 'rgba(76,175,80,0.25)',  label: '🥬 Veg',      chipBg: 'rgba(76,175,80,0.15)' },
  Khichuri:  { bg: 'rgba(129,199,132,0.08)', accent: '#81C784', border: 'rgba(129,199,132,0.25)', label: '🍚 Khichuri', chipBg: 'rgba(129,199,132,0.15)' },
  Lucchi:    { bg: 'rgba(76,175,80,0.08)',  accent: '#66BB6A', border: 'rgba(76,175,80,0.25)',  label: '🫓 Lucchi',   chipBg: 'rgba(76,175,80,0.15)' },
  Chicken:   { bg: 'rgba(255,152,0,0.08)', accent: '#FF9800', border: 'rgba(255,152,0,0.25)', label: '🍗 Chicken',  chipBg: 'rgba(255,152,0,0.15)' },
  Mutton:    { bg: 'rgba(211,47,47,0.08)',  accent: '#D32F2F', border: 'rgba(211,47,47,0.25)',  label: '🍖 Mutton',   chipBg: 'rgba(211,47,47,0.15)' },
  'Non-Veg': { bg: 'rgba(244,67,54,0.08)',  accent: '#F44336', border: 'rgba(244,67,54,0.25)',  label: '🍖 Non-Veg',  chipBg: 'rgba(244,67,54,0.15)' },
};

export const defaultTicketTheme = {
  bg: 'rgba(255,143,0,0.08)',
  accent: brand.orange,
  border: 'rgba(255,143,0,0.25)',
  label: '🍽️ Food',
  chipBg: 'rgba(255,143,0,0.15)',
};

// ═══════════════════════════════════════════════════════════════════════════
// 18. CHARTS & DATA VISUALIZATION
// ═══════════════════════════════════════════════════════════════════════════
export const chartPalette = [
  '#FF8F00', '#42A5F5', '#66BB6A', '#CE93D8', '#EF5350',
  '#4DD0E1', '#FFA726', '#AB47BC', '#26A69A', '#EC407A',
  '#5C6BC0', '#8D6E63', '#78909C',
];

// ═══════════════════════════════════════════════════════════════════════════
// 19. SOCIETY DIRECTORY CONTACTS
// ═══════════════════════════════════════════════════════════════════════════
export const societyDirectoryColors = {
  facility:    { primary: '#42A5F5', bg: 'rgba(66,165,245,0.12)' },
  support:     { primary: '#EF5350', bg: 'rgba(239,83,80,0.12)' },
  technical:   { primary: '#66BB6A', bg: 'rgba(102,187,106,0.12)' },
  civil:       { primary: '#CE93D8', bg: 'rgba(206,147,216,0.12)' },
  security:    { primary: '#FF8A65', bg: 'rgba(255,138,101,0.12)' },
  housekeeping:{ primary: '#26A69A', bg: 'rgba(38,166,154,0.12)' },
  incharge:    { primary: '#AB47BC', bg: 'rgba(171,71,188,0.12)' },
  default:     { primary: brand.orange, bg: 'rgba(255,143,0,0.12)' },
};

export const getSocietyContactColor = (role) => {
  const lower = (role || '').toLowerCase();
  if (lower.includes('facility')) return societyDirectoryColors.facility;
  if (lower.includes('support')) return societyDirectoryColors.support;
  if (lower.includes('technical')) return societyDirectoryColors.technical;
  if (lower.includes('civil')) return societyDirectoryColors.civil;
  if (lower.includes('security')) return societyDirectoryColors.security;
  if (lower.includes('house keeping') || lower.includes('housekeeping')) return societyDirectoryColors.housekeeping;
  if (lower.includes('incharge') || lower.includes('in charge')) return societyDirectoryColors.incharge;
  return societyDirectoryColors.default;
};

// ═══════════════════════════════════════════════════════════════════════════
// 20. DPC COMMITTEE ROLE COLOURS
// ═══════════════════════════════════════════════════════════════════════════
export const dpcRoleColors = {
  President: { primary: brand.gold, bg: 'rgba(255,179,0,0.12)' },
  Secretary: { primary: '#42A5F5', bg: 'rgba(66,165,245,0.12)' },
  Treasurer: { primary: '#66BB6A', bg: 'rgba(102,187,106,0.12)' },
  Convenor:  { primary: '#CE93D8', bg: 'rgba(206,147,216,0.12)' },
  Cultural:  { primary: '#FF8A65', bg: 'rgba(255,138,101,0.12)' },
  default:   { primary: brand.orange, bg: 'rgba(255,143,0,0.12)' },
};

export const getDpcRoleColor = (role = '') => {
  if (role.includes('President')) return dpcRoleColors.President;
  if (role.includes('Secretary') && !role.includes('Cultural')) return dpcRoleColors.Secretary;
  if (role.includes('Treasurer')) return dpcRoleColors.Treasurer;
  if (role.includes('Convenor')) return dpcRoleColors.Convenor;
  if (role.includes('Cultural')) return dpcRoleColors.Cultural;
  return dpcRoleColors.default;
};

// ═══════════════════════════════════════════════════════════════════════════
// 21. CULTURAL EVENTS
// ═══════════════════════════════════════════════════════════════════════════
export const cultural = {
  pink:           '#D81B60',
  pinkDark:       '#C2185B',
  bgLight:        'rgba(216, 27, 96, 0.12)',
  bgSubtle:       'rgba(216, 27, 96, 0.04)',
  bgMedium:       'rgba(216, 27, 96, 0.08)',
  gradient:       'linear-gradient(135deg, #D81B60 0%, #C2185B 100%)',
  closedGradient: 'linear-gradient(135deg, #FF9800 0%, #F44336 100%)',
  closedBg:       (isDark) => isDark
    ? 'linear-gradient(135deg, rgba(255,152,0,0.15) 0%, rgba(244,67,54,0.10) 100%)'
    : 'linear-gradient(135deg, rgba(255,152,0,0.08) 0%, rgba(244,67,54,0.05) 100%)',
};

// ═══════════════════════════════════════════════════════════════════════════
// 22. PRINT / DOCUMENT THEMES
// ═══════════════════════════════════════════════════════════════════════════
export const printTheme = {
  text:           '#333333',
  textSecondary:  '#666666',
  headingRed:     '#d32f2f',
  headingBlue:    '#1976d2',
  borderDivider:  '#eeeeee',
  tagBorder:      '#4CAF50',
  priceBg:        '#f5f5f5',
  menuText:       '#444444',
  parcelBg:       '#e3f2fd',
  parcelText:     '#1565c0',
  badgeVegBg:     '#e8f5e9',
  badgeVegText:   '#2e7d32',
  badgeVegBorder: '#c8e6c9',
  badgeNonVegBg:  '#ffebee',
  badgeNonVegText:'#c62828',
  badgeNonVegBorder:'#ffcdd2',
  receiptCyan:    '#00ACC1',
  textMuted:      '#999999',
  borderTable:    '#dddddd',
  summaryBg:      '#FFF8E1',
  borderDashed:   '#cccccc',
  footerText:     '#888888',
  orangeBanner:   '#E65100',
  orangeBannerBg: '#fff8e1',
  orangeBannerHighlight: '#ffe0b2',

  // Modern PDF & Document print styling
  white:          '#ffffff',
  black:          '#000000',
  slateDark:      '#0f172a',
  slateHead:      '#111827',
  slateBody:      '#1f2937',
  slateMedium:    '#374151',
  slateMuted:     '#4b5563',
  slateSubtle:    '#6b7280',
  slateLight:     '#9ca3af',
  bgGrayLight:    '#f9fafb',
  bgGray:         '#f3f4f6',
  bgSlateLight:   '#f8fafc',
  bgSlateSubtle:  '#f1f5f9',
  bgOrangeSoft:   '#fff7ed',
  bgOrangeLight:  '#ffedd5',
  orangeDeep:     '#c2410c',
  borderGray:     '#e5e7eb',
  borderSlate:    '#e2e8f0',
  borderDashedGray: '#d1d5db',
  borderDashedLight: '#dddddd',
};

// ═══════════════════════════════════════════════════════════════════════════
// 22b. UPI APPS PALETTE
// ═══════════════════════════════════════════════════════════════════════════
export const upiAppPalette = {
  gpay:       { color: '#ffffff', text: '#3c4043' },
  phonepe:    { color: '#5E35B1', text: '#ffffff' },
  paytm:      { color: '#00BAF2', text: '#ffffff' },
  bhim:       { color: '#F26522', text: '#ffffff' },
  cred:       { color: '#212121', text: '#ffffff' },
  amazon:     { color: '#FF9900', text: '#000000' },
  supermoney: { color: '#2C2CC9', text: '#ffffff' },
};

// ═══════════════════════════════════════════════════════════════════════════
// 23. SPONSORSHIP PALETTE
// ═══════════════════════════════════════════════════════════════════════════
export const sponsorshipPalette = {
  gross:    '#4DD0E1',
  external: '#42A5F5',
  cam:      '#FFA726',
  internal: '#AB47BC',
  net:      '#66BB6A',
  pending:  '#FF7043',
};

// ═══════════════════════════════════════════════════════════════════════════
// 24. LEADS PALETTE
// ═══════════════════════════════════════════════════════════════════════════
export const leadsPalette = {
  total:     { color: '#7C4DFF', bg: 'rgba(124, 77, 255, 0.15)' },
  pending:   { color: '#FFB300', bg: 'rgba(255, 179, 0, 0.15)' },
  amount:    { color: '#42A5F5', bg: 'rgba(66, 165, 245, 0.15)' },
  converted: { color: '#66BB6A', bg: 'rgba(102, 187, 106, 0.15)' },
};

// ═══════════════════════════════════════════════════════════════════════════
// 25. CASH IN HAND PALETTE
// ═══════════════════════════════════════════════════════════════════════════
export const cashInHandPalette = {
  total:      { color: '#00BFA5', bg: 'rgba(0, 191, 165, 0.15)' },
  members:    { color: '#7C4DFF', bg: 'rgba(124, 77, 255, 0.15)' },
  added:      { color: '#66BB6A', bg: 'rgba(102, 187, 106, 0.15)' },
  subtracted: { color: '#FF7043', bg: 'rgba(255, 112, 67, 0.15)' },
  transfer:   { color: '#42A5F5', bg: 'rgba(66, 165, 245, 0.15)' },
};




