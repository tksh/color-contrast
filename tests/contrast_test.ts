import { assertAlmostEquals, assertEquals } from "@std/assert";
import { parseHexColor } from "../src/color.ts";
import { contrastRatio } from "../src/contrast.ts";
import { relativeLuminance } from "../src/luminance.ts";

Deno.test("contrastRatio of black and white is 21", () => {
  assertAlmostEquals(contrastRatio(1, 0), 21, 1e-12);
  assertAlmostEquals(contrastRatio(0, 1), 21, 1e-12);
});

Deno.test("contrastRatio is 1 for identical luminances", () => {
  assertEquals(contrastRatio(0, 0), 1);
  assertEquals(contrastRatio(0.5, 0.5), 1);
  assertEquals(contrastRatio(1, 1), 1);
});

Deno.test("contrastRatio is symmetric", () => {
  assertAlmostEquals(contrastRatio(0.1, 0.7), contrastRatio(0.7, 0.1), 1e-15);
});

Deno.test("contrastRatio matches known color pairs", () => {
  const black = relativeLuminance(parseHexColor("#000000"));
  const white = relativeLuminance(parseHexColor("#ffffff"));
  const gray = relativeLuminance(parseHexColor("#808080"));

  assertAlmostEquals(contrastRatio(white, gray), 3.9494396480491156, 1e-12);
  assertAlmostEquals(contrastRatio(black, gray), 5.317210002277984, 1e-12);
  assertAlmostEquals(contrastRatio(white, black), 21, 1e-12);
});

Deno.test("contrastRatio never falls below 1", () => {
  assertAlmostEquals(contrastRatio(0.2, 0.200001), 1, 1e-5);
  assertEquals(contrastRatio(0, 0.0000001) >= 1, true);
});
