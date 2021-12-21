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
            options={{ fontSize: 14 }}
            beforeMount={(monaco) => {
              monaco.editor.defineTheme("facet", {
                base: "vs-dark",
                inherit: true,
                rules: [
                  { token: "", foreground: "#f3f4f6", background: "#111827" },
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

        <div className="overflow-auto p-4 bg-gray-800">
          <div className="p-4 text-gray-300 bg-gray-900 rounded">
            <p className="text-lg font-medium text-center text-gray-400">
              Schema design recommendations / thoughts
            </p>

            <div className="pl-3 mt-3 border-l border-gray-500">
              <p>Don&apos;t overuse item collections</p>

              <p className="text-sm text-gray-400">
                Item collections are when you place multiple different entity
                types in the same partition key. This is so you can retrieve
                both sides of the one-to-many relationship at once. This is a
                powerful and common pattern, but generally not necessary (and
                also there are limited options for modelling this relational
                strategy in DynamoDB). Item collections are only created when
                the parent entity specifies a child array in the schema.
              </p>
            </div>
          </div>
        </div>
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
