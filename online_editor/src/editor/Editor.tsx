import { Lexer } from "@clyde-lang/parser";
import codeInput from "@webcoder49/code-input";
import Indent from "@webcoder49/code-input/plugins/indent.mjs";
import "@webcoder49/code-input/code-input.css";
import "./Editor.css";
import { useEffect } from "react";
import { loadState, saveState } from "../storage/localStorage.js";

const tokenMapping = {
  // [Lexer.TOKENS.TEXT]: "",
  // [Lexer.TOKENS.INDENT]: "",
  // [Lexer.TOKENS.DEDENT]: "",
  [Lexer.TOKENS.OPTION]: "function",
  [Lexer.TOKENS.STICKY_OPTION]: "function",
  [Lexer.TOKENS.FALLBACK_OPTION]: "function",
  [Lexer.TOKENS.BRACKET_OPEN]: "punctuation",
  [Lexer.TOKENS.BRACKET_CLOSE]: "punctuation",
  // [Lexer.TOKENS.EOF]: "",
  [Lexer.TOKENS.SPEAKER]: "string",
  [Lexer.TOKENS.LINE_ID]: "variable",
  [Lexer.TOKENS.TAG]: "tag",
  [Lexer.TOKENS.ID_SUFFIX]: "variable",
  [Lexer.TOKENS.BLOCK]: "keyword",
  [Lexer.TOKENS.DIVERT]: "function",
  [Lexer.TOKENS.DIVERT_PARENT]: "function",
  [Lexer.TOKENS.VARIATIONS_MODE]: "keyword",
  [Lexer.TOKENS.MINUS]: "operator",
  [Lexer.TOKENS.PLUS]: "operator",
  [Lexer.TOKENS.MULT]: "operator",
  [Lexer.TOKENS.DIV]: "operator",
  [Lexer.TOKENS.POWER]: "operator",
  [Lexer.TOKENS.MOD]: "operator",
  [Lexer.TOKENS.BRACE_OPEN]: "punctuation",
  [Lexer.TOKENS.BRACE_CLOSE]: "punctuation",
  [Lexer.TOKENS.AND]: "keyword",
  [Lexer.TOKENS.OR]: "keyword",
  [Lexer.TOKENS.NOT]: "keyword",
  [Lexer.TOKENS.EQUAL]: "keyword",
  [Lexer.TOKENS.NOT_EQUAL]: "keyword",
  [Lexer.TOKENS.GE]: "keyword",
  [Lexer.TOKENS.LE]: "keyword",
  [Lexer.TOKENS.GREATER]: "keyword",
  [Lexer.TOKENS.LESS]: "keyword",
  [Lexer.TOKENS.NUMBER_LITERAL]: "number",
  [Lexer.TOKENS.NULL_TOKEN]: "keyword",
  [Lexer.TOKENS.BOOLEAN_LITERAL]: "boolean",
  [Lexer.TOKENS.STRING_LITERAL]: "string",
  [Lexer.TOKENS.IDENTIFIER]: "variable",
  [Lexer.TOKENS.KEYWORD_SET]: "keyword",
  [Lexer.TOKENS.KEYWORD_TRIGGER]: "keyword",
  [Lexer.TOKENS.KEYWORD_WHEN]: "keyword",
  [Lexer.TOKENS.KEYWORD_MATCH]: "keyword",
  [Lexer.TOKENS.KEYWORD_DEFAULT]: "keyword",
  [Lexer.TOKENS.ASSIGN]: "operator",
  [Lexer.TOKENS.ASSIGN_SUM]: "operator",
  [Lexer.TOKENS.ASSIGN_SUB]: "operator",
  [Lexer.TOKENS.ASSIGN_DIV]: "operator",
  [Lexer.TOKENS.ASSIGN_MULT]: "operator",
  [Lexer.TOKENS.ASSIGN_POW]: "operator",
  [Lexer.TOKENS.ASSIGN_MOD]: "operator",
  [Lexer.TOKENS.ASSIGN_INIT]: "operator",
  // [Lexer.TOKENS.COMMA]: "",
  // [Lexer.TOKENS.LINE_BREAK]: "",
  [Lexer.TOKENS.LINK_FILE]: "url",
};

