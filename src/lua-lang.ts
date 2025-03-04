import { StreamLanguage } from "@codemirror/language";

// Define Lua keywords and syntax
const keywords = [
  "and", "break", "do", "else", "elseif", "end", "false", "for",
  "function", "if", "in", "local", "nil", "not", "or", "repeat",
  "return", "then", "true", "until", "while"
];

const operators = [
  "+", "-", "*", "/", "%", "^", "#", "==", "~=", "<=", ">=",
  "<", ">", "=", "(", ")", "{", "}", "[", "]", ";", ":", ",",
  ".", "..", "..."
];

// Create a simple tokenizer for Lua
const luaLanguage = StreamLanguage.define({
  name: "lua",
  startState: () => ({
    inString: false,
    stringType: null as string | null,
    inComment: false,
    commentDepth: 0
  }),
  token: (stream, state) => {
    // Handle strings
    if (state.inString) {
      while (!stream.eol()) {
        if (stream.next() === state.stringType && !stream.match("\\\\" + state.stringType)) {
          state.inString = false;
          state.stringType = null;
          break;
        }
      }
      return "string";
    }

    // Handle multi-line comments
    if (state.inComment) {
      while (!stream.eol()) {
        if (stream.match("]]")) {
          state.inComment = false;
          break;
        }
        stream.next();
      }
      return "comment";
    }

    // Skip whitespace
    if (stream.eatSpace()) return null;

    // Handle single-line comments
    if (stream.match("--")) {
      stream.skipToEnd();
      return "comment";
    }

    // Handle multi-line comment start
    if (stream.match("--[[")) {
      state.inComment = true;
      return "comment";
    }

    // Handle strings
    if (stream.match('"') || stream.match("'")) {
      state.inString = true;
      state.stringType = stream.string.charAt(stream.pos - 1);
      return "string";
    }

    // Handle numbers
    if (stream.match(/^-?[0-9]+(\.[0-9]+)?/)) return "number";

    // Handle keywords
    const wordMatch = stream.match(/^\w+/) as RegExpMatchArray | null;
    if (wordMatch && wordMatch[0]) {
      if (keywords.includes(wordMatch[0])) return "keyword";
      return "variable";
    }

    // Handle operators
    for (let op of operators) {
      if (stream.match(op)) return "operator";
    }

    stream.next();
    return null;
  }
});

export { luaLanguage }; 