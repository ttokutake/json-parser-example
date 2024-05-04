import { parseJSON } from "./json_parser.ts";

import { assertEquals } from "$std/assert/mod.ts";
import { describe, it } from "$std/testing/bdd.ts";

describe("JSONParser", () => {
  describe("parseNumber()", () => {
    [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '100',
      '-0',
      '-1',
    ].forEach((input) =>  {
      it(`parses the integer "${input}"`, () => {
        const output = parseJSON(input);
        const expected = JSON.parse(input);
        assertEquals(output, expected);
      });
    });

    [
      '01',
      '-01',
    ].forEach((input) => {
      it(`throws an error`, () => {
      });
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
