import { numberToWordsRupees } from '../../numberToWords';
import { STAMP_IMAGE_BASE64, SIGNATURE_IMAGE_BASE64 } from '../../printConstants';
import { formatShortDate, formatDateTime } from '../../dateUtils';
import { sz, getPrintHeaderHTML, getPrintHeaderStyles, formatCurrency } from '../shared';
import { printTheme, brand } from '../../../theme/colorTokens';

export function getSponsorshipReceiptHTML(dataObj, config = {}, forImage = false) {
  const receiptDate = dataObj.transactionDate
    ? formatShortDate(dataObj.transactionDate, config?.dateFormat)
    : (dataObj.invoiceDate ? formatShortDate(dataObj.invoiceDate, config?.dateFormat) : formatShortDate(new Date(), config?.dateFormat));

  const invoiceRef = dataObj.invoiceRef || '-';
  const receiptNo = dataObj.invoiceRef
    ? dataObj.invoiceRef.replace(/^DPC\//i, 'REC/')
    : `REC/${config?.year || '2026-27'}/${(dataObj.id ? dataObj.id.substring(0, 6).toUpperCase() : '001')}`;

  const committeeName = ((config.committeeName || 'DPC') + ' ' + (config.year || '')).trim().toUpperCase();
  const societyName = (config.societyName || 'Society').trim().toUpperCase();
  const isExternal = (dataObj.sponsorType || 'External') === 'External';
  const isCash = (dataObj.paymentMode || '').trim().toLowerCase() === 'cash';

  // Exact standard A4 dimensions (794px width, 1122px height at 96 DPI)
  const w = '794px';
  const minH = '1120px';

  const html = `
  <div id="receipt-container" style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: ${w}; max-width: ${w}; min-height: ${minH}; background: #ffffff; color: #1e293b; margin: 0 auto; box-sizing: border-box; border: 2px solid #0f172a; padding: 6px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
    
    <div id="receipt-inner-frame" style="border: 1px solid #cbd5e1; padding: 22px 26px; min-height: calc(${minH} - 16px); box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
      
      <style>
        #receipt-container * { box-sizing: border-box; }
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #receipt-container {
            width: 100% !important;
            max-width: 100% !important;
            min-height: calc(297mm - 16mm) !important;
            border: 2px solid #0f172a !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            padding: 4px !important;
            page-break-inside: avoid;
          }
          #receipt-inner-frame {
            min-height: calc(297mm - 24mm) !important;
            padding: 16px 20px !important;
          }
        }
        ${getPrintHeaderStyles(forImage)}
        
        #receipt-container .rcpt-title-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%);
          color: #ffffff;
          border-radius: 6px;
          border-top: 3px solid ${brand.orange};
          padding: 10px 18px;
          margin: 14px 0 16px 0;
        }
        #receipt-container .rcpt-title-banner .title-left {
          display: flex;
          flex-direction: column;
        }
        #receipt-container .rcpt-title-banner .title-main {
          font-size: 16px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          line-height: 1.2;
        }
        #receipt-container .rcpt-title-banner .title-sub {
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #cbd5e1;
          margin-top: 2px;
        }
        #receipt-container .rcpt-title-banner .badges-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        #receipt-container .badge-original {
          font-size: 10px;
          font-weight: 700;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.3);
          color: #ffffff;
          padding: 3px 10px;
          border-radius: 20px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        #receipt-container .badge-paid {
          font-size: 10px;
          font-weight: 800;
          background: #15803d;
          color: #ffffff;
          padding: 3px 12px;
          border-radius: 20px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        
        #receipt-container .rcpt-meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 16px;
          gap: 12px;
        }
        #receipt-container .meta-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        #receipt-container .meta-cell-label {
          font-size: 9.5px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 700;
        }
        #receipt-container .meta-cell-val {
          font-size: 12.5px;
          color: #0f172a;
          font-weight: 700;
        }

        #receipt-container .rcpt-sponsor-box {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 12px 16px;
          margin-bottom: 16px;
        }
        #receipt-container .rcpt-sponsor-box .box-header {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 700;
          margin-bottom: 4px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }
        #receipt-container .rcpt-sponsor-box .sponsor-name {
          font-size: 17px;
          color: #0f172a;
          font-weight: 800;
          line-height: 1.2;
          margin-top: 4px;
          margin-bottom: 2px;
        }
        #receipt-container .rcpt-sponsor-box .sponsor-org {
          font-size: 13px;
          color: #475569;
          font-weight: 600;
          margin-bottom: 6px;
        }
        #receipt-container .rcpt-sponsor-box .sponsor-details-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 11px;
          color: #334155;
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px dashed #e2e8f0;
        }
        #receipt-container .sponsor-detail-item {
          display: flex;
          gap: 4px;
        }
        #receipt-container .sponsor-detail-item .lbl {
          color: #64748b;
          font-weight: 600;
        }
        #receipt-container .sponsor-detail-item .val {
          font-weight: 700;
          color: #0f172a;
        }

        #receipt-container .rcpt-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #cbd5e1;
          margin-bottom: 16px;
        }
        #receipt-container .rcpt-table th {
          background: #f1f5f9;
          color: #334155;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 8px 12px;
          border-bottom: 2px solid #0f172a;
        }
        #receipt-container .rcpt-table td {
          padding: 10px 12px;
          font-size: 12.5px;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
        }
        #receipt-container .rcpt-table .item-cell {
          vertical-align: top;
          min-height: 80px;
          height: 80px;
        }
        #receipt-container .rcpt-table .total-row td {
          background: #f8fafc;
          border-bottom: none;
          padding: 10px 12px;
        }
        #receipt-container .rcpt-table .total-row .total-amount {
          color: #c2410c;
          font-size: 18px;
          font-weight: 800;
        }
        #receipt-container .rcpt-table .total-row .words-cell {
          font-size: 11px;
          color: #475569;
        }

        #receipt-container .rcpt-bank-card {
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          border: 1px solid #0f172a;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        #receipt-container .rcpt-bank-card .bank-left {
          padding: 10px 14px;
          font-size: 11.5px;
          line-height: 1.5;
          flex: 1;
          background: #ffffff;
          border-right: 1px solid #0f172a;
        }
        #receipt-container .rcpt-bank-card .seal-right {
          width: 170px;
          padding: 8px 10px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        #receipt-container .rcpt-terms {
          font-size: 9.5px;
          color: #64748b;
          line-height: 1.4;
          margin-bottom: 16px;
          border-left: 2px solid ${brand.orange};
          padding-left: 8px;
        }

        #receipt-container .rcpt-signatures {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 10px;
          margin-bottom: 12px;
          padding: 0 8px;
        }
        #receipt-container .sig-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        #receipt-container .sig-line {
          border-top: 1px solid #0f172a;
          padding-top: 4px;
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 6px;
        }

        #receipt-container .rcpt-footer {
          text-align: center;
          color: #94a3b8;
          font-size: 8.5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
          border-top: 1px dashed #cbd5e1;
          padding-top: 8px;
          margin-top: 8px;
        }
      </style>

      <!-- TOP SECTION -->
      <div>
        ${getPrintHeaderHTML(config)}
        
        <div class="rcpt-title-banner">
          <div class="title-left">
            <span class="title-main">Official Money Receipt</span>
          </div>
          <div class="badges-right">
            <span class="badge-original">Original For Sponsor</span>
            <span class="badge-paid">&#10003; Paid & Realized</span>
          </div>
        </div>

        <div class="rcpt-meta-grid">
          <div class="meta-cell">
            <span class="meta-cell-label">Receipt Number</span>
            <span class="meta-cell-val">${receiptNo}</span>
          </div>
          <div class="meta-cell">
            <span class="meta-cell-label">Receipt Date</span>
            <span class="meta-cell-val">${receiptDate}</span>
          </div>
          <div class="meta-cell">
            <span class="meta-cell-label">Invoice Ref No.</span>
            <span class="meta-cell-val">${invoiceRef}</span>
          </div>
          <div class="meta-cell" style="text-align: right;">
            <span class="meta-cell-label">Financial Year</span>
            <span class="meta-cell-val">${config.year || '2026-27'}</span>
          </div>
        </div>

        <div class="rcpt-sponsor-box">
          <div class="box-header">Received with thanks from (Sponsor Particulars)</div>
          <div class="sponsor-name">M/s. ${dataObj.sponsorName || '____________________'}</div>
          ${dataObj.organization ? `<div class="sponsor-org">${dataObj.organization}</div>` : ''}
          <div class="sponsor-details-row">
            <div class="sponsor-detail-item">
              <span class="lbl">Category:</span>
              <span class="val">${dataObj.sponsorType || 'External'} Sponsor</span>
            </div>
            ${dataObj.contactNumber ? `<div class="sponsor-detail-item"><span class="lbl">Phone:</span><span class="val">${dataObj.contactNumber}</span></div>` : ''}
            ${dataObj.email ? `<div class="sponsor-detail-item"><span class="lbl">Email:</span><span class="val">${dataObj.email}</span></div>` : ''}
          </div>
        </div>

        <table class="rcpt-table">
          <thead>
            <tr>
              <th style="text-align: left; width: 5%;">Sl.</th>
              <th style="text-align: left; width: 48%;">Sponsorship Particulars / Scope & Deliverables</th>
              <th style="text-align: right; width: 13%;">Rate</th>
              <th style="text-align: center; width: 10%;">Qty</th>
              <th style="text-align: right; width: 24%;">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="item-cell">1</td>
              <td class="item-cell">
                <div style="font-weight: 700; color: #0f172a;">${dataObj.invoiceDescription || 'Festival Corporate Sponsorship & Stall Arrangement'}</div>
                ${dataObj.remarks ? `<div style="font-size: 11px; color: #475569; margin-top: 3px;"><strong>Deliverables:</strong> ${dataObj.remarks}</div>` : ''}
                ${dataObj.statusNote ? `<div style="font-size: 10.5px; color: #15803d; font-weight: 600; margin-top: 2px;"><strong>Ref / Note:</strong> ${dataObj.statusNote}</div>` : ''}
              </td>
              <td class="item-cell" style="text-align: right;">${formatCurrency((dataObj.amount || 0) / (dataObj.invoiceQuantity || 1))}</td>
              <td class="item-cell" style="text-align: center;">${dataObj.invoiceQuantity || 1}</td>
              <td class="item-cell" style="text-align: right; font-weight: 800; font-size: 14px; color: #0f172a;">${formatCurrency(dataObj.amount || 0)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="4" class="words-cell">
                <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Amount Received in Words</div>
                <div style="font-size: 12.5px; font-weight: 700; color: #0f172a; margin-top: 2px;">Rupees ${numberToWordsRupees(dataObj.amount || 0)}</div>
              </td>
              <td style="text-align: right;" class="total-amount">
                <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Total Realized</div>
                <div style="margin-top: 2px;">${formatCurrency(dataObj.amount || 0)}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="rcpt-bank-card">
          <div class="bank-left">
            ${isCash ? `
              <div>Settlement Mode: <strong>Cash Payment</strong> | Status: <strong style="color: #15803d;">RECEIVED IN FULL & ACCOUNTED</strong></div>
            ` : `
              <div>Beneficiary Account: <strong>${config.chequeFavourName || `Association of ${config.societyName || 'Society'} Flat Owners DA`}</strong></div>
              <div>Bank: <strong>ICICI Bank</strong> | A/C No: <strong>627505031179</strong> | IFSC Code: <strong>ICIC0006275</strong></div>
              <div>Society PAN: <strong>AAVCA0550H</strong></div>
              <div>Settlement Mode: <strong>${dataObj.paymentMode || 'Net Banking'}</strong> | Status: <strong style="color: #15803d;">REALIZED & CREDITED IN FULL</strong></div>
            `}
          </div>
          <div class="seal-right">
            <div style="border: 2px solid #15803d; color: #15803d; background: #dcfce7; border-radius: 4px; padding: 5px 12px; font-weight: 800; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">
              &#10003; PAID
            </div>
            <div style="font-size: 10px; font-weight: 700; margin-top: 4px; color: #0f172a;">Realized & Verified</div>
            <div style="font-size: 9px; color: #64748b;">${receiptDate}</div>
          </div>
        </div>

        <div class="rcpt-terms">
          1. Received with thanks from M/s. ${dataObj.sponsorName} the sum of ${formatCurrency(dataObj.amount || 0)} towards sponsorship deliverables.${!isCash ? '<br/>2. Cheques / online transfers are valid subject to realization.' : ''}
        </div>
      </div>

      <!-- BOTTOM SIGNATURE SECTION -->
      <div>
        <div class="rcpt-signatures">
          <div class="sig-col" style="width: 150px;">
            <img src="${STAMP_IMAGE_BASE64}" alt="Stamp" style="height: 95px; opacity: 0.95; display: block; margin: 0 auto;" />
          </div>

          <div class="sig-col" style="width: 200px;">
            <div style="font-weight: 700; font-size: 11.5px; color: #0f172a; margin-bottom: 4px;">For ${committeeName} ${societyName}</div>
            <img src="${SIGNATURE_IMAGE_BASE64}" alt="Signature" style="height: 48px; margin: 4px auto; display: block;" />
            <div class="sig-line" style="width: 180px;">Treasurer / Signatory</div>
          </div>
        </div>

        <div class="rcpt-footer">
          Official Computer-Generated Money Receipt | Document Ref: ${receiptNo} | Issued on ${formatDateTime(new Date(), config?.dateFormat)} | Page 1 of 1
        </div>
      </div>

    </div>
  </div>`;

  return forImage
    ? html
    : `<!DOCTYPE html><html><head><title>Sponsorship Receipt - ${dataObj.sponsorName}</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@page { size: A4 portrait; margin: 8mm 10mm; } @media print { html, body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } #receipt-container { width: 100% !important; max-width: 100% !important; min-height: calc(297mm - 16mm) !important; border: 2px solid #0f172a !important; box-shadow: none !important; margin: 0 auto !important; padding: 4px !important; } #receipt-inner-frame { min-height: calc(297mm - 24mm) !important; padding: 16px 20px !important; } }</style></head><body style="margin:0;display:flex;justify-content:center;background:${printTheme.bgGray};padding:30px 10px;">${html}</body></html>`;
}
