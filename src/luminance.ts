import type { RGB } from "./color.ts";

/**
 * Converts an 8-bit sRGB channel to its linear-light value.
 *
 * This is the transfer function used by WCAG relative luminance.
 */
export function srgbToLinear(value: number): number {
  const channel = value / 255;

  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

/** Returns the WCAG relative luminance of an RGB color. */
export function relativeLuminance(rgb: RGB): number {
  return 0.2126 * srgbToLinear(rgb[0]) +
    0.7152 * srgbToLinear(rgb[1]) +
    0.0722 * srgbToLinear(rgb[2]);
}
