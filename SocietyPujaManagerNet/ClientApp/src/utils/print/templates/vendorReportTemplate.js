import { formatCurrency, getPrintHeaderHTML, getPrintFooterHTML, getPrintHeaderStyles } from '../shared';
import { formatShortDate } from '../../dateUtils';
import { printTheme, statusBadge } from '../../../theme/colorTokens';

export function getVendorsReportHTML(vendors, config = {}) {
  const committeeName = (config.committeeName || 'Committee').trim().toUpperCase();
  const year = (config.year || '').trim().toUpperCase();

  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
  const yearStr = d.getFullYear();
  const prefix = config.societyName ? config.societyName.toUpperCase().replace(/\s+/g, '_') : 'SOCIETY';
  const docTitle = `${prefix}_DPC_VENDORS_${day}_${month}_${yearStr}`;

  let rows = '';
  vendors.forEach((v, idx) => {
    const totalPaid = (v.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const balance = (v.dealAmount || 0) - totalPaid;
    
    rows += `
      <tr style="background-color: ${printTheme.bgGrayLight}; font-weight: bold;">
        <td>${idx + 1}</td>
        <td>${v.vendorFor || '-'}</td>
        <td>${v.name || '-'}</td>
        <td>${v.contact || '-'}</td>
        <td>${v.dealAmount ? formatCurrency(v.dealAmount) : 'Pay as you go'}</td>
        <td>${formatCurrency(totalPaid)}</td>
        <td style="color: ${balance > 0 ? statusBadge.error.text : statusBadge.success.text};">${v.dealAmount ? formatCurrency(balance) : '-'}</td>
      </tr>
    `;
    
    if (v.payments && v.payments.length > 0) {
      rows += `
        <tr>
          <td></td>
          <td colspan="6" style="padding: 0;">
            <table style="width: 100%; border: none; margin: 0; background-color: ${printTheme.white};">
              <thead>
                <tr style="background-color: ${printTheme.bgSlateSubtle}; font-size: 11px;">
                  <th style="padding: 4px 8px; border: none; border-bottom: 1px solid ${printTheme.borderGray};">Date</th>
                  <th style="padding: 4px 8px; border: none; border-bottom: 1px solid ${printTheme.borderGray};">Mode</th>
                  <th style="padding: 4px 8px; border: none; border-bottom: 1px solid ${printTheme.borderGray};">Amount</th>
                  <th style="padding: 4px 8px; border: none; border-bottom: 1px solid ${printTheme.borderGray};">Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${[...v.payments].sort((a, b) => new Date(a.date) - new Date(b.date)).map(p => `
                  <tr style="font-size: 11px;">
                    <td style="padding: 4px 8px; border: none; border-bottom: 1px solid ${printTheme.bgGray};">${formatShortDate(p.date, config?.dateFormat)}</td>
                    <td style="padding: 4px 8px; border: none; border-bottom: 1px solid ${printTheme.bgGray};">${p.mode || '-'}</td>
                    <td style="padding: 4px 8px; border: none; border-bottom: 1px solid ${printTheme.bgGray}; color: ${statusBadge.success.text}; font-weight: 600;">${formatCurrency(p.amount)}</td>
                    <td style="padding: 4px 8px; border: none; border-bottom: 1px solid ${printTheme.bgGray};">${p.remarks || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </td>
        </tr>
      `;
    }
  });

  return `
    <html>
      <head>
        <title>${docTitle}</title>
        <style>
          ${getPrintHeaderStyles()}
          body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: ${printTheme.slateBody}; }
          .report-title { text-align: center; margin-bottom: 20px; color: ${printTheme.orangeBanner}; font-size: 16px; font-weight: bold; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid ${printTheme.borderGray}; padding: 8px 10px; text-align: left; font-size: 13px; }
          th { background: ${printTheme.bgGray}; color: ${printTheme.slateMedium}; font-weight: 700; }
        </style>
      </head>
      <body>
        ${getPrintHeaderHTML(config)}
        <div class="report-title">Vendors & Payments Report</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Vendor For</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Deal Amount</th>
              <th>Total Paid</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length > 0 ? rows : '<tr><td colspan="7" style="text-align:center;">No vendors found</td></tr>'}
          </tbody>
        </table>
        ${getPrintFooterHTML(config)}
      </body>
    </html>
  `;
}
