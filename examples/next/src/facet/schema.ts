import { createTable, f } from "facet";
import KSUID from "ksuid";

const generateId = async () => (await KSUID.random()).string;

function compose(prefix: string | string[], params?: Record<string, string>) {
  return (
    "$" +
    [
      ...(Array.isArray(prefix) ? prefix : [prefix]),
      ...Object.entries(params ?? {}).map((param) => param.join("_")),
    ].join("#")
  );
}

const table = createTable({
  name: "Facet",
});

export const users = table.entity({
  name: "user",

  attributes: {
    id: f.string().default(generateId).readOnly(),
    name: f.string().optional(),
    email: f.string(),

    organization: f
      .map({
        id: f.string().readOnly(),
        name: f.string(),
      })
      .readOnly(),

    createdAt: f.date().default(() => new Date()),
  },

  primaryKey: {
    needs: { id: true },
    compute({ id }) {
      return {
        PK: compose("user", { id }),
        SK: compose("user"),
      };
    },
  },
});

(async () => {
  const res = await users.create({
    email: "test.user@gmail.com",

    organization: {
      id: "1234",
      name: "Test User",
    },
  });
})();
