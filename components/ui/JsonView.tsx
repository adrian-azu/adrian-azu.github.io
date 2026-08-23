// OWNER: 01-foundation.md — do not edit from another role
// Syntax-highlighted JSON renderer for API Playground request/response bodies (§10 syntax
// palette: keys #79C0FF/accent-primary-ish, strings #A5D6FF, numbers #F2CC60, punctuation
// #8B949E — wired here as the `--syntax-*` custom properties from app/globals.css so both themes
// stay legible). Pure token rendering, no `dangerouslySetInnerHTML`.

type TokenKind = "key" | "string" | "number" | "boolean" | "null" | "punctuation" | "whitespace";

interface JsonToken {
  text: string;
  kind: TokenKind;
}

const TOKEN_PATTERN =
  /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?)|(\btrue\b|\bfalse\b)|(\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],:])|(\s+)/g;

function tokenize(json: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  let match: RegExpExecArray | null;
  TOKEN_PATTERN.lastIndex = 0;
  while ((match = TOKEN_PATTERN.exec(json)) !== null) {
    const [text, stringToken, boolToken, nullToken, numberToken, punctToken, wsToken] = match;
    let kind: TokenKind;
    if (stringToken !== undefined) {
      kind = /:\s*$/.test(stringToken) ? "key" : "string";
    } else if (boolToken !== undefined) {
      kind = "boolean";
    } else if (nullToken !== undefined) {
      kind = "null";
    } else if (numberToken !== undefined) {
      kind = "number";
    } else if (punctToken !== undefined) {
      kind = "punctuation";
    } else if (wsToken !== undefined) {
      kind = "whitespace";
    } else {
      kind = "punctuation";
    }
    tokens.push({ text, kind });
  }
  return tokens;
}

const KIND_CLASS: Record<TokenKind, string> = {
  key: "text-syntax-key",
  string: "text-syntax-string",
  number: "text-syntax-number",
  boolean: "text-syntax-number",
  null: "text-syntax-number",
  punctuation: "text-syntax-punctuation",
  whitespace: "",
};

export interface JsonViewProps {
  data: unknown;
  className?: string;
  indent?: number;
}

export function JsonView({ data, className = "", indent = 2 }: JsonViewProps) {
  const json = JSON.stringify(data, null, indent) ?? "undefined";
  const tokens = tokenize(json);

  return (
    <pre className={`overflow-x-auto rounded-panel bg-bg p-3 font-mono text-xs leading-relaxed ${className}`.trim()}>
      <code>
        {tokens.map((token, i) => {
          const cls = KIND_CLASS[token.kind];
          return cls ? (
            <span key={i} className={cls}>
              {token.text}
            </span>
          ) : (
            <span key={i}>{token.text}</span>
          );
        })}
      </code>
    </pre>
  );
}

export default JsonView;
