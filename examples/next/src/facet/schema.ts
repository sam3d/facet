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
    organizationId: f.string(),
    isAdmin: f.boolean().default(false),
    name: f.string().optional(),
    passwordHash: f.binary().optional(),
    createdAt: f.date().default(new Date()),
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
  },
});
