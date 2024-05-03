import { parseJSON } from "./json_parser.ts";

// 使用例
const jsonString =
  '{"name":"John Doe","age":30,"city":"Tokyo","hobbies":["reading","hiking","coding"]}';
const obj = parseJSON(jsonString);
console.log(obj);
