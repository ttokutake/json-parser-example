export type JsonObject =
  | null
  | boolean
  | number
  | string
  | { [key: string]: JsonObject }
  | JsonObject[];

const NULL = "null";
const NULL_START = "n";
const TRUE = "true";
const TRUE_START = "t";
const FALSE = "false";
const FALSE_START = "f";
const QUOTE = '"';
const ELEMENT_DELIMITER = ",";
const ARRAY_START = "[";
const ARRAY_END = "]";
const OBJECT_START = "{";
const OBJECT_KEY_DELIMITER = ":";
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
    while (this.isInProgress() && this.getChar().match(/\s/)) {
      this.index++;
    }
  }

  private parseNull() {
    const s = this.readChars(4);
    if (s !== NULL) {
      throw new SyntaxError(`Unexpected token "${s}"`);
    }
    return null;
  }

  private parseBoolean() {
    const s = this.readChars(this.getChar() === TRUE_START ? 4 : 5);
    if (![TRUE, FALSE].includes(s)) {
      throw new SyntaxError(`Unexpected token "${s}"`);
    }
    return s === TRUE ? true : false;
  }

  private parseNumber() {
    let s = "";

    if (this.getChar() === "-") {
      s += this.readChar();
    }

    while (this.getChar().match(/^\d$/)) {
      s += this.readChar();
    }

    if (this.getChar() === ".") {
      s += this.readChar();
    }

    while (this.getChar().match(/^\d$/)) {
      s += this.readChar();
    }

    if (s === "") {
      throw new Error("Implementation error");
    }
    if (s === "-") {
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
    let c;
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
      } else {
        s += c;
      }
    }

    if (c !== QUOTE) {
      throw new SyntaxError("Closing quote not exist");
    }

    return s;
  }

  private parseArray() {
    const a: JsonObject[] = [];
    this.skipChar(); // 最初の '[' を読み飛ばす
    this.skipWhitespaces();
    if (this.getChar() === ARRAY_END) {
      this.skipChar();
      return a; // 空の配列
    }
    while (this.isInProgress()) {
      a.push(this.parseValue());
      this.skipWhitespaces();
      // TODO: 空文字列が返ってきた場合
      const c = this.readChar();
      if (c === ARRAY_END) {
        break;
      }
      if (c !== ELEMENT_DELIMITER) {
        throw new SyntaxError("Invalid array");
      }
      this.skipWhitespaces();
    }
    return a;
  }

  private parseObject() {
    const o: JsonObject = {};
    this.skipChar(); // 最初の '{' を読み飛ばす
    this.skipWhitespaces();
    if (this.getChar() === OBJECT_END) {
      this.skipChar();
      return o; // 空のオブジェクト
    }
    while (this.isInProgress()) {
      const key = this.parseString();
      this.skipWhitespaces();
      // TODO: 空文字列が返ってきた場合 & ':'じゃない場合
      this.skipChar(); // ':' を読み飛ばす
      this.skipWhitespaces();
      o[key] = this.parseValue();
      this.skipWhitespaces();
      // TODO: 空文字列が返ってきた場合
      const c = this.readChar();
      if (c === OBJECT_END) {
        break;
      }
      if (c !== ELEMENT_DELIMITER) {
        throw new SyntaxError("Invalid object");
      }
      this.skipWhitespaces();
    }
    return o;
  }

  parseValue() {
    this.skipWhitespaces();
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
      // TODO: 0-9 & -
      default:
        return this.parseNumber();
    }
  }
}

export function parseJSON(json: string) {
  const p = new JSONParser(json);
  return p.parseValue();
}
