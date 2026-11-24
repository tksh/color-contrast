import { mix, parseHexColor, type RGB, rgbToHex } from "./color.ts";
import { contrastRatio } from "./contrast.ts";
import { relativeLuminance } from "./luminance.ts";

/** Options for selecting a readable foreground color. */
export interface ContrastOptions {
  /**
   * Preference multiplier for selecting white over black.
   *
   * - `1` selects the color with the highest contrast ratio.
   * - `> 1` makes white more likely to be selected.
   * - `< 1` makes black more likely to be selected.
   */
  bias?: number;

  /**
   * Minimum contrast ratio the final foreground color should reach.
   *
   * Defaults to `4.5`, the WCAG AA threshold for normal-sized text.
   */
  target?: number;
}

/** Detailed result of a readable foreground color calculation. */
export interface ContrastAnalysis {
  /** Final opaque foreground color in lowercase `#rrggbb` form. */
  color: string;
  /** Contrast ratio between the final color and the background. */
  ratio: number;
  /** Opacity of the original black/white base color used for compositing. */
  alpha: number;
  /** Selected base color, either `#000000` or `#ffffff`. */
  base: string;
  /** Contrast ratio of the unadjusted base color against the background. */
  baseRatio: number;
  /** Contrast ratio of pure white against the background. */
  whiteRatio: number;
  /** Contrast ratio of pure black against the background. */
  blackRatio: number;
  /** Normalized background color in lowercase `#rrggbb` form. */
  background: string;
  /** Requested target contrast ratio. */
  target: number;
  /** Whether the final color reaches the requested target. */
  meetsTarget: boolean;
}

const DEFAULT_BIAS = 1;
const DEFAULT_TARGET = 4.5;
const ALPHA_SEARCH_ITERATIONS = 32;

const BLACK: RGB = [0, 0, 0];
const WHITE: RGB = [255, 255, 255];

/**
 * Calculates a readable foreground color for an opaque background color.
 *
 * The foreground starts as pure black or white, whichever has the higher
 * contrast ratio under the configured bias. If that base color exceeds the
 * target ratio, its opacity is reduced toward the background until the target
 * is just met. The result is always an opaque `#rrggbb` color.
 *
 * @example
 * analyzeContrast("#0f172a", { target: 4.5 });
 */
export function analyzeContrast(
  background: string,
  options?: ContrastOptions,
): ContrastAnalysis {
  const backgroundRgb = parseHexColor(background);
  const { bias, target } = resolveOptions(options);

  const backgroundLuminance = relativeLuminance(backgroundRgb);
  const whiteRatio = contrastRatio(1, backgroundLuminance);
  const blackRatio = contrastRatio(0, backgroundLuminance);
  const useWhite = whiteRatio * bias >= blackRatio;

  const base = useWhite ? WHITE : BLACK;
  const baseHex = useWhite ? "#ffffff" : "#000000";
  const baseRatio = useWhite ? whiteRatio : blackRatio;

  let alpha = 1;
  let foreground = base;

  if (baseRatio > target) {
    alpha = findMinimumAlpha(
      base,
      backgroundRgb,
      backgroundLuminance,
      target,
    );
    foreground = mix(base, backgroundRgb, alpha);
  }

  const color = rgbToHex(foreground);
  const ratio = contrastRatio(
    relativeLuminance(foreground),
    backgroundLuminance,
  );

  return {
    color,
    ratio,
    alpha,
    base: baseHex,
    baseRatio,
    whiteRatio,
    blackRatio,
    background: rgbToHex(backgroundRgb),
    target,
    meetsTarget: ratio >= target,
  };
}

/**
 * Returns a readable opaque foreground color for a background color.
 *
 * This is a convenience wrapper around {@link analyzeContrast}.
 *
 * @example
 * getContrastColor("#0f172a"); // "#7b808a" with the default target
 */
export function getContrastColor(
  background: string,
  options?: ContrastOptions,
): string {
  return analyzeContrast(background, options).color;
}

interface ResolvedOptions {
  bias: number;
  target: number;
}

function resolveOptions(options: ContrastOptions | undefined): ResolvedOptions {
  if (options === undefined) {
    return { bias: DEFAULT_BIAS, target: DEFAULT_TARGET };
  }

  if (
    options === null || typeof options !== "object" || Array.isArray(options)
  ) {
    throw new TypeError("Expected options to be an object.");
  }

  const bias = options.bias === undefined ? DEFAULT_BIAS : options.bias;
  const target = options.target === undefined ? DEFAULT_TARGET : options.target;

  validateBias(bias);
  validateTarget(target);

  return { bias, target };
}

function validateBias(value: unknown): asserts value is number {
  if (typeof value !== "number") {
    throw new TypeError(
      `Invalid bias: expected a number, received ${describeType(value)}.`,
    );
  }

  if (!Number.isFinite(value)) {
    throw new RangeError("Invalid bias: expected a finite number.");
  }

  if (value <= 0) {
    throw new RangeError("Invalid bias: expected a number greater than 0.");
  }
}

function validateTarget(value: unknown): asserts value is number {
  if (typeof value !== "number") {
    throw new TypeError(
      `Invalid target: expected a number, received ${describeType(value)}.`,
    );
  }

  if (!Number.isFinite(value)) {
    throw new RangeError("Invalid target: expected a finite number.");
  }

  if (value <= 1) {
    throw new RangeError("Invalid target: expected a number greater than 1.");
  }
}

function describeType(value: unknown): string {
  if (value === null) {
    return "null";
  }

  return typeof value;
}

/**
 * Finds the smallest base-color opacity whose quantized composite reaches the
 * target contrast ratio.
 */
function findMinimumAlpha(
  base: RGB,
  background: RGB,
  backgroundLuminance: number,
  target: number,
): number {
  let low = 0;
  let high = 1;

  for (let iteration = 0; iteration < ALPHA_SEARCH_ITERATIONS; iteration++) {
    const mid = (low + high) / 2;
    const candidate = mix(base, background, mid);
    const candidateRatio = contrastRatio(
      relativeLuminance(candidate),
      backgroundLuminance,
    );

    if (candidateRatio >= target) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return high;
}
