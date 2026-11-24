/** An 8-bit sRGB color with integer channels in the range 0–255. */
export type RGB = [number, number, number];

const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const ALPHA_HEX_PATTERN = /^#(?:[0-9a-f]{4}|[0-9a-f]{8})$/i;

/**
 * Parses an opaque HEX color into an RGB tuple.
 *
 * Only `#RGB` and `#RRGGBB` are accepted. Alpha-enabled formats such as
 * `#RGBA` and `#RRGGBBAA` are rejected explicitly.
 */
export function parseHexColor(color: string): RGB {
  if (typeof color !== "string") {
    throw new TypeError(
      `Expected a HEX color string, received ${typeof color}.`,
    );
  }

  const value = color.trim();

  if (ALPHA_HEX_PATTERN.test(value)) {
    throw new TypeError(
      `Alpha-enabled HEX colors are not supported: ${color}. ` +
        "Use #RGB or #RRGGBB.",
    );
  }

  if (!HEX_PATTERN.test(value)) {
    throw new TypeError(
      `Invalid HEX color: ${color}. Expected #RGB or #RRGGBB.`,
    );
  }

  const hex = value.slice(1);
  const normalized = hex.length === 3
    ? [...hex].map((digit) => digit + digit).join("")
    : hex;

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

/** Converts an RGB tuple to a normalized, opaque, lowercase HEX color. */
export function rgbToHex(rgb: RGB): string {
  return "#" +
    rgb
      .map((channel) => {
        const clamped = Math.min(255, Math.max(0, Math.round(channel)));

        return clamped.toString(16).padStart(2, "0");
      })
      .join("");
}

/**
 * Composites a base color over a background using encoded sRGB channels.
 *
 * The result is rounded to 8-bit integer channels.
 */
export function mix(base: RGB, background: RGB, alpha: number): RGB {
  return [
    Math.round(base[0] * alpha + background[0] * (1 - alpha)),
    Math.round(base[1] * alpha + background[1] * (1 - alpha)),
    Math.round(base[2] * alpha + background[2] * (1 - alpha)),
  ];
}
