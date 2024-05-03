export type JsonObject =
  | null
  | number
  | string
  | { [key: string]: JsonObject }
  | JsonObject[];

const QUOTE = '"';
const ARRAY_START = "[";
const ARRAY_DELIMITER = ",";
const ARRAY_END = "]";
const OBJECT_START = "{";
const OBJECT_DELIMITER = ",";
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

  private skipWhitespace() {
    while (this.isInProgress() && this.getChar().match(/\s/)) {
      this.index++;
    }
  }

  // TODO: parseNull, ParseTrue, ParseFalse

  private parseNumber() {
    let s = "";
    // TODO: 小数点の対応
    while (this.isInProgress() && this.getChar().match(/\d/)) {
      s += this.readChar();
    }
    return parseFloat(s);
  }

  private parseString() {
    let c;
    let s = "";
    const quote = this.readChar(); // 最初の引用符を読み飛ばす
    while (this.isInProgress() && (c = this.readChar()) !== quote) {
      if (c === "\\") {
        // TODO: 空文字列が返ってきた場合
        s += this.readChar(); // TODO: エスケープ文字の処理
      } else {
        s += c;
      }
    }
    return s;
  }

  private parseArray() {
    const a: JsonObject[] = [];
    this.readChar(); // 最初の '[' を読み飛ばす
    this.skipWhitespace();
    if (this.getChar() === ARRAY_END) {
      this.index++;
      return a; // 空の配列
    }
    while (this.isInProgress()) {
      a.push(this.parseValue());
      this.skipWhitespace();
      // TODO: 空文字列が返ってきた場合
      const c = this.readChar();
      if (c === ARRAY_END) {
        break;
      }
      if (c !== ARRAY_DELIMITER) {
        throw new SyntaxError("Invalid array");
      }
      this.skipWhitespace();
    }
    return a;
  }

  private parseObject() {
    const o: JsonObject = {};
    this.readChar(); // 最初の '{' を読み飛ばす
    this.skipWhitespace();
    if (this.getChar() === OBJECT_END) {
      this.index++;
      return o; // 空のオブジェクト
    }
    while (this.isInProgress()) {
      const key = this.parseString();
      this.skipWhitespace();
      // TODO: 空文字列が返ってきた場合 & ':'じゃない場合
      this.readChar(); // ':' を読み飛ばす
      this.skipWhitespace();
      o[key] = this.parseValue();
      this.skipWhitespace();
      // TODO: 空文字列が返ってきた場合
      const c = this.readChar();
      if (c === OBJECT_END) {
        break;
      }
      if (c !== OBJECT_DELIMITER) {
        throw new SyntaxError("Invalid object");
      }
      this.skipWhitespace();
    }
    return o;
  }

  parseValue() {
    this.skipWhitespace();
    const c = this.getChar();
    switch (c) {
      case OBJECT_START:
        return this.parseObject();
      case ARRAY_START:
        return this.parseArray();
      case QUOTE:
        return this.parseString();
      // TODO: null, true, false, 0-9
      default:
        return this.parseNumber();
    }
  }
}

export function parseJSON(json: string) {
  const p = new JSONParser(json);
  return p.parseValue();
}
