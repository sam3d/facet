import { createTable, f } from "facet";

const table = createTable({
  name: "Facet",
});

export const users = table.entity({
  attributes: {
    PK: f.string(),
    SK: f.string(),

    deeply: f.map({
      nested: f.map({
        property: f.map({
          example: f.string(),
          other: f.number().optional(),
        }),
      }),
    }),
  },
});

(async () => {})();
