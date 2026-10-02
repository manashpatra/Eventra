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

export async function generatePDFFromHTML(htmlContent) {
  const canvas = await generateImageFromHTML(htmlContent);
  const imgData = canvas.toDataURL('image/jpeg', 1.0);
  const { jsPDF } = await import('jspdf');

  const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'px',
    format: [canvas.width, canvas.height]
  });

  pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
  return pdf;
}

export async function generateImageFromHTML(htmlContent) {
  const html2canvas = (await import('html2canvas')).default;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.zIndex = '-1';
  container.innerHTML = htmlContent;

  document.body.appendChild(container);

  // Wait for images
  await waitForImages(container);

  const targetElement = container.firstElementChild || container;

  const canvas = await html2canvas(targetElement, {
    useCORS: true,
    scale: 2,
    backgroundColor: printTheme.white
  });

  document.body.removeChild(container);

  return canvas;
}
