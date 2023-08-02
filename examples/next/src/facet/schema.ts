import { createTable, f } from "facet";
import KSUID from "ksuid";

const table = createTable({
  name: "Facet",
});

export const organization = table.entity({
  attributes: {
    type: f.tag("organization"),
    id: f.string().default(() => KSUID.randomSync().string),
    name: f.string(),
    createdAt: f.date().default(() => new Date()),
  },
});

export const user = table.entity({
  attributes: {
    type: f.tag("user"),
    id: f.string().default(() => KSUID.randomSync().string),
    email: f.string(),
    passwordHash: f.binary().optional(),
    name: f.string().optional(),
    organization: f
      .map({ id: f.string(), isAdmin: f.boolean().default(false) })
      .optional(),
    createdAt: f.date().default(() => new Date()),
    updatedAt: f.date().optional(),
  },
});

export const session = table.entity({
  attributes: {
    type: f.tag("session"),
    userId: f.string(),
    token: f.string().default(() => KSUID.randomSync().string),
    createdAt: f.date().default(() => new Date()),
    updatedAt: f.date().optional(),
  },
});