function replaceInLine(line: string, t: Lexer.Token, type: string) {
  const l = t.length ? t.length : t.value?.length || 1;
  return (
    line.slice(0, t.column) +
    `<span class="token ${type}">` +
    line.slice(t.column, t.column + l) +
    "</span>" +
    line.slice(t.column + l)
  );
}

function replaceInterpolatedVars(line: string, t: Lexer.Token) {
  const l = t.length ? t.length : t.value?.length || 1;
  //@ts-ignore
  const text = line
    .slice(t.column, t.column + l)
    .replaceAll(/(%[\w|@]+%)/g, "<span class='token variable'>$1</span>");

  return line.slice(0, t.column) + text + line.slice(t.column + l);
}

const DEFAULT_DIALOGUE = `--
-- Clyde Editor Sample dialogue
--

NPC: Hello! You can try Clyde in this editor!
Guide:
	This dialogue will show back if you leave the editor empty
		and reload the page.
	The content in this editor is automatically saved in your
		local store for convenience.
	If you open you browser's inspector you can see logs for
		events and variable changes
	Also, properties set in "window.clydeVariables" can be
    accessed as external variables. For example, if you
    set "clydeVariables.myVar = true", you can access it
    like \\{ \\@myVar \\}
	That's all folks! #goodbye
`;

interface EditorParams {
  onContentChanged: (content: string) => void;
}

export function Editor({ onContentChanged }: EditorParams) {
  const state = loadState();
  const initialDialogue = state?.dialogue.trim() ? state.dialogue : DEFAULT_DIALOGUE;

  useEffect(() => {
    codeInput.registerTemplate(
      "syntax-highlighted",
      new codeInput.Template(
        function (result_element: HTMLElement) {
          let text = result_element.innerText;
          saveState({ dialogue: text });
          onContentChanged(text);

          const tokens = Lexer.tokenize(text).getAll();
          const lines = text.split(/\r\n|\r|\n/);

          for (let i = tokens.length - 1; i >= 0; i--) {
            const t = tokens[i];
            let line = lines[t.line];

            if (tokenMapping[t.token]) {
              lines[t.line] = replaceInLine(line, t, tokenMapping[t.token]);
            } else if (t.token === Lexer.TOKENS.TEXT) {
              lines[t.line] = replaceInterpolatedVars(line, t);
            }
          }

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith("--")) {
              lines[i] = `<span class="token comment">` + lines[i] + "</span>";
            }
          }

          result_element.innerHTML = result_element.innerHTML = lines.join("\n");
        },

        true /* Optional - Is the `pre` element styled as well as the `code` element?
         * Changing this to false uses the code element as the scrollable one rather
         * than the pre element */,

        true /* Optional - This is used for editing code - setting this to true sets the `code`
         * element's class to `language-<the code-input's lang attribute>` */,

        false /* Optional - Setting this to true passes the `<code-input>` element as a second
         * argument to the highlight function to be used for getting data- attribute values
         * and using the DOM for the code-input */,

        [
          new Indent() as any,
          // new codeInput.plugins.Indent()
        ],
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <code-input template="syntax-highlighted" className="code-input-container">
        <textarea data-code-input-fallback defaultValue={initialDialogue}></textarea>
      </code-input>
    </>
  );
}

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      // "code-input": DetailedHTMLProps<HTMLAttributes<any>, any>;
      "code-input": any;
    }
  }
}

// declare global {
//   namespace JSX {
//     interface IntrinsicElements {
//       // "code-input": any,
//       "textarea": any,
//       "code-input": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
//     }
//   }
// }
