import { NextPage } from "next";

const IndexPage: NextPage = () => {
  return (
    <div className="fixed inset-0 flex bg-gray-100 overflow-auto">
      <div className="m-auto p-8 max-w-3xl text-gray-700 text-lg">
        <p className="text-5xl font-semibold text-gray-900 flex items-center">
          <span>facet</span>
          <span className="text-sm ml-4 bg-gray-900 text-white rounded uppercase px-3 py-1">
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
      </div>
    </div>
  );
};

export default IndexPage;
