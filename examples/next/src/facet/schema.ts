import { createTable, f } from "facet";
import KSUID from "ksuid";

function compose(prefix: string | string[], params?: Record<string, string>) {
  return (
    "$" +
    [
      ...(Array.isArray(prefix) ? prefix : [prefix]),
      ...Object.entries(params ?? {}).map((param) => param.join("_")),
    ].join("#")
  );
}

const table = createTable({
  name: "Facet",
});

export const organizations = table.entity({
  attributes: {
    type: f.tag("organization"),
  },
});

export const users = table.entity({
  attributes: {
    type: f.tag("user"),
    id: f.string().default(() => KSUID.randomSync().string),
    email: f.string(),
    passwordHash: f.binary().optional(),
    name: f.string().optional(),
    organization: f
      .map({
        id: f.string(),
        isAdmin: f.boolean().default(false),
        joinedAt: f.date().default(() => new Date()),
      })
      .optional(),
    createdAt: f.date().default(() => new Date()),
    updatedAt: f.date().optional(),
  },
});
