import { numberToWordsRupees } from '../../numberToWords';
import { buildUpiUrl } from '../../upiHelper';
import { STAMP_IMAGE_BASE64, SIGNATURE_IMAGE_BASE64 } from '../../printConstants';
import { formatShortDate } from '../../dateUtils';
import { sz, getPrintHeaderHTML, getPrintHeaderStyles, formatCurrency } from '../shared';
import { printTheme, brand } from '../../../theme/colorTokens';

export async function getProFormaInvoiceHTML(dataObj, config = {}, forImage = false) {
  const invoiceDate = dataObj.invoiceDate ? formatShortDate(dataObj.invoiceDate, config?.dateFormat) : formatShortDate(new Date(), config?.dateFormat);
  const refNo = dataObj.invoiceRef || (dataObj.id ? dataObj.id.substring(0, 6).toUpperCase() : '001');

  const committeeName = ((config.committeeName || 'DPC') + ' ' + (config.year || '')).trim().toUpperCase();
  const societyName = (config.societyName || 'Society').trim().toUpperCase();
  const isExternal = dataObj.sponsorType === 'External';
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
    qrUrl = await QRCode.toDataURL(upiUrl, { margin: 1, width: 120 });
  } catch (err) {
    console.error('Failed to generate QR code', err);
  }

  const p = forImage ? '20px' : '28px';
  const w = forImage ? '800px' : '800px';
  const fs = forImage ? '13px' : '14px';
  const fsSmall = forImage ? '10px' : '11px';
  const fsMed = forImage ? '12px' : '13px';

  const html = `
  <div id="invoice-container" style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: ${p}; width: ${w}; max-width: ${w}; background: ${printTheme.white}; color: ${printTheme.slateBody}; margin: 0 auto; box-sizing: border-box; border: ${sz(forImage, 'none', `1px solid ${printTheme.borderGray}`)}; border-radius: 10px; box-shadow: ${sz(forImage, 'none', '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)')};">
    
    <style>
      #invoice-container * { box-sizing: border-box; }
      ${getPrintHeaderStyles(forImage)}
      #invoice-container .inv-title-bar {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 24px;
        background: linear-gradient(135deg, ${brand.orangeDeep}, ${brand.orange});
        color: ${printTheme.white};
        border-radius: 6px;
        padding: ${sz(forImage, '8px 16px', '10px 20px')};
        margin: ${sz(forImage, '12px 0 18px', '16px 0 24px')};
      }
      #invoice-container .inv-title-bar .inv-title {
        font-size: ${sz(forImage, '14px', '16px')};
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      #invoice-container .inv-title-bar .inv-badge {
        font-size: ${fsSmall};
        font-weight: 700;
        background: rgba(255,255,255,0.2);
        padding: 3px 10px;
        border-radius: 20px;
        letter-spacing: 1px;
        text-transform: uppercase;
      }
      #invoice-container .inv-meta {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: ${sz(forImage, '18px', '24px')};
        padding: 0 4px;
      }
      #invoice-container .inv-meta .meta-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      #invoice-container .inv-meta .meta-label {
        font-size: ${fsSmall};
        color: ${printTheme.slateLight};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }
      #invoice-container .inv-meta .meta-value {
        font-size: ${fs};
        color: ${printTheme.slateHead};
        font-weight: 700;
      }
      #invoice-container .inv-to {
        background: ${printTheme.bgSlateLight};
        border: 1px solid ${printTheme.borderSlate};
        border-radius: 8px;
        padding: ${sz(forImage, '12px 14px', '14px 18px')};
        margin-bottom: ${sz(forImage, '18px', '24px')};
      }
      #invoice-container .inv-to .to-label {
        font-size: ${fsSmall};
        color: ${printTheme.slateLight};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      #invoice-container .inv-to .to-name {
        font-size: ${sz(forImage, '15px', '17px')};
        color: ${printTheme.slateHead};
        font-weight: 800;
        margin-bottom: 2px;
      }
      #invoice-container .inv-to .to-org {
        font-size: ${fsMed};
        color: ${printTheme.slateSubtle};
        font-weight: 500;
      }
      #invoice-container .inv-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin-bottom: 0;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid ${printTheme.borderSlate};
      }
      #invoice-container .inv-table th {
        background: ${printTheme.bgSlateSubtle};
        color: ${printTheme.slateMedium};
        font-size: ${fsSmall};
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: ${sz(forImage, '8px 10px', '10px 14px')};
        border-bottom: 2px solid ${printTheme.borderSlate};
      }
      #invoice-container .inv-table td {
        padding: ${sz(forImage, '8px 10px', '10px 14px')};
        font-size: ${fsMed};
        color: ${printTheme.slateMedium};
        border-bottom: 1px solid ${printTheme.bgSlateSubtle};
      }
      #invoice-container .inv-table .item-cell {
        vertical-align: top;
        min-height: ${sz(forImage, '100px', '120px')};
        height: ${sz(forImage, '100px', '120px')};
      }
      #invoice-container .inv-table .total-row td {
        background: ${printTheme.bgSlateLight};
        font-weight: 800;
        border-bottom: none;
      }
      #invoice-container .inv-table .total-row .total-amount {
        color: ${printTheme.orangeBanner};
        font-size: ${sz(forImage, '16px', '18px')};
      }
      #invoice-container .inv-table .total-row .words-cell {
        font-weight: 600;
        font-size: ${fsSmall};
        color: ${printTheme.slateSubtle};
        font-style: italic;
      }
      #invoice-container .inv-footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: ${sz(forImage, '30px', '40px')};
        padding: 0 4px;
      }
      #invoice-container .inv-qr {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      #invoice-container .inv-qr .qr-label {
        font-size: ${sz(forImage, '8px', '9px')};
        color: ${printTheme.slateLight};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }
      #invoice-container .inv-stamp {
        text-align: right;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }
      #invoice-container .inv-stamp .stamp-label {
        font-size: ${fsSmall};
        color: ${printTheme.slateLight};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
        border-top: 2px solid ${printTheme.borderSlate};
        padding-top: 6px;
        margin-top: 4px;
      }
      #invoice-container .inv-stamp .stamp-committee {
        font-size: ${fsMed};
        color: ${printTheme.slateMedium};
        font-weight: 700;
      }
      #invoice-container .inv-generated {
        text-align: center;
        color: ${printTheme.slateLight};
        font-size: ${sz(forImage, '8px', '9px')};
        margin-top: ${sz(forImage, '16px', '24px')};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
        border-top: 1px dashed ${printTheme.borderGray};
        padding-top: ${sz(forImage, '10px', '14px')};
      }
    </style>
    
    ${getPrintHeaderHTML(config)}
    
    <div class="inv-title-bar">
      <span class="inv-title">${dataObj.status === 'Received' ? 'Invoice' : 'Pro Forma Invoice'}</span>
      <span class="inv-badge">Original</span>
    </div>
    
    <div class="inv-meta">
      <div class="meta-item">
        <span class="meta-label">Reference No.</span>
        <span class="meta-value">${refNo}</span>
      </div>
      <div class="meta-item" style="text-align: right;">
        <span class="meta-label">Invoice Date</span>
        <span class="meta-value">${invoiceDate}</span>
      </div>
    </div>
    
    <div class="inv-to">
      <div class="to-label">Bill To</div>
      <div class="to-name">${dataObj.sponsorName || '____________________'}</div>
      ${dataObj.organization ? `<div class="to-org">${dataObj.organization}</div>` : ''}
    </div>
    
    <table class="inv-table">
      <thead>
        <tr>
          <th style="text-align: left; width: 5%;">Sl.</th>
          <th style="text-align: left; width: 45%;">Description</th>
          <th style="text-align: right; width: 15%;">Rate</th>
          <th style="text-align: center; width: 15%;">Qty</th>
          <th style="text-align: right; width: 20%;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="item-cell">1</td>
          <td class="item-cell">
            <div style="font-weight: 500;">${dataObj.invoiceDescription || 'Sponsorship / Stall arrangement'}</div>
            ${dataObj.remarks ? `<div style="font-size: \${sz(forImage, '9px', '10px')}; color: ${printTheme.slateMuted}; font-weight: normal; margin-top: 2px;">${dataObj.remarks}</div>` : ''}
          </td>
          <td class="item-cell" style="text-align: right;">${formatCurrency((dataObj.amount || 0) / (dataObj.invoiceQuantity || 1))}</td>
          <td class="item-cell" style="text-align: center;">${dataObj.invoiceQuantity || 1}</td>
          <td class="item-cell" style="text-align: right; font-weight: 700;">${formatCurrency(dataObj.amount || 0)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="4" class="words-cell">
            Rupees in Words — ${numberToWordsRupees(dataObj.amount || 0)}
          </td>
          <td style="text-align: right;" class="total-amount">
            ${formatCurrency(dataObj.amount || 0)}
          </td>
        </tr>
      </tbody>
    </table>
    ${isExternal ? `<div style="display: flex; justify-content: flex-end; margin-top: 50px; margin-bottom: 30px; align-items: flex-end;">
      <img src="${STAMP_IMAGE_BASE64}" alt="Stamp" style="height: 105px; margin-right: 20px; opacity: 0.9;" />
      <div style="text-align: center;">
        <div style="font-weight: bold; font-size: 12px;">For ${committeeName} ${societyName} Flat Owners</div>
        <img src="${SIGNATURE_IMAGE_BASE64}" alt="Signature" style="height: 50px; margin: 10px auto; display: block;" />
        <div style="border-top: 1px solid ${printTheme.black}; padding-top: 5px; width: 150px; font-weight: bold; margin: 0 auto;">Authorized Signatory</div>
      </div>
    </div>`: ''}

    <div style="display: flex; justify-content: space-between; align-items: stretch; border: 1px solid ${printTheme.black};">
      <div style="padding: 10px; font-size: 12px; line-height: 1.5; flex: 1; border-right: 1px solid ${printTheme.black};">
        <div>Cheque/ DD in favour of : <strong>${config.chequeFavourName || `Association of ${config.societyName || 'Society'} Flat Owners DA`}</strong></div>
        <div>A/C No: <strong>627505031179</strong>; IFSC Code: <strong>ICIC0006275</strong>, Bank Name: ICICI Bank</div>
        <div>PAN: <strong>AAVCA0550H</strong></div>
      </div>
      <div style="padding: 5px; text-align: center; width: 140px;">
        <img src="${qrUrl}" alt="UPI QR" style="width: 100px; height: 100px; display: block; margin: 0 auto;"/>
        <div style="font-size: 10px; font-weight: bold; margin-top: 5px;">Scan to Pay via UPI</div>
      </div>
    </div>  
  </div>`;

  return forImage ? html : `<html><head><title>${dataObj.status === 'Received' ? 'Invoice' : 'Pro Forma Invoice'}</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;display:flex;justify-content:center;background:${printTheme.bgGray};padding:40px 20px;">${html}</body></html>`;
}