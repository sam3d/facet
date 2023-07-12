import { CreateEntityInput, createTable, f } from "facet";

const table = createTable({
  name: "Facet",
});

export const users = table.entity({
  schema: {
    id: f.string(),
    org: f.map({
      id: f.string(),
      userCount: f.number(),
    }),
  },
});

const create: CreateEntityInput<(typeof users)["_schema"]> = {
  id: "test",
  org: {
    id: "5",
    userCount: 20,
  },
};
