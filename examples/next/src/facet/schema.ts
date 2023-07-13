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

    test: f.list(f.map({ name: f.string() })).optional(),

    deeply: f
      .map({
        nested: f.map({
          property: f.map({
            required: f.string(),
            example: f.number().optional(),
          }),
        }),
      })
      .optional(),
  },
});

(async () => {
  const user1Id = await KSUID.random();

  const user1 = await users.create({
    PK: `$user#id_${user1Id.string}`,
    SK: `$user`,
    id: user1Id.string,

    test: [{ name: "sam" }],

    deeply: {
      nested: {
        property: {
          required: "",
        },
      },
    },
  });

  const user2Id = await KSUID.random();

  const user2 = await users.create({
    PK: `$user#id_${user2Id.string}`,
    SK: `$user`,
    id: user2Id.string,
  });

  console.log(user1);

  const found = await users.get(`$user#id_${user1Id.string}`, `$user`);
  console.log(found);
})();
