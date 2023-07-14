import { createTable, f } from "facet";
import KSUID from "ksuid";

const table = createTable({
  name: "Facet",
});

export const users = table.entity({
  attributes: {
    PK: f.string(),
    SK: f.string(),

    id: f.string().default(async () => (await KSUID.random()).string),
    names: f
      .string()
      .list()
      .default(() => ["DEFAULT"]),
    email: f.string(),
  },
});

(async () => {
  const res = await users.create({
    PK: "test",
    SK: "test",
    email: "example.user@gmail.com",
  });
  console.log(res);

  const user = await users.get("test", "test");
  console.log(user!.id);
})();
