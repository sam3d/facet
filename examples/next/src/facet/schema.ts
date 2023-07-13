import { createTable, f } from "facet";
import KSUID from "ksuid";

const table = createTable({
  name: "Facet",
});

export const users = table.entity({
  attributes: {
    PK: f.string(),
    SK: f.string(),
    id: f.string(),
    rateLimitCount: f.number(),
    isAdmin: f.boolean(),

    sessions: f.list(
      f.map({
        id: f.string(),
        token: f.string(),
        isActive: f.boolean(),
      }),
    ),
  },
});

(async () => {
  const id = await KSUID.random();

  const res = await users.create({
    PK: `$user#id_${id.string}`,
    SK: `$user`,
    id: id.string,
    rateLimitCount: 20,
    isAdmin: false,

    sessions: [{ id: "1", token: "1223123", isActive: true }],
  });

  console.log(res);

  const found = await users.get(`$user#id_${id.string}`, `$user`);
  console.log(found);
})();
