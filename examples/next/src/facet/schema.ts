import { createTable } from "facet";

const table = createTable({
  name: "Facet",
});

export const organizations = table.entity({
  schema: {},
});

export const users = table.entity({
  schema: {},
});

export const projects = table.entity({
  schema: {},
});

export const organizationsCollection = table.collection({
  entities: { organizations, users, projects },
  mappings: {
    organizations: null,
    users: null,
    projects: null,
  },
});
