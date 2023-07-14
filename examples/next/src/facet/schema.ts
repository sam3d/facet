import { createTable, f } from "facet";
import KSUID from "ksuid";

const table = createTable({
  name: "Facet",
});

export const users = table.entity({
  attributes: {
    id: f.string().default(async () => (await KSUID.random()).string),
    email: f.string(),
  },
});

users.create({
  email: "example.user@gmail.com",
});
