import { assertAlmostEquals, assertEquals } from "@std/assert";
import { parseHexColor } from "../src/color.ts";
import { relativeLuminance, srgbToLinear } from "../src/luminance.ts";

Deno.test("srgbToLinear maps the sRGB endpoints to 0 and 1", () => {
  assertEquals(srgbToLinear(0), 0);
  assertEquals(srgbToLinear(255), 1);
});

Deno.test("srgbToLinear uses the linear segment near black", () => {
  assertAlmostEquals(srgbToLinear(0), 0 / 12.92, 1e-15);
  assertAlmostEquals(srgbToLinear(10), 10 / 255 / 12.92, 1e-15);
});

Deno.test("srgbToLinear uses the power segment above the threshold", () => {
  const channel = 128 / 255;
  const expected = ((channel + 0.055) / 1.055) ** 2.4;

  assertAlmostEquals(srgbToLinear(128), expected, 1e-15);
});

Deno.test("relativeLuminance matches the WCAG coefficients", () => {
  assertEquals(relativeLuminance([0, 0, 0]), 0);
  assertEquals(relativeLuminance([255, 255, 255]), 1);
  assertAlmostEquals(relativeLuminance([255, 0, 0]), 0.2126, 1e-15);
  assertAlmostEquals(relativeLuminance([0, 255, 0]), 0.7152, 1e-15);
  assertAlmostEquals(relativeLuminance([0, 0, 255]), 0.0722, 1e-15);
});

Deno.test("relativeLuminance of representative HEX colors", () => {
  assertAlmostEquals(
    relativeLuminance(parseHexColor("#808080")),
    0.21586050011389926,
    1e-12,
  );
  assertAlmostEquals(
    relativeLuminance(parseHexColor("#0f172a")),
    0.008815176790098227,
    1e-12,
  );
  assertAlmostEquals(
    relativeLuminance(parseHexColor("#aabbcc")),
    0.4844632879252147,
    1e-12,
  );
});
