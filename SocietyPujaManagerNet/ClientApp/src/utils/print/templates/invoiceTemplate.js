import { numberToWordsRupees } from '../../numberToWords';
import { buildUpiUrl } from '../../upiHelper';
import { STAMP_IMAGE_BASE64, SIGNATURE_IMAGE_BASE64 } from '../../printConstants';
import { formatShortDate, formatDateTime } from '../../dateUtils';
import { sz, getPrintHeaderHTML, getPrintHeaderStyles, formatCurrency } from '../shared';
import { printTheme, brand } from '../../../theme/colorTokens';
import { getPrintAssets } from '../../../services/masterConfigService';

export async function getProFormaInvoiceHTML(dataObj, config = {}, forImage = false) {
  let stampImg = config.stampImage;
  let signatureImg = config.signatureImage;
  if (!stampImg || !signatureImg) {
    try {
      const assets = await getPrintAssets();
      stampImg = stampImg || assets?.stampImage || STAMP_IMAGE_BASE64;
      signatureImg = signatureImg || assets?.signatureImage || SIGNATURE_IMAGE_BASE64;
    } catch {
      stampImg = stampImg || STAMP_IMAGE_BASE64;
      signatureImg = signatureImg || SIGNATURE_IMAGE_BASE64;
    }
  }

  const invoiceDate = dataObj.invoiceDate
    ? formatShortDate(dataObj.invoiceDate, config?.dateFormat)
    : formatShortDate(new Date(), config?.dateFormat);
  const refNo = dataObj.invoiceRef || (dataObj.id ? dataObj.id.substring(0, 6).toUpperCase() : '001');

  const committeeName = ((config.committeeName || 'DPC') + ' ' + (config.year || '')).trim().toUpperCase();
  const societyName = (config.societyName || 'Society').trim().toUpperCase();
  const isExternal = (dataObj.sponsorType || 'External') === 'External';
  const isReceived = dataObj.status === 'Received';
  const invoiceTitle = isReceived ? 'Invoice' : 'Pro Forma Invoice';

  const upiUrl = buildUpiUrl({
    amount: dataObj.amount || 0,
    flatNumber: '',
    mode: 'sponsor',
    pa: config?.upiPayeeAddress || '',
    pn: config?.upiPayeeName || '',
    tn: dataObj.sponsorName
  });

  let qrUrl = '';
  try {
    const QRCode = (await import('qrcode')).default;
    qrUrl = await QRCode.toDataURL(upiUrl, { margin: 1, width: 440 });
  } catch (err) {
    console.error('Failed to generate QR code', err);
  }

  // Exact standard A4 dimensions (794px width, 1122px height at 96 DPI)
  const w = '794px';
  const minH = '1120px';

  const html = `
  <div id="invoice-container" style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: ${w}; max-width: ${w}; min-height: ${minH}; background: #ffffff; color: #1e293b; margin: 0 auto; box-sizing: border-box; border: 2px solid #0f172a; padding: 6px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
    
    <div id="invoice-inner-frame" style="border: 1px solid #cbd5e1; padding: 22px 26px; min-height: calc(${minH} - 16px); box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
      
      <style>
        #invoice-container * { box-sizing: border-box; }
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
          #invoice-container {
            width: 100% !important;
            max-width: 100% !important;
            min-height: calc(297mm - 16mm) !important;
            border: 2px solid #0f172a !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            padding: 4px !important;
            page-break-inside: avoid;
          }
          #invoice-inner-frame {
            min-height: calc(297mm - 24mm) !important;
            padding: 16px 20px !important;
          }
        }
        ${getPrintHeaderStyles(forImage)}

        #invoice-container .inv-title-bar {
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
        #invoice-container .inv-title-bar .title-left {
          display: flex;
          flex-direction: column;
        }
        #invoice-container .inv-title-bar .title-main {
          font-size: 16px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          line-height: 1.2;
        }
        #invoice-container .inv-title-bar .title-sub {
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #cbd5e1;
          margin-top: 2px;
        }
        #invoice-container .inv-title-bar .badges-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        #invoice-container .badge-original {
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
        #invoice-container .badge-status {
          font-size: 10px;
          font-weight: 800;
          background: ${isReceived ? '#15803d' : '#ea580c'};
          color: #ffffff;
          padding: 3px 12px;
          border-radius: 20px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }

        #invoice-container .inv-meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px 14px;
          margin-bottom: 16px;
          gap: 12px;
        }
        #invoice-container .meta-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        #invoice-container .meta-cell-label {
          font-size: 9.5px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 700;
        }
        #invoice-container .meta-cell-val {
          font-size: 12.5px;
          color: #0f172a;
          font-weight: 700;
        }

        #invoice-container .inv-bill-to {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 12px 16px;
          margin-bottom: 16px;
        }
        #invoice-container .inv-bill-to .box-header {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 700;
          margin-bottom: 4px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }
        #invoice-container .inv-bill-to .sponsor-name {
          font-size: 17px;
          color: #0f172a;
          font-weight: 800;
          line-height: 1.2;
          margin-top: 4px;
          margin-bottom: 2px;
        }
        #invoice-container .inv-bill-to .sponsor-org {
          font-size: 13px;
          color: #475569;
          font-weight: 600;
          margin-bottom: 6px;
        }
        #invoice-container .inv-bill-to .sponsor-details-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 11px;
          color: #334155;
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px dashed #e2e8f0;
        }
        #invoice-container .sponsor-detail-item {
          display: flex;
          gap: 4px;
        }
        #invoice-container .sponsor-detail-item .lbl {
          color: #64748b;
          font-weight: 600;
        }
        #invoice-container .sponsor-detail-item .val {
          font-weight: 700;
          color: #0f172a;
        }

        #invoice-container .inv-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #cbd5e1;
          margin-bottom: 16px;
        }
        #invoice-container .inv-table th {
          background: #f1f5f9;
          color: #334155;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 8px 12px;
          border-bottom: 2px solid #0f172a;
        }
        #invoice-container .inv-table td {
          padding: 10px 12px;
          font-size: 12.5px;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
        }
        #invoice-container .inv-table .item-cell {
          vertical-align: top;
          min-height: 80px;
          height: 80px;
        }
        #invoice-container .inv-table .total-row td {
          background: #f8fafc;
          border-bottom: none;
          padding: 10px 12px;
        }
        #invoice-container .inv-table .total-row .total-amount {
          color: #c2410c;
          font-size: 18px;
          font-weight: 800;
        }
        #invoice-container .inv-table .total-row .words-cell {
          font-size: 11px;
          color: #475569;
        }

        #invoice-container .inv-bank-card {
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          border: 1px solid #0f172a;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        #invoice-container .inv-bank-card .bank-left {
          padding: 10px 14px;
          font-size: 11px;
          line-height: 1.6;
          flex: 1;
          background: #ffffff;
          border-right: 1px solid #0f172a;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
          min-width: 0;
        }
        #invoice-container .inv-bank-card .bank-left .bank-row {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        #invoice-container .inv-bank-card .qr-right {
          width: 228px;
          padding: 6px 8px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          flex-shrink: 0;
        }

        #invoice-container .inv-terms {
          font-size: 9.5px;
          color: #64748b;
          line-height: 1.4;
          margin-bottom: 16px;
          border-left: 2px solid ${brand.orange};
          padding-left: 8px;
        }

        #invoice-container .inv-signatures {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 10px;
          margin-bottom: 12px;
          padding: 0 8px;
        }
        #invoice-container .sig-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        #invoice-container .sig-line {
          border-top: 1px solid #0f172a;
          padding-top: 4px;
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 6px;
        }

        #invoice-container .inv-footer {
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
        
        <div class="inv-title-bar">
          <div class="title-left">
            <span class="title-main">${invoiceTitle}</span>
          </div>
          <div class="badges-right">
            <span class="badge-original">Original For Sponsor</span>
            <span class="badge-status">${isReceived ? '&#10003; Realized' : 'Payment Due'}</span>
          </div>
        </div>

        <div class="inv-meta-grid">
          <div class="meta-cell">
            <span class="meta-cell-label">Invoice Ref No.</span>
            <span class="meta-cell-val">${refNo}</span>
          </div>
          <div class="meta-cell">
            <span class="meta-cell-label">Date of Issue</span>
            <span class="meta-cell-val">${invoiceDate}</span>
          </div>
          <div class="meta-cell">
            <span class="meta-cell-label">Payment Terms</span>
            <span class="meta-cell-val">${isReceived ? 'Paid in Full' : 'Immediate / Advance'}</span>
          </div>
          <div class="meta-cell" style="text-align: right;">
            <span class="meta-cell-label">Financial Year</span>
            <span class="meta-cell-val">${config.year || '2026-27'}</span>
          </div>
        </div>

        <div class="inv-bill-to">
          <div class="box-header">Bill To / Sponsor Particulars</div>
          <div class="sponsor-name">M/s. ${dataObj.sponsorName || '____________________'}</div>
          ${dataObj.organization ? `<div class="sponsor-org">${dataObj.organization}</div>` : ''}
          <div class="sponsor-details-row">
            <div class="sponsor-detail-item">
              <span class="lbl">Category:</span>
              <span class="val">${dataObj.sponsorType || 'External'} Sponsor</span>
            </div>
            ${dataObj.contactNumber ? `<div class="sponsor-detail-item"><span class="lbl">Phone:</span><span class="val">${dataObj.contactNumber}</span></div>` : ''}
            ${dataObj.email ? `<div class="sponsor-detail-item"><span class="lbl">Email:</span><span class="val">${dataObj.email}</span></div>` : ''}
            ${dataObj.trackingLead ? `<div class="sponsor-detail-item"><span class="lbl">Liaison / Lead:</span><span class="val">${dataObj.trackingLead}</span></div>` : ''}
          </div>
        </div>

        <table class="inv-table">
          <thead>
            <tr>
              <th style="text-align: left; width: 5%;">Sl.</th>
              <th style="text-align: left; width: 48%;">Description / Scope of Sponsorship</th>
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
              </td>
              <td class="item-cell" style="text-align: right;">${formatCurrency((dataObj.amount || 0) / (dataObj.invoiceQuantity || 1))}</td>
              <td class="item-cell" style="text-align: center;">${dataObj.invoiceQuantity || 1}</td>
              <td class="item-cell" style="text-align: right; font-weight: 800; font-size: 14px; color: #0f172a;">${formatCurrency(dataObj.amount || 0)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="4" class="words-cell">
                <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Amount in Words</div>
                <div style="font-size: 12.5px; font-weight: 700; color: #0f172a; margin-top: 2px;">Rupees ${numberToWordsRupees(dataObj.amount || 0)}</div>
              </td>
              <td style="text-align: right;" class="total-amount">
                <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Total Amount</div>
                <div style="margin-top: 2px;">${formatCurrency(dataObj.amount || 0)}</div>
              </td>
            </tr>
          </tbody>
        </table>

        ${!isReceived ? `
        <div class="inv-bank-card">
          <div class="bank-left">
            <div style="font-weight: 700; font-size: 11.5px; color: #0f172a; margin-bottom: 2px;">Bank & Payment Particulars</div>
            <div class="bank-row">Beneficiary Account: <strong>${config.chequeFavourName || `Association of ${config.societyName || 'Society'} Flat Owners`}</strong></div>
            <div class="bank-row">Bank: <strong>${config.bankName || '-'}</strong></div>
            <div class="bank-row">A/C No: <strong>${config.bankAccountNumber || '-'}</strong></div>
            <div class="bank-row">IFSC Code: <strong>${config.bankIfscCode || '-'}</strong></div>
            <div class="bank-row">Society PAN: <strong>${config.societyPan || '-'}</strong></div>
            <div class="bank-row">UPI ID: <strong>${config?.upiPayeeAddress || '-'}</strong></div>
            <div class="bank-row" style="margin-top: 2px; font-size: 10px; color: #64748b;">Mode of Settlement: <strong>Cheque / Demand Draft / NEFT / RTGS / UPI</strong></div>
          </div>
          <div class="qr-right">
            ${qrUrl ? `<img src="${qrUrl}" alt="UPI QR" style="width: 215px; height: 215px; display: block; margin: 0 auto; border-radius: 4px;"/>` : ''}
            <div style="font-size: 10.5px; font-weight: 700; margin-top: 5px; color: #0f172a;">Scan to Pay via UPI</div>
          </div>
        </div>
        ` : `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11.5px; font-weight: 700; color: #166534;">Payment Status: REALIZED & SETTLED IN FULL</div>
            <div style="font-size: 10.5px; color: #15803d; margin-top: 2px;">Settlement Mode: <strong>${dataObj.paymentMode || 'Direct Transfer'}</strong> | Date: <strong>${dataObj.transactionDate ? formatShortDate(dataObj.transactionDate, config?.dateFormat) : invoiceDate}</strong></div>
          </div>
          <div style="border: 1.5px solid #16a34a; color: #16a34a; background: #ffffff; border-radius: 4px; padding: 4px 10px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
            &#10003; PAID
          </div>
        </div>
        `}

        <div class="inv-terms">
          ${!isReceived ? `
            1. Payments should be made in favour of "${config.chequeFavourName || `Association of ${config.societyName || 'Society'} Flat Owners`}".<br/>
            2. This is a computer-generated pro forma invoice issued for sponsorship allocation.
          ` : `
            This invoice acknowledges full settlement of sponsorship deliverables for ${committeeName} ${societyName}.
          `}
        </div>
      </div>

      <!-- BOTTOM SIGNATURE SECTION -->
      <div>
        <div class="inv-signatures">
          ${config.enableDigitalStamp !== false ? `
          <div class="sig-col" style="width: 150px;">
            <img src="${stampImg}" alt="Stamp" style="height: 95px; opacity: 0.95; display: block; margin: 0 auto;" />
          </div>` : '<div style="width: 150px;"></div>'}

          <div class="sig-col" style="width: 200px;">
            <div style="font-weight: 700; font-size: 11.5px; color: #0f172a; margin-bottom: 4px;">For ${committeeName} ${societyName}</div>
            ${config.enableDigitalSignature !== false ? `
            <img src="${signatureImg}" alt="Signature" style="height: 48px; margin: 4px auto; display: block;" />
            ` : `
            <div style="height: 48px; border-bottom: 1px dashed #94a3b8; margin: 4px auto 8px auto; width: 160px;"></div>
            `}
            <div class="sig-line" style="width: 180px;">${config.signatoryDesignation || 'Authorized Signatory'}</div>
          </div>
        </div>

        <div class="inv-footer">
          Official Computer-Generated ${invoiceTitle} | Document Ref: ${refNo} | Generated on ${formatDateTime(new Date(), config?.dateFormat)} | Page 1 of 1
        </div>
      </div>

    </div>
  </div>`;

  return forImage
    ? html
    : `<!DOCTYPE html><html><head><title>${invoiceTitle} - ${dataObj.sponsorName || ''}</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>@page { size: A4 portrait; margin: 8mm 10mm; } @media print { html, body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } #invoice-container { width: 100% !important; max-width: 100% !important; min-height: calc(297mm - 16mm) !important; border: 2px solid #0f172a !important; box-shadow: none !important; margin: 0 auto !important; padding: 4px !important; } #invoice-inner-frame { min-height: calc(297mm - 24mm) !important; padding: 16px 20px !important; } }</style></head><body style="margin:0;display:flex;justify-content:center;background:${printTheme.bgGray};padding:30px 10px;">${html}</body></html>`;
}