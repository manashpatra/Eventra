import { STAMP_IMAGE_BASE64, SIGNATURE_IMAGE_BASE64 } from '../../printConstants';
import { sz, getPrintHeaderHTML, getPrintHeaderStyles, formatCurrency } from '../shared';
import { formatShortDate, formatDateTime } from '../../dateUtils';
import { printTheme } from '../../../theme/colorTokens';
import { getCachedPrintAssets } from '../../../services/masterConfigService';

export function getReceiptHTML(dataObj, config = {}, forImage = false, receiptTitle = 'Receipt') {
  const cachedAssets = getCachedPrintAssets();
  const stampImg = config.stampImage || cachedAssets.stampImage || STAMP_IMAGE_BASE64;
  const signatureImg = config.signatureImage || cachedAssets.signatureImage || SIGNATURE_IMAGE_BASE64;

  // Determine if this is subscription, donation, or sponsorship based on title
  const isSubscription = receiptTitle.toLowerCase().includes('subscription');
  const isSponsorship = receiptTitle.toLowerCase().includes('sponsorship');
  const isExternal = dataObj.sponsorType === 'External';
  const nameValue = dataObj.donorName || dataObj.residentName || dataObj.sponsorName || dataObj.name || 'N/A';
  const flatLabel = isExternal ? 'Organization:' : 'Flat:';
  const flatValue = isSponsorship ? dataObj.organization : dataObj.flatNumber || 'N/A';
  const amountValue = dataObj.amount || dataObj.subscriptionAmount || 0;

  let gratitudeMsg = 'We are deeply grateful for your generous donation! 🙏';
  if (isSubscription) gratitudeMsg = 'Thank you for your prompt subscription payment! 🙏';
  if (isSponsorship) gratitudeMsg = 'We are deeply grateful for your generous sponsorship! 🙏';

  const html = `
  <div id="receipt-container" style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: ${sz(forImage, '16px', '24px')}; width: ${sz(forImage, '340px', '380px')}; background: ${printTheme.white}; color: ${printTheme.slateBody}; margin: 0 auto; box-sizing: border-box; border: ${sz(forImage, 'none', `1px solid ${printTheme.borderGray}`)}; border-radius: 8px; box-shadow: ${sz(forImage, 'none', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)')};">
    <style>
      #receipt-container { position: relative; }
      #receipt-container .receipt-title {
        text-align: center;
        color: ${printTheme.slateMuted};
        font-size: ${sz(forImage, '11px', '13px')};
        margin: ${sz(forImage, '10px 0 16px', '16px 0 24px')};
        text-transform: uppercase;
        font-weight: 800;
        letter-spacing: ${sz(forImage, '2px', '3px')};
        border-bottom: 2px solid ${printTheme.bgGray};
        padding-bottom: ${sz(forImage, '10px', '16px')};
      }
      #receipt-container .details-box {
        display: flex;
        flex-direction: column;
        gap: ${sz(forImage, '8px', '12px')};
        margin-bottom: ${sz(forImage, '16px', '24px')};
        padding: 0 4px;
      }
      #receipt-container .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: ${sz(forImage, '12px', '13px')};
      }
      #receipt-container .row .label {
        color: ${printTheme.slateSubtle};
        font-size: ${sz(forImage, '10px', '11px')};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }
      #receipt-container .row .value {
        color: ${printTheme.slateHead};
        font-weight: 700;
        font-size: ${sz(forImage, '13px', '14px')};
        text-align: right;
      }
      #receipt-container .amount-box {
        background: ${printTheme.bgSlateLight};
        border: 1px solid ${printTheme.borderSlate};
        border-radius: 8px;
        padding: ${sz(forImage, '12px', '16px')};
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: ${sz(forImage, '16px', '24px')};
      }
      #receipt-container .amount-box .label {
        color: ${printTheme.slateDark};
        font-weight: 800;
        font-size: ${sz(forImage, '12px', '14px')};
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      #receipt-container .amount-box .value {
        color: ${printTheme.orangeBanner};
        font-weight: 800;
        font-size: ${sz(forImage, '20px', '24px')};
      }
      #receipt-container .footer {
        text-align: center;
        border-top: 1px dashed ${printTheme.borderDashedGray};
        padding-top: ${sz(forImage, '16px', '24px')};
      }
      #receipt-container .gratitude-msg {
        background-color: ${printTheme.bgOrangeSoft};
        color: ${printTheme.orangeDeep};
        padding: 10px;
        border-radius: 6px;
        font-size: ${sz(forImage, '11px', '12px')};
        font-weight: 700;
        line-height: 1.4;
        margin: 0 0 ${sz(forImage, '10px', '16px')} 0;
        border: 1px solid ${printTheme.bgOrangeLight};
      }
      #receipt-container .blessing {
        color: ${printTheme.orangeBanner};
        font-size: ${sz(forImage, '12px', '14px')};
        font-weight: 800;
        margin: 0;
        letter-spacing: 0.5px;
      }
      #receipt-container .timestamp {
        color: ${printTheme.slateLight};
        font-size: ${sz(forImage, '8px', '9px')};
        margin-top: ${sz(forImage, '12px', '16px')};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }
      ${getPrintHeaderStyles(forImage)}
    </style>
    
    ${getPrintHeaderHTML(config)}
    
    <div class="receipt-title">${receiptTitle}</div>
    
    <div class="details-box">
      <div class="row">
        <span class="label">Date</span>
        <span class="value">${formatShortDate(dataObj.transactionDate || dataObj.paymentDate || dataObj.createdAt, config?.dateFormat)}</span>
      </div>
      <div class="row">
        <span class="label">Name</span>
        <span class="value">${nameValue}</span>
      </div>
      <div class="row">
        <span class="label">${flatLabel}</span>
        <span class="value">${flatValue}</span>
      </div>
      <div class="row">
        <span class="label">Payment Mode</span>
        <span class="value">${dataObj.paymentMode || 'N/A'}</span>
      </div>
      ${dataObj.remarks ? `
      <div class="row" style="align-items: flex-start;">
        <span class="label" style="margin-top: 2px;">Remarks</span>
        <span class="value" style="font-weight: 500; font-size: ${sz(forImage, '12px', '13px')}; max-width: 60%; text-align: right; line-height: 1.4; color: ${printTheme.slateMuted};">${dataObj.remarks}</span>
      </div>` : ''}
    </div>

    <div class="amount-box">
      <span class="label">Total Amount</span>
      <span class="value">${formatCurrency(amountValue)}</span>
    </div>

    <div class="footer">
      <div class="gratitude-msg">${gratitudeMsg}</div>
      <div class="blessing">Jai Maa Durga! 🌺</div>
      ${isExternal ? `<div style="margin-top: 30px; display: flex; justify-content: flex-end; align-items: flex-end; padding-right: 20px;">
        ${config.enableDigitalStamp !== false ? `
        <img src="${stampImg}" alt="Stamp" style="height: 90px; margin-right: 15px; opacity: 0.9;" />
        ` : ''}
        <div style="text-align: center;">
          ${config.enableDigitalSignature !== false ? `
          <img src="${signatureImg}" alt="Signature" style="height: 40px; margin-bottom: 5px; display: block; margin-left: auto; margin-right: auto;" />
          ` : `
          <div style="height: 40px; border-bottom: 1px dashed ${printTheme.black}; margin-bottom: 5px; width: 150px; margin-left: auto; margin-right: auto;"></div>
          `}
          <div style="border-top: 1px solid ${printTheme.black}; padding-top: 5px; width: 150px; font-weight: bold; font-size: ${sz(forImage, '10px', '11px')};">${config.signatoryDesignation || 'Authorized Signatory'}</div>
        </div>
      </div>`: ''}
      <div class="timestamp">Generated on ${formatDateTime(new Date(), config?.dateFormat)}</div>
    </div>
  </div>`;

  return forImage ? html : `<html><head><title>${receiptTitle}</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;display:flex;justify-content:center;background:${printTheme.bgGray};padding:40px 20px;">${html}</body></html>`;
}
