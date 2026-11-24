/**
 * Returns the WCAG contrast ratio between two relative luminance values.
 *
 * The result is in the range 1–21.
 */
export function contrastRatio(
  luminanceA: number,
  luminanceB: number,
): number {
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);

  return (lighter + 0.05) / (darker + 0.05);
}
