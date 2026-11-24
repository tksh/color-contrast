# color-contrast

A small, dependency-free TypeScript library for choosing readable foreground
colors against opaque background colors. It uses WCAG 2.x relative luminance and
contrast ratio calculations rather than a simple brightness threshold.

The package is designed for Deno and JSR, but its ES modules also work in other
JavaScript and TypeScript environments.

## Overview

A UI may display text on top of a color that is chosen at runtime, such as the
HEX label on a color swatch. Hard-coding black or white text, or choosing it
from an RGB average, produces unpredictable results. This package calculates the
actual WCAG contrast ratio and selects black or white accordingly.

When the selected base color has more contrast than necessary, the package can
blend it toward the background until a requested target ratio is just met. The
result is always an opaque HEX color, so it can be rendered directly.

## Features

- WCAG relative luminance calculation for sRGB colors.
- WCAG contrast ratio calculation.
- Automatic black/white base color selection.
- Configurable selection bias.
- Optional foreground adjustment toward the background.
- Minimum target contrast ratio.
- Opaque `#rrggbb` output.
- Strict input validation.
- No runtime dependencies.
- Deno and JSR support.

## Installation

```sh
deno add jsr:@tksh/color-contrast
```

## Usage

### Simple usage

```ts
import { getContrastColor } from "@tksh/color-contrast";

const textColor = getContrastColor("#0f172a");

console.log(textColor); // "#7b808a"
```

### Detailed usage

```ts
import { analyzeContrast } from "@tksh/color-contrast";

const analysis = analyzeContrast("#0f172a", {
  bias: 1,
  target: 4.5,
});

console.log(analysis.color); // "#7b808a"
console.log(analysis.ratio); // approximately 4.503
console.log(analysis.alpha); // approximately 0.450
console.log(analysis.meetsTarget); // true
```

### Non-default bias

```ts
import { analyzeContrast } from "@tksh/color-contrast";

// Prefer white more strongly, even if black would have higher contrast.
const analysis = analyzeContrast("#808080", { bias: 1.4 });

console.log(analysis.base); // "#ffffff"
console.log(analysis.ratio); // approximately 3.949
console.log(analysis.meetsTarget); // false
```

A bias other than `1` is a preference, not an accessibility guarantee. It can
select the less contrasting base color, and the result may not meet the target.

## Input format

Only opaque HEX colors in these formats are accepted:

- `#RGB`
- `#RRGGBB`

The following are rejected with a `TypeError`:

- `#RGBA` and `#RRGGBBAA` (alpha-enabled HEX)
- HEX strings without a leading `#`
- `rgb()` / `rgba()` functions
- CSS color names
- `hsl()` / `oklch()` functions
- Any other malformed or unsupported color notation

Alpha-enabled HEX input is rejected rather than silently treated as opaque. An
alpha background has no single displayed color without knowing the compositing
background, so this package handles opaque backgrounds only.

Input is trimmed, HEX digits are case-insensitive, and three-digit colors are
expanded internally. Returned colors always use lowercase six-digit `#rrggbb`
form.

```ts
analyzeContrast("#FFF").background; // "#ffffff"
analyzeContrast("#AbC").background; // "#aabbcc"
```

## Options

`analyzeContrast(background, options?)` accepts the following options. Both
properties are optional and default when omitted.

| Option   | Default | Description                                                    |
| -------- | ------- | -------------------------------------------------------------- |
| `bias`   | `1`     | Preference multiplier for selecting white over black.          |
| `target` | `4.5`   | Minimum contrast ratio the final foreground color should meet. |

### `bias`

The base color is selected with:

```ts
const useWhite = whiteRatio * bias >= blackRatio;
```

| `bias` | Behavior                                          |
| ------ | ------------------------------------------------- |
| `1`    | Select the color with the maximum contrast ratio. |
| `> 1`  | Make white more likely to be selected.            |
| `< 1`  | Make black more likely to be selected.            |

With `bias` equal to `1`, white wins an exact tie between the two ratios.

`bias` must be a finite number greater than `0`. Invalid types throw
`TypeError`; values outside the supported range throw `RangeError`.

### `target`

`target` is the requested contrast ratio. The default `4.5` is the WCAG AA
threshold for normal-sized text.

For the selected base color:

1. If its ratio is at or below `target`, it is returned unchanged.
2. If its ratio is above `target`, the smallest opacity that still reaches
   `target` is found by binary search.
3. The base color is composited with the background at that opacity and rounded
   to 8-bit RGB channels.

`target` must be a finite number greater than `1`. Invalid types throw
`TypeError`; values outside the supported range throw `RangeError`.

`meetsTarget` describes the final quantized output color, not the unadjusted
base color. If the selected base color cannot reach `target`, the pure base
color is returned and `meetsTarget` is `false`.

## API

### `getContrastColor(background, options?)`

Returns only the final opaque foreground color as a `#rrggbb` string. It
delegates to `analyzeContrast()`.

### `analyzeContrast(background, options?)`

Returns a `ContrastAnalysis` object:

| Field         | Description                                                         |
| ------------- | ------------------------------------------------------------------- |
| `color`       | Final opaque foreground color.                                      |
| `ratio`       | Contrast ratio between the final color and the background.          |
| `alpha`       | Opacity of the original black/white base color during compositing.  |
| `base`        | Selected base color, `#000000` or `#ffffff`.                        |
| `baseRatio`   | Contrast ratio of the unadjusted base color against the background. |
| `whiteRatio`  | Contrast ratio of pure white against the background.                |
| `blackRatio`  | Contrast ratio of pure black against the background.                |
| `background`  | Normalized background color.                                        |
| `target`      | Requested target contrast ratio.                                    |
| `meetsTarget` | Whether the final color reaches the requested target.               |

`alpha` is not an alpha channel in the returned HEX color. It records the
opacity used internally when compositing the base color with the background. The
returned `color` is always opaque.

## Algorithm

1. Parse and validate the opaque background HEX color.
2. Convert each sRGB channel to linear light with the sRGB transfer function.
3. Calculate WCAG relative luminance using the `0.2126`, `0.7152`, and `0.0722`
   coefficients.
4. Calculate contrast ratios with `(lighter + 0.05) / (darker + 0.05)`.
5. Select pure black or pure white using `whiteRatio * bias >= blackRatio`.
6. If the base ratio exceeds `target`, binary-search the minimum base opacity
   that still meets the target.
7. Composite the base color with the background in encoded sRGB space and round
   each channel to an 8-bit integer.
8. Recalculate the final ratio from the quantized output color.

Because the final ratio is measured from the actual 8-bit color, `ratio` may be
slightly above `target`. The package does not report an artificially exact
target value.

With the default `bias` of `1`, the selected pure base color has a contrast
ratio of at least approximately `4.58:1` against any opaque sRGB background.
This mathematical guarantee does not apply universally when a non-default `bias`
selects the less contrasting color, and it is not a claim that every `bias` and
`target` combination satisfies WCAG AA.

## Development

This repository uses Deno's built-in tooling.

```sh
deno task fmt        # format
deno task fmt:check  # check formatting
deno task lint       # lint
deno task check      # type check the entry point and tests
deno task test       # run tests
deno task check:publish # simulate a JSR publish
```

### Git hooks

After cloning, enable the pre-commit formatting check:

```sh
chmod +x .githooks/pre-commit
git config --local core.hooksPath .githooks
```

## License

MIT
