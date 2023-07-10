type EntityOpts<Schema> = {
  schema: Schema;
};

type Entity = {};

type CollectionOpts<Entities, Mappings> = {
  indexName?: string;
  entities: Entities;
  mappings: Mappings;
};

type Collection = {};

type TableOpts = {
  name: string;
};

type Table = {
  entity: <Schema>(opts: EntityOpts<Schema>) => Entity;
  collection: <
    Entities extends Record<string, Entity>,
    Mappings extends Record<keyof Entities, null>,
  >(
    opts: CollectionOpts<Entities, Mappings>,
  ) => Collection;
};

export function createTable(opts: TableOpts): Table {
  return {
    entity(opts) {
      return {};
    },

    collection(opts) {
      return {};
    },
  };
}
