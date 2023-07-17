import { createTable, f } from "facet";

const table = createTable({
  name: "Facet",
});

export const users = table.entity({
  attributes: {
    PK: f.string(),
    SK: f.string(),

    id: f
      .string()
      .list()
      .default(() => ["hi!"]),

    email: f.string(),
  },
});

(async () => {})();
