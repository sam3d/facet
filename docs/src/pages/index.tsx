import { NextPage } from "next";
import { useMemo, useState } from "react";
import { parseSchema, stringifySchema } from "utils/schema";

const IndexPage: NextPage = () => {
  const [code, setCode] = useState(
    "entity Organisation { id Number } entity User { id Number }"
  );
  const schema = useMemo(() => parseSchema(code), [code]);

  return (
    <div className="absolute inset-0 bg-gray-900 flex flex-col">
      <div className="flex-1 m-4 grid h-full grid-cols-2 gap-4">
        <div>
          <textarea
            className="bg-gray-800 w-full overflow-auto whitespace-nowrap h-full rounded resize-none text-sm focus:outline-none text-white font-mono p-4"
            value={code}
            onChange={(ev) => setCode(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "s" && ev.metaKey) {
                ev.preventDefault();
                setCode(stringifySchema(schema));
              }

              if (ev.key === "Tab") {
                ev.preventDefault();
              }
            }}
          />
        </div>

        <div>
          <div className="bg-gray-800 p-4 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
