/**
 * Returns the WCAG relative luminance of an opaque HEX color.
 *
 * Supported formats: #RGB, #RRGGBB
 *
 * @example
 * getRelativeLuminance("#000000") // 0
 * getRelativeLuminance("#ffffff") // 1
 */
export function getRelativeLuminance(color: string): number {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());

  if (!match) {
    throw new TypeError(
      `Invalid HEX color: ${color}. Expected #RGB or #RRGGBB.`,
    );
  }

  const hex = match[1];
  const normalized = hex.length === 3
    ? [...hex].map((digit) => digit + digit).join("")
    : hex;

  const rgb = [0, 2, 4].map((index) =>
    Number.parseInt(normalized.slice(index, index + 2), 16) / 255
  );

  const linear = rgb.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );

  return (
    0.2126 * linear[0] +
    0.7152 * linear[1] +
    0.0722 * linear[2]
  );
}

/**
 * Returns either black or white, whichever provides
 * the higher WCAG contrast ratio against the background.
 *
 * @example
 * getContrastColor("#0f172a") // "#ffffff"
 * getContrastColor("#ffffff") // "#000000"
 */
export function getContrastColor(
  background: string,
): "#000000" | "#ffffff" {
  const luminance = getRelativeLuminance(background);

  const whiteRatio = 1.05 / (luminance + 0.05);
  const blackRatio = (luminance + 0.05) / 0.05;

  return whiteRatio >= blackRatio ? "#ffffff" : "#000000";
}
