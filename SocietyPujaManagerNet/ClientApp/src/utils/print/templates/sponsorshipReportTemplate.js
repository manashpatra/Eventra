import { formatCurrency, getPrintHeaderHTML, getPrintFooterHTML, getPrintHeaderStyles } from '../shared';
import { printTheme } from '../../../theme/colorTokens';

export function getSponsorshipsReportHTML(sponsorships, config = {}) {
  const committeeName = (config.committeeName || 'Committee').trim().toUpperCase();
  const year = (config.year || '').trim().toUpperCase();

  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
  const yearStr = d.getFullYear();
  const prefix = config.societyName ? config.societyName.toUpperCase().replace(/\s+/g, '_') : 'SOCIETY';
  const docTitle = `${prefix}_DPC_SPO_${day}_${month}_${yearStr}`;

  const rows = sponsorships.map((s, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${s.sponsorName || '-'}</td>
      <td>${s.organization || '-'}</td>
      <td>${s.amount ? formatCurrency(s.amount) : '-'}</td>
      <td>${s.trackingLead || '-'}</td>
      <td>${s.status || '-'}</td>
      <td>${s.statusNote || '-'}</td>
    </tr>
  `).join('');

  return `
    <html>
      <head>
        <title>${docTitle}</title>
        <style>
          ${getPrintHeaderStyles()}
          body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: ${printTheme.slateBody}; }
          .report-title { text-align: center; margin-bottom: 20px; color: ${printTheme.orangeBanner}; font-size: 16px; font-weight: bold; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid ${printTheme.borderGray}; padding: 10px; text-align: left; font-size: 13px; }
          th { background: ${printTheme.bgGray}; color: ${printTheme.slateMedium}; font-weight: 700; }
        </style>
      </head>
      <body>
        ${getPrintHeaderHTML(config)}
        <div class="report-title">Sponsorships Status Report</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Sponsor</th>
              <th>Organization</th>
              <th>Amount</th>
              <th>Tracking Lead</th>
              <th>Status</th>
              <th>Status Note</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        ${getPrintFooterHTML(config)}
      </body>
    </html>
  `;
}
