import Editor from "@monaco-editor/react";
import { NextPage } from "next";
import Link from "next/link";
import { exampleSchema } from "utils/facet/example";

const PlayPage: NextPage = () => {
  return (
    <div className="flex fixed inset-0 flex-col bg-gray-900">
      <Navbar />

      <div className="grid flex-1 grid-cols-3">
        <div>
          <Editor defaultValue={exampleSchema} />
        </div>

        <div className="col-span-2 bg-gray-800"></div>
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
