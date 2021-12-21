import Editor from "@monaco-editor/react";
import { NextPage } from "next";
import Link from "next/link";

const PlayPage: NextPage = () => {
  return (
    <div className="flex fixed inset-0 flex-col bg-gray-900">
      <Navbar />

      <div className="flex flex-1">
        <div className="flex-1">
          <Editor />
        </div>

        <div className="flex-1"></div>
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
