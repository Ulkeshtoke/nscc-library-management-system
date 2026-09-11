import QRCode from 'qrcode';

/**
 * Generate a reproducible Data URL for an accession code QR
 */
export async function generateQrDataUrl(text, options = {}) {
  if (!text) {
    throw new Error('QR generation requires non-empty content');
  }

  const defaultOptions = {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    quality: 0.92,
    margin: 2,
    width: options.width || 250,
    color: {
      dark: '#1e293b',
      light: '#ffffff',
    },
    ...options,
  };

  return await QRCode.toDataURL(String(text).trim().toUpperCase(), defaultOptions);
}

/**
 * Generate an SVG string for an accession code QR
 */
export async function generateQrSvg(text, options = {}) {
  if (!text) {
    throw new Error('QR generation requires non-empty content');
  }

  const defaultOptions = {
    errorCorrectionLevel: 'M',
    type: 'svg',
    margin: 2,
    width: options.width || 200,
    ...options,
  };

  return await QRCode.toString(String(text).trim().toUpperCase(), defaultOptions);
}
