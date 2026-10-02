import { getPrintHeaderHTML, getPrintFooterHTML, getPrintHeaderStyles, formatCurrency } from '../shared';
import { formatDate } from '../../dateUtils';
import { printTheme, brand } from '../../../theme/colorTokens';

/**
 * Escapes HTML characters to prevent XSS.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates printable HTML report for pending subscriptions.
 * 
 * @param {object} params
 * @param {Array} params.residents - Array of pending residents
 * @param {string|number} params.selectedBlock - 'all' or specific block number
 * @param {object} params.config - Master config object
 * @param {number|null} params.daysToGo - Days remaining until puja starts
 * @param {string} params.pujaStartDate - ISO date string of festival start
 * @returns {string} Complete HTML string ready for printHTML
 */
export function getPendingSubscriptionsHTML({ residents = [], selectedBlock = 'all', config = {}, daysToGo = null, pujaStartDate = '' }) {
  const isAllBlocks = selectedBlock === 'all';
  const blockTitle = isAllBlocks ? 'ALL BLOCKS' : `BLOCK ${selectedBlock}`;
  const blockLabel = isAllBlocks ? 'All Blocks' : `Block ${selectedBlock}`;
  const feePerFlat = Number(config?.subscriptionAmount) || 1500;
  const totalDue = residents.length * feePerFlat;

  const now = new Date();
  const dayStr = String(now.getDate()).padStart(2, '0');
  const monthStr = now.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
  const yearStr = now.getFullYear();
  const societyPrefix = config?.societyName ? config.societyName.toUpperCase().replace(/\s+/g, '_') : 'SOCIETY';
  const docTitle = `${societyPrefix}_PENDING_SUBSCRIPTIONS_${blockTitle.replace(/\s+/g, '_')}_${dayStr}_${monthStr}_${yearStr}`;

  let daysBadgeText = '';
  if (daysToGo !== null && daysToGo !== undefined) {
    if (daysToGo > 1) daysBadgeText = `${daysToGo} Days to Go`;
    else if (daysToGo === 1) daysBadgeText = '1 Day to Go';
    else if (daysToGo === 0) daysBadgeText = 'Starts Today';
    else daysBadgeText = `${config?.pujaName || 'Puja'} Underway`;
  }

  // Group by block if all blocks selected
  const blockGroups = {};
  if (isAllBlocks) {
    residents.forEach((r) => {
      const b = r.block ? String(r.block) : 'Other';
      if (!blockGroups[b]) blockGroups[b] = [];
      blockGroups[b].push(r);
    });
  }

  // Sorted block keys numerically
  const sortedBlockKeys = Object.keys(blockGroups).sort((a, b) => {
    const numA = Number(a);
    const numB = Number(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(docTitle)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 16px 20px;
      color: ${printTheme.text};
      background: #fff;
      margin: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    ${getPrintHeaderStyles(false)}

    .report-title-container {
      text-align: center;
      margin: 12px 0 16px 0;
      border-bottom: 2px solid ${brand.orangeDark};
      padding-bottom: 8px;
    }
    .report-title {
      color: ${brand.orangeDark};
      font-size: 18px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin: 0 0 4px 0;
    }
    .report-subtitle {
      color: ${printTheme.textSecondary};
      font-size: 12px;
      font-weight: 600;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .highlight-pill {
      background: ${printTheme.priceBg};
      border: 1px solid ${printTheme.borderTable};
      padding: 2px 8px;
      border-radius: 12px;
      color: ${brand.orangeDeep};
      font-weight: 700;
    }

    /* Summary KPI Bar */
    .summary-bar {
      display: flex;
      justify-content: space-between;
      background: ${printTheme.summaryBg};
      border: 1px solid ${printTheme.borderTable};
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
      gap: 10px;
    }
    .summary-item {
      text-align: center;
      flex: 1;
    }
    .summary-label {
      font-size: 11px;
      text-transform: uppercase;
      color: ${printTheme.textSecondary};
      font-weight: 600;
      letter-spacing: 0.4px;
    }
    .summary-val {
      font-size: 16px;
      font-weight: 800;
      color: ${brand.orangeDeep};
      margin-top: 2px;
    }

    /* Table styles */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 11px;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
    }
    th {
      background: ${printTheme.priceBg};
      color: ${printTheme.text};
      font-weight: 700;
      padding: 7px 8px;
      border: 1px solid ${printTheme.borderTable};
      text-align: left;
      font-size: 11px;
    }
    td {
      padding: 6px 8px;
      border: 1px solid ${printTheme.borderTable};
      font-size: 11px;
      vertical-align: middle;
    }
    .flat-cell {
      font-weight: 700;
      color: ${brand.orangeDeep};
      white-space: nowrap;
    }
    .name-cell {
      font-weight: 500;
    }
    .amount-cell {
      text-align: right;
      font-weight: 700;
      white-space: nowrap;
    }
    .block-header-row td {
      background: rgba(255, 143, 0, 0.12) !important;
      color: ${brand.orangeDeep};
      font-weight: 800;
      font-size: 12px;
      padding: 8px 10px;
      border-top: 2px solid ${brand.orangeDark};
    }
    .block-subtotal-row td {
      background: #fafafa;
      font-weight: 700;
      font-size: 11px;
      border-bottom: 2px solid ${printTheme.borderTable};
    }
    .grand-total-row td {
      background: ${printTheme.priceBg};
      font-weight: 800;
      font-size: 12px;
      color: ${brand.orangeDeep};
      border-top: 2px solid ${brand.orangeDark};
      padding: 8px;
    }

    /* Collection Guidelines Note */
    .note-box {
      margin-top: 16px;
      padding: 8px 12px;
      background: #fdfdfd;
      border-left: 3px solid ${brand.orangeDark};
      border-top: 1px solid #eee;
      border-right: 1px solid #eee;
      border-bottom: 1px solid #eee;
      font-size: 10px;
      color: ${printTheme.textSecondary};
      line-height: 1.4;
    }

    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 10px;
      color: #888;
      border-top: 1px solid #ddd;
      padding-top: 8px;
    }

    @media print {
      body { padding: 8px 12px; }
      @page {
        size: A4 portrait;
        margin: 10mm 8mm;
      }
    }
  </style>
</head>
<body>
  ${getPrintHeaderHTML(config)}

  <div class="report-title-container">
    <div class="report-title">Pending Puja Subscriptions</div>
    <div class="report-subtitle">
      <span>Block: <strong>${escapeHtml(blockLabel)}</strong></span>
      <span>•</span>
      <span>Puja Start: <strong>${formatDate(pujaStartDate, config?.dateFormat)}</strong></span>
      ${daysBadgeText ? `<span>•</span><span class="highlight-pill">${daysBadgeText}</span>` : ''}
      <span>•</span>
      <span>Subscription: <strong>${formatCurrency(feePerFlat)}</strong></span>
    </div>
  </div>

  <div class="summary-bar">
    <div class="summary-item">
      <div class="summary-label">Target Block</div>
      <div class="summary-val">${escapeHtml(blockLabel)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Pending Flats</div>
      <div class="summary-val">${residents.length}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Total Amount Due</div>
      <div class="summary-val">${formatCurrency(totalDue)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Countdown</div>
      <div class="summary-val" style="font-size: 14px;">${daysBadgeText || 'Active'}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px; text-align: center;">#</th>
        <th style="width: 90px;">Flat</th>
        <th>Resident Name</th>
        <th style="width: 120px;">Mobile</th>
        <th style="width: 100px; text-align: right;">Amount Due</th>
      </tr>
    </thead>
    <tbody>
      ${isAllBlocks ? (
        sortedBlockKeys.map((blockKey) => {
          const list = blockGroups[blockKey];
          const subtotal = list.length * feePerFlat;
          return `
            <tr class="block-header-row">
              <td colspan="5">
                BLOCK ${escapeHtml(blockKey)} &mdash; ${list.length} Pending Flats (${formatCurrency(subtotal)})
              </td>
            </tr>
            ${list.map((r, idx) => `
              <tr>
                <td style="text-align: center; color: #777;">${idx + 1}</td>
                <td class="flat-cell">${escapeHtml(r.flatNumber || `${r.block}-${r.floor}-${r.flatType}`)}</td>
                <td class="name-cell">${escapeHtml(r.name || 'Resident')}</td>
                <td>${escapeHtml(r.mobile || '—')}</td>
                <td class="amount-cell">${formatCurrency(feePerFlat)}</td>
              </tr>
            `).join('')}
            <tr class="block-subtotal-row">
              <td colspan="4" style="text-align: right; text-transform: uppercase;">
                Subtotal Block ${escapeHtml(blockKey)} (${list.length} Flats):
              </td>
              <td class="amount-cell" style="color: ${brand.orangeDeep};">${formatCurrency(subtotal)}</td>
            </tr>
          `;
        }).join('')
      ) : (
        residents.length > 0 ? (
          residents.map((r, idx) => `
            <tr>
              <td style="text-align: center; color: #777;">${idx + 1}</td>
              <td class="flat-cell">${escapeHtml(r.flatNumber || `${r.block}-${r.floor}-${r.flatType}`)}</td>
              <td class="name-cell">${escapeHtml(r.name || 'Resident')}</td>
              <td>${escapeHtml(r.mobile || '—')}</td>
              <td class="amount-cell">${formatCurrency(feePerFlat)}</td>
            </tr>
          `).join('')
        ) : (
          `<tr><td colspan="5" style="text-align: center; padding: 24px; color: #888;">No pending subscriptions for this block.</td></tr>`
        )
      )}
      <tr class="grand-total-row">
        <td colspan="4" style="text-align: right; text-transform: uppercase;">
          Grand Total (${residents.length} Pending Flats):
        </td>
        <td class="amount-cell" style="font-size: 13px;">${formatCurrency(totalDue)}</td>
      </tr>
    </tbody>
  </table>

  <div class="note-box">
    <strong>Committee Note:</strong> Subscriptions can be paid via UPI (${escapeHtml(config?.upiPayeeAddress || 'N/A')}) or Cash/Cheque to the Puja Committee.
  </div>

  ${getPrintFooterHTML(config)}
</body>
</html>`;
}
