export type JsonObject =
  | null
  | boolean
  | number
  | string
  | { [key: string]: JsonObject }
  | JsonObject[];

type ResultParse = {
  done: boolean;
  value: JsonObject;
};

type ResultUndone = {
  done: false;
  value: null;
};

type ResultParseNull = {
  done: boolean;
  value: null;
};

type ResultParseBoolean = {
  done: true;
  value: boolean;
} | ResultUndone;

type ResultParseNumber = {
  done: true;
  value: number;
} | ResultUndone;

type ResultParseString = {
  done: true;
  value: string;
} | ResultUndone;

type ResultParseArray = {
  done: true;
  value: JsonObject[];
} | ResultUndone;

type ResultParseObject = {
  done: true;
  value: { [key: string]: JsonObject };
} | ResultUndone;

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

  private getRestChars() {
    return this.json.slice(this.index);
  }

  private readChar() {
    return this.json.charAt(this.index++);
  }

  private readChars(count: number) {
    const s = this.json.slice(this.index, this.index + count);
    this.index += Math.min(count, this.json.length - this.index);
    return s;
  }

  private skipChar() {
    this.index++;
  }

  private skipWhitespaces() {
    const result = this.getRestChars().match(/^\s*/);
    if (result) {
      this.index += result[0].length;
    }
  }

  private parseNull(): ResultParseNull {
    this.skipWhitespaces();
    if (!this.isInProgress()) {
      throw new SyntaxError("Unexpected end of input");
    }

    const capital = this.getChar();
    if (capital !== "n") {
      return { done: false, value: null };
    }

    const s = this.readChars(4);
    if (s !== "null") {
      throw new SyntaxError(`Unexpected token "${s}"`);
    }
    return { done: true, value: null };
  }

  private parseBoolean(): ResultParseBoolean {
    this.skipWhitespaces();
    if (!this.isInProgress()) {
      throw new SyntaxError("Unexpected end of input");
    }

    const capital = this.getChar();
    if (!["t", "f"].includes(capital)) {
      return { done: false, value: null };
    }

    const s = this.readChars(this.getChar() === "t" ? 4 : 5);
    if (!["true", "false"].includes(s)) {
      throw new SyntaxError(`Unexpected token "${s}"`);
    }
    return { done: true, value: (s === "true" ? true : false) };
  }

  private parseNumber(): ResultParseNumber {
    this.skipWhitespaces();
    if (!this.isInProgress()) {
      throw new SyntaxError("Unexpected end of input");
    }

    const capital = this.getChar();
    if (!(capital === "-" || capital.match(/^\d$/))) {
      return { done: false, value: null };
    }

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

    return { done: true, value: parseFloat(s) };
  }

  private parseString(): ResultParseString {
    this.skipWhitespaces();
    if (!this.isInProgress()) {
      throw new SyntaxError("Unexpected end of input");
    }

    const capital = this.getChar();
    if (capital !== '"') {
      return { done: false, value: null };
    }

    this.skipChar();

    let s = "";
    let c = "";
    while (this.isInProgress()) {
      c = this.readChar();
      if (c === '"') {
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

    if (c !== '"') {
      throw new SyntaxError("Closing quote not exist");
    }

    return { done: true, value: s };
  }

  private parseArray(): ResultParseArray {
    this.skipWhitespaces();
    if (!this.isInProgress()) {
      throw new SyntaxError("Unexpected end of input");
    }

    const capital = this.getChar();
    if (capital !== "[") {
      return { done: false, value: null };
    }

    this.skipChar();
    this.skipWhitespaces();

    const a: JsonObject[] = [];

    if (this.getChar() === "]") {
      this.skipChar();
      return { done: true, value: a }; // 空の配列
    }

    while (true) {
      a.push(this.parseValue());

      this.skipWhitespaces();
      if (!this.isInProgress()) {
        throw new SyntaxError("Lack of closing bracket");
      }

      const c = this.readChar();
      if (c === "]") {
        break;
      }
      if (c !== ",") {
        throw new SyntaxError(`Unexpected token "${c}"`);
      }
    }

    return { done: true, value: a };
  }

  private parseObject(): ResultParseObject {
    this.skipWhitespaces();
    if (!this.isInProgress()) {
      throw new SyntaxError("Unexpected end of input");
    }

    const capital = this.getChar();
    if (capital !== "{") {
      return { done: false, value: null };
    }

    this.skipChar();
    this.skipWhitespaces();

    const o: JsonObject = {};

    if (this.getChar() === "}") {
      this.skipChar();
      return { done: true, value: o }; // 空のオブジェクト
    }

    while (true) {
      const { done, value: key } = this.parseString();
      if (!done) {
        throw new SyntaxError("Non-string key");
      }

      this.skipWhitespaces();
      if (!this.isInProgress()) {
        throw new SyntaxError("Lack of colon");
      }

      const colon = this.readChar();
      if (colon !== ":") {
        throw new SyntaxError(`Unexpected token "${colon}"`);
      }

      o[key] = this.parseValue();

      this.skipWhitespaces();
      if (!this.isInProgress()) {
        throw new SyntaxError("Lack of closing brace");
      }

      const c = this.readChar();
      if (c === "}") {
        break;
      }
      if (c !== ",") {
        throw new SyntaxError(`Unexpected token "${c}"`);
      }
    }

    return { done: true, value: o };
  }

  parseValue() {
    let { done, value }: ResultParse = this.parseObject();
    if (done) {
      return value;
    }

    ({ done, value } = this.parseArray());
    if (done) {
      return value;
    }

    ({ done, value } = this.parseNull());
    if (done) {
      return value;
    }

    ({ done, value } = this.parseBoolean());
    if (done) {
      return value;
    }

    ({ done, value } = this.parseNumber());
    if (done) {
      return value;
    }

    ({ done, value } = this.parseString());
    if (done) {
      return value;
    }

    const c = this.getChar();
    throw new SyntaxError(`Unexpected token "${c}"`);
  }

  assertEndOfInput() {
    const result = this.getRestChars().match(/\S/);
    if (result) {
      throw new SyntaxError(`Unexpected token "${result[0]}"`);
    }
  }
}

export function parseJSON(json: string) {
  const p = new JSONParser(json);
  const result = p.parseValue();
  p.assertEndOfInput();
  return result;
}
