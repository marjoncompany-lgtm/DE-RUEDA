// Procedural vector SVG QR Matrix generator for employee ID & attendance
export function generateSvgQRCode(payloadText: string, size = 180): string {
  let hash = 0;
  for (let i = 0; i < payloadText.length; i++) {
    hash = (hash << 5) - hash + payloadText.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  const modules = 25; // 25x25 QR Grid
  const cellSize = size / modules;
  let svgCells = '';

  // Draw 3 Standard Corner Position Detection Patterns (7x7)
  function drawFinder(startX: number, startY: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          svgCells += `<rect x="${(startX + c) * cellSize}" y="${(startY + r) * cellSize}" width="${cellSize}" height="${cellSize}" fill="#080f0d"/>`;
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(modules - 7, 0);
  drawFinder(0, modules - 7);

  // Deterministic data cells derived from payload string
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      // Skip finder areas
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= modules - 8) ||
        (r >= modules - 8 && c < 8)
      ) {
        continue;
      }
      // Timing tracks
      if (r === 6 || c === 6) {
        if ((r + c) % 2 === 0) {
          svgCells += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#080f0d"/>`;
        }
        continue;
      }
      // Data cell bit calculation
      const charIndex = (r * modules + c) % payloadText.length;
      const charCode = payloadText.charCodeAt(charIndex);
      const bit = ((seed ^ (r * 31 + c * 17)) + charCode) % 3 === 0;
      if (bit) {
        svgCells += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#080f0d"/>`;
      }
    }
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="background:#ffffff; border-radius:6px; padding:6px; display:inline-block;">
    ${svgCells}
  </svg>`;
}
