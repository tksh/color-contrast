import { assertEquals, assertThrows } from "@std/assert";
import { mix, parseHexColor, rgbToHex } from "../src/color.ts";

Deno.test("parseHexColor parses six-digit HEX colors", () => {
  assertEquals(parseHexColor("#000000"), [0, 0, 0]);
  assertEquals(parseHexColor("#ffffff"), [255, 255, 255]);
  assertEquals(parseHexColor("#123456"), [0x12, 0x34, 0x56]);
  assertEquals(parseHexColor("#0f172a"), [0x0f, 0x17, 0x2a]);
});

Deno.test("parseHexColor expands three-digit HEX colors", () => {
  assertEquals(parseHexColor("#abc"), [0xaa, 0xbb, 0xcc]);
  assertEquals(parseHexColor("#AbC"), [0xaa, 0xbb, 0xcc]);
  assertEquals(parseHexColor("#FFF"), [255, 255, 255]);
});

Deno.test("parseHexColor accepts uppercase HEX digits", () => {
  assertEquals(parseHexColor("#ABCDEF"), [0xab, 0xcd, 0xef]);
});

Deno.test("parseHexColor trims surrounding whitespace", () => {
  assertEquals(parseHexColor("  #0f172a\n"), [0x0f, 0x17, 0x2a]);
  assertEquals(parseHexColor("\t#fff "), [255, 255, 255]);
});

Deno.test("parseHexColor rejects alpha-enabled HEX colors", () => {
  for (const color of ["#1234", "#abcd", "#12345678", "#aabbccdd"]) {
    assertThrows(() => parseHexColor(color), TypeError);
  }
});

Deno.test("parseHexColor rejects malformed and unsupported colors", () => {
  for (
    const color of [
      "",
      "#",
      "#12",
      "#12345",
      "#1234567",
      "#gggggg",
      "123456",
      "fff",
      "rgb(0, 0, 0)",
      "rgba(0, 0, 0, 1)",
      "black",
      "hsl(0, 0%, 0%)",
      "oklch(0% 0 0)",
      " #000000 #ffffff",
    ]
  ) {
    assertThrows(() => parseHexColor(color), TypeError);
  }
});

Deno.test("parseHexColor rejects non-string values", () => {
  assertThrows(
    () => parseHexColor(0x000000 as unknown as string),
    TypeError,
  );
  assertThrows(
    () => parseHexColor(null as unknown as string),
    TypeError,
  );
  assertThrows(
    () => parseHexColor(undefined as unknown as string),
    TypeError,
  );
});

Deno.test("rgbToHex returns lowercase six-digit HEX colors", () => {
  assertEquals(rgbToHex([0, 0, 0]), "#000000");
  assertEquals(rgbToHex([255, 255, 255]), "#ffffff");
  assertEquals(rgbToHex([0x0f, 0x17, 0x2a]), "#0f172a");
  assertEquals(rgbToHex([0xab, 0xcd, 0xef]), "#abcdef");
});

Deno.test("rgbToHex clamps and rounds channel values", () => {
  assertEquals(rgbToHex([-1, 256, 127.6]), "#00ff80");
});

Deno.test("mix composites in encoded sRGB space and rounds to 8 bits", () => {
  assertEquals(mix([0, 0, 0], [255, 255, 255], 0.5), [128, 128, 128]);
  assertEquals(mix([255, 255, 255], [0, 0, 0], 0.5), [128, 128, 128]);
  assertEquals(mix([0, 0, 0], [255, 255, 255], 1), [0, 0, 0]);
  assertEquals(mix([0, 0, 0], [255, 255, 255], 0), [255, 255, 255]);
  assertEquals(mix([255, 255, 255], [15, 23, 42], 0.5), [135, 139, 149]);
});
