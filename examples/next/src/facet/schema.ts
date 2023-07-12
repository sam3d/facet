import { createTable, f } from "facet";
import KSUID from "ksuid";

const table = createTable({
  name: "Facet",
});

export const users = table.entity({
  schema: {
    PK: f.string(),
    SK: f.string(),
    id: f.string(),
    org: f.map({
      headerPic: f.binary(),
      id: f.string(),
      isAdmin: f.boolean(),
      userCount: f.number(),
    }),
  },
});

(async () => {
  const id = await KSUID.random();

  const res = await users.create({
    PK: `$user#id_${id.string}`,
    SK: `$user`,
    id: id.string,
    org: {
      headerPic: new Uint8Array([0x12]),
      id: id.string,
      isAdmin: false,
      userCount: Math.random(),
    },
  });
  console.log(res);

  const found = await users.get(`$user#id_${id.string}`, `$user`);
  console.log(found);
})();
