type EntityOpts<EntitySchema> = {
  schema: EntitySchema;
};

type Entity = {};

type TableOpts = {
  name: string;
};

type Table = {
  entity: <EntitySchema>(opts: EntityOpts<EntitySchema>) => Entity;
};

export function createTable(opts: TableOpts): Table {
  return {
    entity(opts) {
      return {};
    },
  };
}
