import { parseJSON } from "./json_parser.ts";

import { assertEquals, assertThrows } from "$std/assert/mod.ts";
import { describe, it } from "$std/testing/bdd.ts";

describe("JSONParser", () => {
  describe("parseNull()", () => {
    it("parses null", () => {
      const input = "null";
      const output = parseJSON(input);
      const expected = JSON.parse(input);
      assertEquals(output, expected);
    });

    [
      "n",
      "nu",
      "nul",
    ].forEach((input) => {
      it(`throws a SyntaxError with 'Unexpected token "${input}"'`, () => {
        assertThrows(
          () => parseJSON(input),
          SyntaxError,
          `Unexpected token "${input}"`,
        );
        assertThrows(() => JSON.parse(input), SyntaxError);
      });
    });
  });

  describe("parseBoolean()", () => {
    [
      "true",
      "false",
    ].forEach((input) => {
      it(`parses boolean "${input}"`, () => {
        const output = parseJSON(input);
        const expected = JSON.parse(input);
        assertEquals(output, expected);
      });
    });

    [
      "t",
      "tr",
      "tru",
      "f",
      "fa",
      "fal",
      "fals",
    ].forEach((input) => {
      it(`throws a SyntaxError with 'Unexpected token "${input}"'`, () => {
        assertThrows(
          () => parseJSON(input),
          SyntaxError,
          `Unexpected token "${input}"`,
        );
        assertThrows(() => JSON.parse(input), SyntaxError);
      });
    });
  });

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

    it('throws a SyntaxError with "Minus sign alone" against "-"', () => {
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
      it(`throws a SyntaxError with "Unneeded leading zero" against "${input}"`, () => {
        assertThrows(
          () => parseJSON(input),
          SyntaxError,
          "Unneeded leading zero",
        );
        assertThrows(() => JSON.parse(input), SyntaxError);
      });
    });

    [
      "-.",
      "-.0",
    ].forEach((input) => {
      it(`throws a SyntaxError with "Lack of integer part" against "${input}"`, () => {
        assertThrows(
          () => parseJSON(input),
          SyntaxError,
          "Lack of integer part",
        );
        assertThrows(() => JSON.parse(input), SyntaxError);
      });
    });

    it('throws a SyntaxError with "Lack of decimal part" against "0."', () => {
      const input = "0.";
      assertThrows(
        () => parseJSON(input),
        SyntaxError,
        "Lack of decimal part",
      );
      assertThrows(() => JSON.parse(input), SyntaxError);
    });
  });

  describe("parseString()", () => {
    [
      '""',
      '"a"',
      '"ab"',
      '"\\\\"',
      '"\\""',
    ].forEach((input) => {
      it(`parses the string "${input}"`, () => {
        const output = parseJSON(input);
        const expected = JSON.parse(input);
        assertEquals(output, expected);
      });
    });

    [
      '"\\',
      '"\\a"',
      '"\\\\\\a"',
    ].forEach((input) => {
      it(`throws a SyntaxError with "Escape character exists" against "${input}"`, () => {
        assertThrows(
          () => parseJSON(input),
          SyntaxError,
          "Escape character exists",
        );
        assertThrows(() => JSON.parse(input), SyntaxError);
      });
    });

    [
      '"',
      '"a',
    ].forEach((input) => {
      it(`throws a SyntaxError with "Closing quote not exist" against "${input}"`, () => {
        assertThrows(
          () => parseJSON(input),
          SyntaxError,
          "Closing quote not exist",
        );
        assertThrows(() => JSON.parse(input), SyntaxError);
      });
    });
  });

  describe("parseArray()", () => {
    [
      "[]",
      "[ ]",
      "[ 1]",
      "[1 ]",
      "[1,2]",
      "[1 ,2]",
      "[1, 2]",
      "[1,2,3]",
    ].forEach((input) => {
      it(`parses the array "${input}"`, () => {
        const output = parseJSON(input);
        const expected = JSON.parse(input);
        assertEquals(output, expected);
      });
    });

    it('throws a SyntaxError with "Unexpected end of input"', () => {
      const input = "[";
      assertThrows(
        () => parseJSON(input),
        SyntaxError,
        "Unexpected end of input",
      );
      assertThrows(() => JSON.parse(input), SyntaxError);
    });

    [
      "[1",
      "[1,2",
    ].forEach((input) => {
      it(`throws a SyntaxError with "Lack of closing bracket" against "${input}"`, () => {
        assertThrows(
          () => parseJSON(input),
          SyntaxError,
          "Lack of closing bracket",
        );
        assertThrows(() => JSON.parse(input), SyntaxError);
      });
    });

    [
      "[1;",
      "[1,2;",
    ].forEach((input) => {
      it(`throws a SyntaxError with "Unexpected token" against "${input}"`, () => {
        assertThrows(
          () => parseJSON(input),
          SyntaxError,
          'Unexpected token ";"',
        );
        assertThrows(() => JSON.parse(input), SyntaxError);
      });
    });
  });

  describe("parseObject()", () => {
    [
      "{}",
      "{ }",
      '{ "":1}',
      '{"" :1}',
      '{"": 1}',
      '{"":1 }',
      '{"a":1 ,"b":2}',
      '{"a":1, "b":2}',
      '{"a":1,"b":2}',
    ].forEach((input) => {
      it(`parses the object "${input}"`, () => {
        const output = parseJSON(input);
        const expected = JSON.parse(input);
        assertEquals(output, expected);
      });
    });

    [
      "{:1}",
      "{a:1}",
      '{"":1,:2}',
      '{"a":1,b:2}',
    ].forEach((input) => {
      it(`throws a SyntaxError with "Non-string key" against "${input}"`, () => {
        assertThrows(
          () => parseJSON(input),
          SyntaxError,
          "Non-string key",
        );
        assertThrows(() => JSON.parse(input), SyntaxError);
      });
    });

    [
      '{""',
      '{"a":1,"b"',
    ].forEach((input) => {
      it(`throws a SyntaxError with "Lack of colon" against "${input}"`, () => {
        assertThrows(
          () => parseJSON(input),
          SyntaxError,
          "Lack of colon",
        );
        assertThrows(() => JSON.parse(input), SyntaxError);
      });
    });

    [
      '{"";',
      '{"";1}',
    ].forEach((input) => {
      it(`throws a SyntaxError with "Unexpected token" against "${input}"`, () => {
        assertThrows(
          () => parseJSON(input),
          SyntaxError,
          'Unexpected token ";"',
        );
        assertThrows(() => JSON.parse(input), SyntaxError);
      });
    });

    [
      '{"":',
      '{"a":1,"b":',
    ].forEach((input) => {
      it(`throws a SyntaxError with "Unexpected end of input" against "${input}"`, () => {
        assertThrows(
          () => parseJSON(input),
          SyntaxError,
          "Unexpected end of input",
        );
        assertThrows(() => JSON.parse(input), SyntaxError);
      });
    });

    [
      '{"":1',
      '{"a":1,"b":2',
    ].forEach((input) => {
      it(`throws a SyntaxError with "Lack of closing brace" against "${input}"`, () => {
        assertThrows(
          () => parseJSON(input),
          SyntaxError,
          "Lack of closing brace",
        );
        assertThrows(() => JSON.parse(input), SyntaxError);
      });
    });

    [
      '{"":1;',
      '{"a":1;"b":2}',
    ].forEach((input) => {
      it(`throws a SyntaxError with "Unexpected token" against "${input}"`, () => {
        assertThrows(
          () => parseJSON(input),
          SyntaxError,
          'Unexpected token ";"',
        );
        assertThrows(() => JSON.parse(input), SyntaxError);
      });
    });
  });
});

describe("parseJSON()", () => {
  // TODO: "{}{}", "{} ", 全部の型を含めるinput, "a", "(", ""
  it("parses a JSON string", () => {
    const input =
      '{"name":"John Doe","age":30,"city":"Tokyo","hobbies":["reading","hiking","coding"]}';
    const output = parseJSON(input);
    const expected = JSON.parse(input);
    assertEquals(output, expected);
  });
});
