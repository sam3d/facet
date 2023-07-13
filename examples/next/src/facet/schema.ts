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

    users: f.stringSet(),
    ages: f.numberSet(),
    profilePics: f.binarySet(),

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

    users: new Set(["mark", "sarah", "john"]),
    ages: new Set([25, 28, 21]),
    profilePics: new Set([
      new Uint8Array([0x01]),
      new Uint8Array([0x02]),
      new Uint8Array([0x03]),
    ]),

    sessions: [{ id: "1", token: "1223123", isActive: true }],
  });

  console.log(res);

  const found = await users.get(`$user#id_${id.string}`, `$user`);
  console.log(found);
})();
