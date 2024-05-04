import { parseJSON } from "./json_parser.ts";

import { assertEquals, assertThrows } from "$std/assert/mod.ts";
import { describe, it } from "$std/testing/bdd.ts";

describe("JSONParser", () => {
  describe("parseNumber()", () => {
    [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "19",
      "100",
      "101",
      "109",
      "0.0",
      "0.1",
      "0.9",
      "0.01",
      "0.09",
      "1.0",
      "1.1",
      "1.9",
      "1.00",
      "1.10",
      "-0",
      "-1",
      "-9",
      "-0.0",
      "-0.1",
      "-0.9",
      "-0.00",
      "-0.10",
    ].forEach((input) => {
      it(`parses the integer "${input}"`, () => {
        const output = parseJSON(input);
        const expected = JSON.parse(input);
        assertEquals(output, expected);
      });
    });

    it(`throws an SyntaxError for minus sign alone`, () => {
      const input = "-";
      assertThrows(
        () => parseJSON(input),
        SyntaxError,
        "Minus sign alone",
      );
      assertThrows(() => JSON.parse(input), SyntaxError);
    });

    [
      "00",
      "01",
      "-00",
      "-01",
    ].forEach((input) => {
      it(`throws an SyntaxError for unneeded leading zero`, () => {
        assertThrows(
          () => parseJSON(input),
          SyntaxError,
          "Unneeded leading zero",
        );
        assertThrows(() => JSON.parse(input), SyntaxError);
      });
    });

    it(`throws an SyntaxError for lack of decimal part`, () => {
      const input = "0.";
      assertThrows(
        () => parseJSON(input),
        SyntaxError,
        "Lack of decimal part",
      );
      assertThrows(() => JSON.parse(input), SyntaxError);
    });
  });
});

describe("parseJSON()", () => {
  it("parses a JSON string", () => {
    const input =
      '{"name":"John Doe","age":30,"city":"Tokyo","hobbies":["reading","hiking","coding"]}';
    const output = parseJSON(input);
    const expected = JSON.parse(input);
    assertEquals(output, expected);
  });
});
