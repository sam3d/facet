import { createTable, f } from "facet";
import KSUID from "ksuid";

const generateId = async () => (await KSUID.random()).string;

const table = createTable({
  name: "Facet",
});

export const organizations = table.entity({
  name: "organization",

  attributes: {
    id: f.string().default(generateId).readOnly(),
    name: f.string(),

    createdAt: f.string().default(() => new Date().toISOString()),

    deeply: f.map({
      nested: f.map({
        property: f.map({
          example: f.string().readOnly(),
          other: f.string().optional(),
        }),
      }),
    }),
  },

  primaryKey: {
    needs: { id: true },
    compute(org) {
      return { PK: "", SK: "" };
    },
  },
});

export const users = table.entity({
  name: "user",

  attributes: {
    id: f.string().default(generateId).readOnly(),
    name: f.string(),
    email: f.string(),
    organizationId: f.string().optional(),

    deeply: f
      .map({
        nested: f.map({
          list: f.stringSet().list().optional(),
        }),
      })
      .optional(),

    createdAt: f.string().default(() => new Date().toISOString()),
  },

  primaryKey: {
    needs: { id: true },
    compute(user) {
      return { PK: "", SK: "" };
    },
  },
});

(async () => {
  const user = users.serialize({
    id: await generateId(),
    name: "Test User",
    email: "test.user@gmail.com",
    deeply: { nested: { list: [new Set(["test"])] } },
    createdAt: new Date().toISOString(),
  });

  console.log(JSON.stringify(user, null, 4), users.deserialize(user));
})();
