import { createTable, f } from "facet";

const table = createTable({
  name: "Facet",
});

export const organizations = table.entity({
  schema: {
    id: f.number(),
    name: f.string(),
  },
});

export const users = table.entity({
  schema: {
    id: f.number(),
    name: f.string(),
    email: f.string(),
  },
});
