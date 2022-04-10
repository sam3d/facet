import Editor from "@monaco-editor/react";
import { NextPage } from "next";
import Link from "next/link";
import { useState } from "react";
import { exampleSchema } from "utils/facet/example";

const PlayPage: NextPage = () => {
  const [rawSchema, setRawSchema] = useState(exampleSchema);

  return (
    <div className="flex fixed inset-0 flex-col bg-gray-900">
      <Navbar />

      <div className="grid flex-1 grid-cols-2">
        <div>
          <Editor
            value={rawSchema}
            onChange={(value) => setRawSchema(value ?? "")}
            theme="facet"
            loading={<div></div>}
            options={{ fontSize: 14 }}
            language="facet"
            beforeMount={(monaco) => {
              monaco.languages.register({ id: "facet" });

              monaco.languages.setMonarchTokensProvider("facet", {
                tokenizer: {
                  root: [
                    [/\/\/.*/, "comment"],
                    [
                      /(^)(entity|enum)(\s+)([a-zA-Z0-9_]*)(\s+)({)/,
                      ["", "declaration", "", "type", "", ""],
                    ],
                  ],
                },
              });

              monaco.editor.defineTheme("facet", {
                base: "vs-dark",
                inherit: true,
                rules: [
                  { token: "", foreground: "#cbd5e1", background: "#111827" },
                  { token: "declaration", foreground: "#d8b4fe" },
                  { token: "type", foreground: "#fde047" },
                  { token: "comment", foreground: "#4b5563" },
                ],
                colors: {
                  "editor.background": "#111827",
                  "editorCursor.foreground": "#fde047",
                  "editor.lineHighlightBackground": "#FFFFFF11",
                  "editor.selectionBackground": "#FFFFFF22",
                  "editorLineNumber.foreground": "#374151",
                  "editorIndentGuide.background": "#374151",
                  "editorLineNumber.activeForeground": "#6b7280",
                  "editorIndentGuide.activeBackground": "#6b7280",
                  "scrollbar.shadow": "#00000077",
                },
              });
            }}
          />
        </div>

        <div className="overflow-auto bg-gray-800"></div>
      </div>
    </div>
  );
};

export default PlayPage;

function Navbar() {
  return (
    <div className="p-4 text-gray-100">
      <div className="flex items-center">
        <Link href="/">
          <a className="text-gray-500 hover:text-gray-300">&larr;</a>
        </Link>

        <p className="ml-2 text-xl font-medium">facet</p>

        <p className="py-1 px-2 ml-2 text-xs font-medium tracking-wider uppercase bg-indigo-600 rounded">
          play
        </p>
      </div>
    </div>
  );
}
