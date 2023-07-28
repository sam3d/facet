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

export const users = table.entity({
  attributes: {
    type: f.string().literal("user").default("user").readOnly(),
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

  primaryKey: {
    needs: { id: true },
    compute: (u) => [compose("user", { id: u.id }), compose("user")],
  },

  globalSecondaryIndexes: {
    GSI1: {
      needs: { email: true },
      compute: (u) => [compose("user", { email: u.email }), compose("user")],
    },

    GSI2: {
      needs: { organization: { id: true, isAdmin: true } },
      compute: ({ organization: org }) =>
        org && [
          compose("org", { id: org.id }),
          compose("user", { isAdmin: org.isAdmin ? "Y" : "N" }),
        ],
    },
  },
});
