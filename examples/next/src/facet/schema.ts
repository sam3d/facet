import { createTable, f } from "facet";
import { inspect } from "util";

const table = createTable({
  name: "Facet",
});

export const users = table.entity({
  schema: {
    id: f.string(),
  },
});

const eg = f.map({
  name: f.string(),
  details: f.map({
    other: f.string(),
    with: f.number(),
  }),
});

const res = eg.serialize({
  name: "sam",
  other: "test",
  details: { other: "test", with: 5 },
});

console.log(inspect(res, false, 4));

const output = eg.deserialize(res);
console.log(output);
