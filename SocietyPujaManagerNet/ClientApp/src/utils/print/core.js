import { isIOSDevice } from '../deviceUtils';
import { printTheme } from '../../theme/colorTokens';

/**
 * Returns a Promise that resolves once all <img> elements in the container
 * have loaded (or errored), with a 2-second fallback timeout.
 * If there are no images, resolves after a short rendering delay.
 */
function waitForImages(container) {
  return new Promise((resolve) => {
    const images = container.querySelectorAll('img');
    if (images.length === 0) {
      setTimeout(resolve, 100);
      return;
    }
    let loaded = 0;
    const checkAllLoaded = () => {
      loaded++;
      if (loaded >= images.length) resolve();
    };
    images.forEach((img) => {
      if (img.complete) {
        checkAllLoaded();
      } else {
        img.onload = checkAllLoaded;
        img.onerror = checkAllLoaded;
      }
    });
    setTimeout(resolve, 2000); // fallback
  });
}

/**
 * Reliable cross-browser print utility.
 * Uses a hidden iframe to render and print HTML content,
 * avoiding all popup blocker and document.write issues.
 */
export function printHTML(htmlContent) {
  const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
  const printTitle = titleMatch ? titleMatch[1] : null;

  // iOS Safari struggles with printing hidden iframes. 
  // Fallback to a popup window for iOS devices.
  const isIOS = isIOSDevice();
  
  if (isIOS) {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 500);
      return;
    }
    // If blocked by popup blocker, fall back to iframe and hope for the best
  }

  // Remove any existing print iframe
  const existingFrame = document.getElementById('__print_frame__');
  if (existingFrame) existingFrame.remove();

  // Create a hidden iframe
  const iframe = document.createElement('iframe');
  iframe.id = '__print_frame__';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  // Ensure standard mode rendering
  let finalHtml = htmlContent;
  if (!finalHtml.trim().toLowerCase().startsWith('<!doctype')) {
    finalHtml = '<!DOCTYPE html>\n' + finalHtml;
  }

  // Inject a CSS reset to force tight table rows, as Blob URLs can 
  // sometimes use different default User-Agent stylesheet metrics
  const printReset = `
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      table { border-collapse: collapse !important; border-spacing: 0 !important; }
      th, td { 
        padding: 4px 8px !important; 
        line-height: 1.3 !important; 
        height: auto !important; 
        margin: 0 !important;
      }
      p, h1, h2, h3, h4, h5, h6 { margin-top: 0; margin-bottom: 0.5em; }
    </style>
  </head>`;
  
  finalHtml = finalHtml.replace(/<\/head>/i, printReset);

  // Use a Blob URL as a modern, safe alternative to document.write
  // This guarantees exact styling and rendering parity with doc.write
  const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  iframe.onload = () => {
    const doc = iframe.contentDocument || iframe.contentWindow.document;

    // Track if we already triggered print
    let printed = false;
    const doPrint = () => {
      if (printed) return;
      printed = true;
      
      const originalTitle = document.title;
      if (printTitle) {
        document.title = printTitle;
      }

      const restoreTitle = () => {
        if (printTitle && document.title === printTitle) {
          document.title = originalTitle;
        }
        // Cleanup the object URL to avoid memory leaks
        URL.revokeObjectURL(blobUrl);
      };

      iframe.contentWindow.onafterprint = restoreTitle;

      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      
      // Fallback for browsers that don't fire onafterprint reliably
      setTimeout(restoreTitle, 10000);
    };

    // Wait for images to load, then print
    waitForImages(doc).then(doPrint);
  };

  iframe.src = blobUrl;
}

async function renderDOMContainer(htmlContent) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.zIndex = '-1';
  container.innerHTML = htmlContent;

  document.body.appendChild(container);
  await waitForImages(container);
  const targetElement = container.querySelector('#receipt-container, #invoice-container') || container.firstElementChild || container;
  return { container, targetElement };
}

