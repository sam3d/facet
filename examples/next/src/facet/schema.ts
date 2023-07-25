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
  name: "user",

  attributes: {
    id: f.string().default(KSUID.randomSync().string).readOnly(),
    name: f.string().optional(),
    email: f.string().optional(),

    organization: f
      .map({
        id: f.string().readOnly(),
        name: f.string(),
        other: f
          .union([
            f.map({ type: f.string().literal("user"), id: f.string() }),
            f.map({ type: f.string().literal("player"), age: f.number() }),
          ])
          .default(() => ({ type: "user", id: "2" })),
      })
      .readOnly(),

    createdAt: f.date().default(() => new Date()),
  },

  primaryKey: {
    needs: { id: true, organization: { id: true } },
    compute(user) {
      return {
        PK: compose("user", { id: user.id }),
        SK: compose("user"),
      };
    },
  },

  globalSecondaryIndexes: {
    GSI1: {
      needs: { email: true },
      compute(user) {
        if (!user.email) return;

        return {
          PK: compose("user", { email: user.email.toLowerCase() }),
          SK: "test",
        };
      },
    },
  },
});

(async () => {
  const res = await users.create({
    email: "test.user@gmail.com",

    organization: {
      id: "1234",
      name: "Test User",
    },
  });
})();
