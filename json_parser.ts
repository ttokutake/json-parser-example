export type JsonObject =
  | null
  | boolean
  | number
  | string
  | { [key: string]: JsonObject }
  | JsonObject[];

const NULL_START = "n";
const TRUE_START = "t";
const FALSE_START = "f";
const MINUS = "-";
const NUMBER_REGEX = /^\d$/;
const QUOTE = '"';
const ELEMENT_DELIMITER = ",";
const ARRAY_START = "[";
const ARRAY_END = "]";
const OBJECT_START = "{";
const OBJECT_END = "}";

class JSONParser {
  private index: number;
  constructor(private json: string) {
    this.index = 0;
  }

  private isInProgress() {
    return this.index < this.json.length;
  }

  private getChar() {
    return this.json.charAt(this.index);
  }

  private readChar() {
    return this.json.charAt(this.index++);
  }

  private readChars(count: number) {
    const s = this.json.slice(this.index, this.index + count);
    this.index += Math.max(count, this.json.length - this.index);
    return s;
  }

  private skipChar() {
    this.index++;
  }

  private skipWhitespaces() {
    while (this.isInProgress() && this.getChar().match(/^\s$/)) {
      this.index++;
    }
  }

  private parseNull() {
    const s = this.readChars(4);
    if (s !== "null") {
      throw new SyntaxError(`Unexpected token "${s}"`);
    }
    return null;
  }

  private parseBoolean() {
    const s = this.readChars(this.getChar() === TRUE_START ? 4 : 5);
    if (!["true", "false"].includes(s)) {
      throw new SyntaxError(`Unexpected token "${s}"`);
    }
    return s === "true" ? true : false;
  }

  private parseNumber() {
    let s = "";

    if (this.getChar() === MINUS) {
      s += this.readChar();
    }

    while (this.getChar().match(NUMBER_REGEX)) {
      s += this.readChar();
    }

    if (this.getChar() === ".") {
      s += this.readChar();
    }

    while (this.getChar().match(NUMBER_REGEX)) {
      s += this.readChar();
    }

    if (s === "") {
      throw new Error("Implementation error");
    }
    if (s === MINUS) {
      throw new SyntaxError("Minus sign alone");
    }
    if (s.match(/^-?0\d+/)) {
      throw new SyntaxError("Unneeded leading zero");
    }
    if (s.match(/^-\./)) {
      throw new SyntaxError("Lack of integer part");
    }
    if (s.match(/\.$/)) {
      throw new SyntaxError("Lack of decimal part");
    }

    return parseFloat(s);
  }

  private parseString() {
    this.skipChar(); // 最初の引用符を読み飛ばす

    let s = "";
    let c = "";
    while (this.isInProgress()) {
      c = this.readChar();
      if (c === QUOTE) {
        break;
      }
      if (c === "\\") {
        if (!["\\", '"'].includes(this.getChar())) {
          throw new SyntaxError("Escape character exists");
        }
        // TODO: 制御文字のチェック
        // > JSON.parse('"\\a"')
        // Uncaught SyntaxError: Bad escaped character in JSON at position 2 (line 1 column 3)
        s += this.readChar();
        continue;
      }
      s += c;
    }

    if (c !== QUOTE) {
      throw new SyntaxError("Closing quote not exist");
    }

    return s;
  }

  private parseArray() {
    this.skipChar(); // 最初の '[' を読み飛ばす
    this.skipWhitespaces();

    const a: JsonObject[] = [];

    if (this.getChar() === ARRAY_END) {
      this.skipChar();
      return a; // 空の配列
    }

    while (true) {
      a.push(this.parseValue());

      this.skipWhitespaces();
      if (!this.isInProgress()) {
        throw new SyntaxError("Lack of closing bracket");
      }

      const c = this.readChar();
      if (c === ARRAY_END) {
        break;
      }
      if (c !== ELEMENT_DELIMITER) {
        throw new SyntaxError(`Unexpected token "${c}"`);
      }
    }

    return a;
  }

  private parseObject() {
    this.skipChar(); // 最初の '{' を読み飛ばす
    this.skipWhitespaces();

    const o: JsonObject = {};

    if (this.getChar() === OBJECT_END) {
      this.skipChar();
      return o; // 空のオブジェクト
    }

    while (true) {
      this.skipWhitespaces();
      if (this.getChar() !== QUOTE) {
        throw new SyntaxError(`Lack of quote`);
      }
      const key = this.parseString();

      this.skipWhitespaces();
      if (!this.isInProgress()) {
        throw new SyntaxError(`Lack of colon`);
      }

      const colon = this.readChar();
      if (colon !== ":") {
        throw new SyntaxError(`Unexpected token "${colon}"`);
      }

      o[key] = this.parseValue();

      this.skipWhitespaces();
      if (!this.isInProgress()) {
        throw new SyntaxError(`Lack of closing brace`);
      }

      const c = this.readChar();
      if (c === OBJECT_END) {
        break;
      }
      if (c !== ELEMENT_DELIMITER) {
        throw new SyntaxError(`Unexpected token "${c}"`);
      }
    }

    return o;
  }

  parseValue() {
    this.skipWhitespaces();

    if (!this.isInProgress()) {
      throw new SyntaxError("Unexpected end of input");
    }

    const c = this.getChar();
    // TODO: switchの条件自体もparseXXX()に閉じ込める実装にしたい
    switch (c) {
      case OBJECT_START:
        return this.parseObject();
      case ARRAY_START:
        return this.parseArray();
      case QUOTE:
        return this.parseString();
      case NULL_START:
        return this.parseNull();
      case TRUE_START:
      case FALSE_START:
        return this.parseBoolean();
      default:
        if (c === MINUS || c.match(NUMBER_REGEX)) {
          return this.parseNumber();
        }
        throw new SyntaxError(`Unexpected token ${c}`);
    }
  }
}

export function parseJSON(json: string) {
  const p = new JSONParser(json);
  return p.parseValue();
}
