import { createFacetClient } from "facet";
import * as schema from "./schema";

const client = createFacetClient({ schema });

(async () => {
  const res = await client.organization.create({
    data: { name: "test" },
  });

  const res2 = await client.$query();
  for (const item of res2) {
    if (item.type === "organization") {
    }
  }
})();
