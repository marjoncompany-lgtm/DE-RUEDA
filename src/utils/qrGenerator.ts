import QRCode from 'qrcode';

/**
 * Generates an authentic, standards-compliant QR code SVG string.
 * Compatible with any standard QR code reader, physical camera scanner, phone, or turnstile.
 */
export function generateSvgQRCode(payloadText: string, size = 180): string {
  try {
    const qr = QRCode.create(payloadText, { errorCorrectionLevel: 'M' });
    const modules = qr.modules.size;
    const margin = 2;
    const totalGrid = modules + margin * 2;
    const cellSize = size / totalGrid;

    let svgCells = '';
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        if (qr.modules.get(r, c)) {
          const x = ((c + margin) * cellSize).toFixed(2);
          const y = ((r + margin) * cellSize).toFixed(2);
          const w = (cellSize + 0.05).toFixed(2); // slight overlap to eliminate subpixel rendering gaps
          const h = (cellSize + 0.05).toFixed(2);
          svgCells += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#080f0d"/>`;
        }
      }
    }

    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="background:#ffffff; border-radius:6px; padding:6px; display:inline-block;">
      <rect width="${size}" height="${size}" fill="#ffffff"/>
      ${svgCells}
    </svg>`;
  } catch (err) {
    console.warn('Error generating QR SVG:', err);
    // Fallback minimal SVG
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="background:#ffffff; border-radius:6px; padding:6px; display:inline-block;"><text x="50%" y="50%" text-anchor="middle" font-size="12" fill="#000">QR Code Error</text></svg>`;
  }
}

/**
 * Generates a PNG data URL for image export or canvas drawing
 */
export async function generateQrDataUrl(payloadText: string, width = 300): Promise<string> {
  return await QRCode.toDataURL(payloadText, {
    width,
    margin: 2,
    color: {
      dark: '#080f0d',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}
