import {
  assertAlmostEquals,
  assertEquals,
  assertMatch,
  assertThrows,
} from "@std/assert";
import { mix, parseHexColor, rgbToHex } from "../src/color.ts";
import { contrastRatio } from "../src/contrast.ts";
import { relativeLuminance } from "../src/luminance.ts";
import * as publicApi from "../src/mod.ts";
import {
  analyzeContrast,
  type ContrastAnalysis,
  type ContrastOptions,
  getContrastColor,
} from "../src/readable-text.ts";

function assertConsistent(analysis: ContrastAnalysis): void {
  const background = parseHexColor(analysis.background);
  const foreground = parseHexColor(analysis.color);
  const expectedRatio = contrastRatio(
    relativeLuminance(foreground),
    relativeLuminance(background),
  );

  assertMatch(analysis.color, /^#[0-9a-f]{6}$/);
  assertMatch(analysis.background, /^#[0-9a-f]{6}$/);
  assertEquals(analysis.color, analysis.color.toLowerCase());
  assertEquals(analysis.background, analysis.background.toLowerCase());
  assertAlmostEquals(analysis.ratio, expectedRatio, 1e-12);
  assertEquals(analysis.meetsTarget, analysis.ratio >= analysis.target);
  assertEquals(analysis.alpha >= 0 && analysis.alpha <= 1, true);
  assertEquals(
    rgbToHex(mix(parseHexColor(analysis.base), background, analysis.alpha)),
    analysis.color,
  );
}

Deno.test("public entry point exposes the documented API", () => {
  assertEquals(typeof publicApi.analyzeContrast, "function");
  assertEquals(typeof publicApi.getContrastColor, "function");
});

Deno.test("default configuration selects black or white as documented", () => {
  const cases = [
    ["#000000", "#ffffff"],
    ["#ffffff", "#000000"],
    ["#0f172a", "#ffffff"],
    ["#808080", "#000000"],
  ] as const;

  for (const [background, base] of cases) {
    const analysis = analyzeContrast(background);

    assertEquals(analysis.base, base);
    assertEquals(analysis.background, background);
    assertEquals(analysis.target, 4.5);
    assertEquals(analysis.meetsTarget, true);
    assertConsistent(analysis);
  }
});

Deno.test("background colors are normalized", () => {
  assertEquals(analyzeContrast("#FFF").background, "#ffffff");
  assertEquals(analyzeContrast("#AbC").background, "#aabbcc");
  assertEquals(analyzeContrast("  #123456\n").background, "#123456");
  assertEquals(analyzeContrast("#FFF").color, analyzeContrast("#ffffff").color);
});

Deno.test("pure black selects white and adjusts opacity", () => {
  const analysis = analyzeContrast("#000000");

  assertEquals(analysis.base, "#ffffff");
  assertEquals(analysis.baseRatio, 21);
  assertEquals(analysis.whiteRatio, 21);
  assertEquals(analysis.blackRatio, 1);
  assertEquals(analysis.color, "#757575");
  assertEquals(analysis.meetsTarget, true);
  assertEquals(analysis.alpha < 1, true);
  assertAlmostEquals(analysis.ratio, 4.557768319672582, 1e-12);
  assertConsistent(analysis);

  const lighter = contrastRatio(
    relativeLuminance(parseHexColor("#747474")),
    relativeLuminance(parseHexColor("#000000")),
  );
  assertEquals(lighter < 4.5, true);
});

Deno.test("pure white selects black and adjusts opacity", () => {
  const analysis = analyzeContrast("#ffffff");

  assertEquals(analysis.base, "#000000");
  assertEquals(analysis.baseRatio, 21);
  assertEquals(analysis.whiteRatio, 1);
  assertEquals(analysis.blackRatio, 21);
  assertEquals(analysis.color, "#767676");
  assertEquals(analysis.meetsTarget, true);
  assertAlmostEquals(analysis.ratio, 4.542224959605253, 1e-12);
  assertConsistent(analysis);

  const lighter = contrastRatio(
    relativeLuminance(parseHexColor("#777777")),
    relativeLuminance(parseHexColor("#ffffff")),
  );
  assertEquals(lighter < 4.5, true);
});

Deno.test("a target equal to the base ratio keeps the pure base color", () => {
  const reference = analyzeContrast("#808080");
  const analysis = analyzeContrast("#808080", {
    target: reference.baseRatio,
  });

  assertEquals(analysis.base, "#000000");
  assertEquals(analysis.color, "#000000");
  assertEquals(analysis.alpha, 1);
  assertEquals(analysis.ratio, analysis.baseRatio);
  assertEquals(analysis.meetsTarget, true);
  assertConsistent(analysis);
});

Deno.test("a target above the base ratio keeps the base and reports failure", () => {
  const reference = analyzeContrast("#808080");
  const analysis = analyzeContrast("#808080", {
    target: reference.baseRatio + 1,
  });

  assertEquals(analysis.base, "#000000");
  assertEquals(analysis.color, "#000000");
  assertEquals(analysis.alpha, 1);
  assertEquals(analysis.ratio, analysis.baseRatio);
  assertEquals(analysis.meetsTarget, false);
  assertConsistent(analysis);
});

Deno.test("targets between 1 and the base ratio lower the opacity", () => {
  for (const target of [1.5, 2, 3, 4.5, 5]) {
    const analysis = analyzeContrast("#808080", { target });

    assertEquals(analysis.base, "#000000");
    assertEquals(analysis.meetsTarget, true);
    assertEquals(analysis.ratio >= target, true);
    assertEquals(analysis.alpha < 1, true);
    assertConsistent(analysis);
  }
});

Deno.test("higher targets produce stronger foreground colors", () => {
  const light = analyzeContrast("#000000", { target: 4.5 });
  const medium = analyzeContrast("#000000", { target: 7 });
  const strong = analyzeContrast("#000000", { target: 15 });
  const maximum = analyzeContrast("#000000", { target: 21 });

  assertEquals(light.alpha < medium.alpha, true);
  assertEquals(medium.alpha < strong.alpha, true);
  assertEquals(strong.alpha < maximum.alpha, true);
  assertEquals(maximum.color, "#ffffff");
  assertEquals(maximum.ratio, 21);
  assertEquals(maximum.meetsTarget, true);
  assertEquals(strong.meetsTarget, true);
  assertEquals(medium.meetsTarget, true);
  assertConsistent(light);
  assertConsistent(medium);
  assertConsistent(strong);
  assertConsistent(maximum);
});

Deno.test("quantization can make the final color meet the target closely", () => {
  const analysis = analyzeContrast("#808080", { target: 4.5 });

  assertEquals(analysis.color, "#171717");
  assertEquals(analysis.ratio >= 4.5, true);
  assertEquals(analysis.ratio < 4.55, true);
  assertConsistent(analysis);
});

Deno.test("bias changes base selection without silently fixing the target", () => {
  const lower = analyzeContrast("#808080", { bias: 1.3 });
  const higher = analyzeContrast("#808080", { bias: 1.4 });

  assertEquals(lower.base, "#000000");
  assertEquals(lower.meetsTarget, true);

  assertEquals(higher.base, "#ffffff");
  assertEquals(higher.color, "#ffffff");
  assertEquals(higher.alpha, 1);
  assertEquals(higher.ratio, higher.whiteRatio);
  assertEquals(higher.meetsTarget, false);
  assertConsistent(lower);
  assertConsistent(higher);
});

Deno.test("bias can force the less contrasting base color", () => {
  const dark = analyzeContrast("#000000", { bias: 0.01 });
  assertEquals(dark.base, "#000000");
  assertEquals(dark.color, "#000000");
  assertEquals(dark.ratio, 1);
  assertEquals(dark.meetsTarget, false);
  assertConsistent(dark);

  const light = analyzeContrast("#ffffff", { bias: 22 });
  assertEquals(light.base, "#ffffff");
  assertEquals(light.color, "#ffffff");
  assertEquals(light.ratio, 1);
  assertEquals(light.meetsTarget, false);
  assertConsistent(light);
});

Deno.test("an exact black/white tie selects white", () => {
  const reference = analyzeContrast("#808080");
  const threshold = reference.blackRatio / reference.whiteRatio;

  assertEquals(reference.whiteRatio * threshold, reference.blackRatio);

  const tie = analyzeContrast("#808080", { bias: threshold });
  const below = analyzeContrast("#808080", { bias: threshold - 1e-12 });

  assertEquals(tie.base, "#ffffff");
  assertEquals(below.base, "#000000");
  assertConsistent(tie);
  assertConsistent(below);
});

Deno.test("getContrastColor delegates to analyzeContrast", () => {
  const cases: Array<[string, ContrastOptions | undefined]> = [
    ["#0f172a", undefined],
    ["#000000", { target: 7 }],
    ["#ffffff", { bias: 0.5 }],
    ["#808080", { bias: 1.4, target: 2 }],
  ];

  for (const [background, options] of cases) {
    assertEquals(
      getContrastColor(background, options),
      analyzeContrast(background, options).color,
    );
  }
});

Deno.test("background validation rejects invalid colors", () => {
  for (
    const background of [
      "#1234",
      "#12345678",
      "#12345",
      "123456",
      "rgb(0, 0, 0)",
      "black",
      "",
    ]
  ) {
    assertThrows(() => analyzeContrast(background), TypeError);
    assertThrows(() => getContrastColor(background), TypeError);
  }

  assertThrows(
    () => analyzeContrast(null as unknown as string),
    TypeError,
  );
});

Deno.test("bias validation rejects invalid types", () => {
  for (
    const bias of [
      "1",
      null,
      true,
      {},
      [],
    ] as unknown as number[]
  ) {
    assertThrows(
      () => analyzeContrast("#000000", { bias }),
      TypeError,
    );
  }
});

Deno.test("bias validation rejects invalid ranges", () => {
  for (
    const bias of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      0,
      -1,
    ]
  ) {
    assertThrows(
      () => analyzeContrast("#000000", { bias }),
      RangeError,
    );
  }
});

Deno.test("target validation rejects invalid types", () => {
  for (
    const target of [
      "4.5",
      null,
      true,
      {},
      [],
    ] as unknown as number[]
  ) {
    assertThrows(
      () => analyzeContrast("#000000", { target }),
      TypeError,
    );
  }
});

Deno.test("target validation rejects invalid ranges", () => {
  for (
    const target of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      1,
      0.5,
      -1,
    ]
  ) {
    assertThrows(
      () => analyzeContrast("#000000", { target }),
      RangeError,
    );
  }
});

Deno.test("options validation rejects non-object values", () => {
  for (
    const options of [
      null,
      [],
      "options",
      1,
      true,
    ] as unknown as ContrastOptions[]
  ) {
    assertThrows(
      () => analyzeContrast("#000000", options),
      TypeError,
    );
  }
});
