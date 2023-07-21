import { createTable, f } from "facet";
import KSUID from "ksuid";

const generateId = async () => (await KSUID.random()).string;

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
        status: f
          .map({
            isAdmin: f.boolean().default(false),
            scopes: f.stringSet().optional(),
          })
          .default({}),
      })
      .readOnly(),

    createdAt: f.date().default(() => new Date()),
  },

  primaryKey: {
    needs: { id: true, organization: { id: true } },
    compute: (user) => {},
  },
});

(async () => {
  users.create({
    email: "test.user@gmail.com",

    organization: {
      id: "1234",
      name: "Test User",
    },
  });
})();
