import { formatDateTime } from '../dateUtils';
import { printTheme } from '../../theme/colorTokens';

/**
 * Responsive size helper — returns imageVal when forImage is true, printVal otherwise.
 * Reduces repetition of `forImage ? 'Xpx' : 'Ypx'` ternaries across HTML templates.
 */
export function sz(forImage, imageVal, printVal) {
  return forImage ? imageVal : printVal;
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getPrintHeaderHTML(config = {}) {
  const origin = window.location.origin;
  const societyName = (config.societyName || 'Society Name').trim().toUpperCase();
  const committeeName = (config.committeeName || 'Committee').trim().toUpperCase();
  const year = (config.year || '').trim().toUpperCase();
  const address = (config.societyAddress || '').trim();
  const altText = `${societyName} Logo`;

  return `
    <div class="consistent-header">
      <img class="logo-left" src="${origin}/MaaLogo.png" alt="Maa Durga" onerror="this.style.display='none'" />
      <div class="header-center">
        <div class="society-name">${societyName}</div>
        <div class="committee-name">${committeeName}${year ? ` <span class="year">${year}</span>` : ''}</div>
        ${address ? `<div class="header-subtitle">${address}</div>` : ''}
      </div>
      <img class="logo-right" src="${origin}/logo.png" alt="${altText}" onerror="this.style.display='none'" />
    </div>
  `;
}

export function getPrintFooterHTML(config = {}) {
  return `<div class="footer">GENERATED ON ${formatDateTime(new Date(), config?.dateFormat)} | ${config?.societyName || ''} ${config?.committeeName || ''} ${config?.year || ''}</div>`;
}

export function getPrintHeaderStyles(forImage = false) {
  return `
    .consistent-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid ${printTheme.orangeBanner};
      padding-bottom: ${sz(forImage, '12px', '16px')};
      margin-bottom: ${sz(forImage, '12px', '16px')};
      gap: ${sz(forImage, '8px', '16px')};
    }
    .consistent-header img.logo-left,
    .consistent-header img.logo-right {
      height: ${sz(forImage, '44px', '56px')};
      width: auto;
      object-fit: contain;
    }
    .consistent-header .header-center {
      flex: 1;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: ${sz(forImage, '2px', '4px')};
    }
    .consistent-header .society-name {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: ${sz(forImage, '14px', '17px')};
      font-weight: 800;
      color: ${printTheme.orangeBanner};
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.1;
    }
    .consistent-header .committee-name {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: ${sz(forImage, '11px', '13px')};
      font-weight: 700;
      color: ${printTheme.slateMedium};
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      line-height: 1.2;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
    }
    .consistent-header .year {
      margin-left: 5px;
      color: ${printTheme.slateHead};
    }
    .consistent-header .header-subtitle {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: ${sz(forImage, '8px', '10px')};
      font-weight: 500;
      color: ${printTheme.slateSubtle};
      margin: 2px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      line-height: 1.4;
      max-width: ${sz(forImage, '240px', '280px')};
    }
    @media (min-width: 500px) {
      .consistent-header img.logo-left,
      .consistent-header img.logo-right {
        height: ${sz(forImage, '56px', '68px')};
      }
      .consistent-header .society-name {
        font-size: ${sz(forImage, '18px', '22px')};
      }
      .consistent-header .committee-name {
        font-size: ${sz(forImage, '13px', '15px')};
      }
      .consistent-header .header-subtitle {
        font-size: ${sz(forImage, '10px', '12px')};
        max-width: ${sz(forImage, '300px', '380px')};
      }
    }
    .footer {
      text-align: center;
      color: ${printTheme.slateLight};
      font-size: 11px;
      margin-top: 20px;
      border-top: 1px dashed ${printTheme.borderDashedLight};
      padding-top: 8px;
      text-transform: uppercase;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
  `;
}