function sanitizePDFText(str) {
  if (!str) return '';
  return str
    .replace(/\u20B9/g, 'Rs. ')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function injectSelectableTextLayer(pdf, targetElement, renderWidth, renderHeight, marginX = 0, marginY = 0) {
  const targetRect = targetElement.getBoundingClientRect();
  if (!targetRect.width || !targetRect.height) return;

  const scaleX = renderWidth / targetRect.width;
  const scaleY = renderHeight / targetRect.height;

  const walker = document.createTreeWalker(
    targetElement,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while ((node = walker.nextNode())) {
    const rawText = node.textContent;
    if (!rawText || !rawText.trim()) continue;

    const parent = node.parentElement;
    if (!parent) continue;

    const tag = parent.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'noscript') continue;

    const style = window.getComputedStyle(parent);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

    const fontSizePx = parseFloat(style.fontSize) || 12;
    const isBold = parseInt(style.fontWeight, 10) >= 600 || style.fontWeight === 'bold' || style.fontWeight === 'bolder';
    const pdfFontSize = fontSizePx * scaleY;

    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = range.getClientRects();

    if (rects.length <= 1) {
      const clean = sanitizePDFText(rawText);
      if (!clean) continue;

      const rect = rects.length === 1 ? rects[0] : range.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;

      const x = marginX + (rect.left - targetRect.left) * scaleX;
      const y = marginY + (rect.top - targetRect.top + fontSizePx * 0.82) * scaleY;

      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.setFontSize(pdfFontSize);
      pdf.text(clean, x, y, { renderingMode: 'invisible' });
    } else {
      // Multi-line text node: extract words and group into visual lines
      const words = [];
      const wordRegex = /\S+/g;
      let match;
      while ((match = wordRegex.exec(rawText)) !== null) {
        const word = match[0];
        const start = match.index;
        const end = start + word.length;
        range.setStart(node, start);
        range.setEnd(node, end);
        const wRect = range.getBoundingClientRect();
        if (wRect.width > 0 && wRect.height > 0) {
          words.push({
            word: word,
            left: wRect.left,
            top: wRect.top,
            bottom: wRect.bottom,
            height: wRect.height
          });
        }
      }

      if (words.length === 0) continue;

      // Group words into lines based on vertical proximity (within 4px)
      const lines = [];
      for (const w of words) {
        let line = lines.find(l => Math.abs(l.top - w.top) < 4);
        if (!line) {
          line = { top: w.top, words: [] };
          lines.push(line);
        }
        line.words.push(w);
      }

      for (const line of lines) {
        line.words.sort((a, b) => a.left - b.left);
        const rawLine = line.words.map(w => w.word).join(' ');
        const cleanLine = sanitizePDFText(rawLine);
        if (!cleanLine) continue;

        const firstWord = line.words[0];
        const x = marginX + (firstWord.left - targetRect.left) * scaleX;
        const y = marginY + (firstWord.top - targetRect.top + fontSizePx * 0.82) * scaleY;

        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        pdf.setFontSize(pdfFontSize);
        pdf.text(cleanLine, x, y, { renderingMode: 'invisible' });
      }
    }
  }
}

export async function generatePDFFromHTML(htmlContent) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const { container, targetElement } = await renderDOMContainer(htmlContent);

  const canvas = await html2canvas(targetElement, {
    useCORS: true,
    scale: 2,
    backgroundColor: printTheme.white,
    logging: false
  });

  const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'pt',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const canvasAspect = canvas.width / canvas.height;

  let renderWidth = pdfWidth;
  let renderHeight = pdfWidth / canvasAspect;

  if (renderHeight > pdfHeight) {
    renderHeight = pdfHeight;
    renderWidth = pdfHeight * canvasAspect;
  }

  const marginX = (pdfWidth - renderWidth) / 2;
  const marginY = (pdfHeight - renderHeight) / 2;

  const imgData = canvas.toDataURL('image/jpeg', 1.0);
  pdf.addImage(imgData, 'JPEG', marginX, marginY, renderWidth, renderHeight);

  try {
    injectSelectableTextLayer(pdf, targetElement, renderWidth, renderHeight, marginX, marginY);
  } catch (err) {
    console.warn('Failed to inject text layer in PDF:', err);
  }

  document.body.removeChild(container);
  return pdf;
}

export async function generateImageFromHTML(htmlContent) {
  const html2canvas = (await import('html2canvas')).default;

  const { container, targetElement } = await renderDOMContainer(htmlContent);

  const canvas = await html2canvas(targetElement, {
    useCORS: true,
    scale: 2,
    backgroundColor: printTheme.white,
    logging: false
  });

  document.body.removeChild(container);

  return canvas;
}
