import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

const IndexPage: NextPage = () => {
  return (
    <div className="flex overflow-auto fixed inset-0 text-gray-900 bg-gray-100">
      <Head>
        <title>facet</title>
      </Head>

      <div className="p-8 m-auto max-w-3xl text-lg">
        <p className="flex items-center text-5xl font-semibold">
          <span>facet</span>
          <span className="py-1 px-3 ml-4 text-sm text-gray-100 uppercase bg-gray-900 rounded">
            alpha
          </span>
        </p>

        <p className="mt-8">
          facet is an experimental single-table design ORM for DynamoDB that
          aims to have the best-in-class DX of any NoSQL modelling solution that
          is currently available.
        </p>

        <p className="mt-4 font-bold">
          It will be fully open source and entirely free. Forever.
        </p>

        <p className="mt-4">
          To accomplish this, we are building a custom schema language, entity
          and access pattern visualisations, and code generation. This is a
          brand new project, and everything is currently extremely experimental.
          Please bear with us as we take this from an RFC into a fully fledged
          suite of developer tooling.
        </p>

        <Link href="/play">
          <a className="group inline-flex items-center mt-8 text-gray-500">
            <p>&rarr;</p>

            <div className="ml-4">
              <p className="font-medium text-blue-600 group-hover:underline">
                Play with facet
              </p>
              <p className="text-sm">
                Experimental schema editor with visualisations
              </p>
            </div>
          </a>
        </Link>
      </div>
    </div>
  );
};

export default IndexPage;
