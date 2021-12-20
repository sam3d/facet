import { NextPage } from "next";
import { useMemo, useRef, useState } from "react";
import { parseSchema, stringifySchema } from "utils/schema";

const defaultSchema = `entity Organisation {
  id number
  name string
  users User[]
}

entity User {
  id number
  organisation Organisation
  name string
  sessions Session[]
}

entity Session {
  id string
  token string
  user User
}`;

const IndexPage: NextPage = () => {
  const textarea = useRef<HTMLTextAreaElement | null>(null);
  const [code, setCode] = useState(stringifySchema(parseSchema(defaultSchema)));
  const schema = useMemo(() => parseSchema(code), [code]);

  return (
    <div className="absolute inset-0 bg-gray-900 flex flex-col">
      <div className="flex-1 m-4 grid h-full overflow-auto grid-cols-2 gap-4">
        <div>
          <textarea
            ref={textarea}
            className="bg-gray-800 w-full overflow-auto whitespace-nowrap h-full rounded resize-none text-sm focus:outline-none text-white font-mono p-4"
            value={code}
            onChange={(ev) => setCode(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "s" && ev.metaKey) {
                if (!textarea.current) return;
                ev.preventDefault();

                const start = textarea.current.selectionStart;
                textarea.current.value = stringifySchema(schema);
                setCode(textarea.current.value);

                textarea.current.selectionStart =
                  textarea.current.selectionEnd = start;
              }

              if (ev.key === "Tab") {
                if (!textarea.current) return;
                const start = textarea.current.selectionStart;
                ev.preventDefault();
                textarea.current.value =
                  code.substring(0, start) + "\t" + code.substring(start);
                setCode(textarea.current.value);

                textarea.current.selectionStart =
                  textarea.current.selectionEnd = start + 1;
              }
            }}
          />
        </div>

        <pre className="bg-gray-800 p-4 rounded overflow-auto text-white text-xs">
          {JSON.stringify(schema, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default IndexPage;
