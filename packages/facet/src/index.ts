type EntityOpts<EntitySchema> = {
  schema: EntitySchema;
};

type Entity<EntitySchema> = {
  _schema: EntitySchema;
};

type TableOpts = {
  name: string;
};

type Table = {
  entity: <EntitySchema extends Record<string, FacetType<any>>>(
    opts: EntityOpts<EntitySchema>,
  ) => Entity<EntitySchema>;
};

export function createTable(opts: TableOpts): Table {
  return {
    entity(opts) {
      return {
        _schema: opts.schema,
      };
    },
  };
}

abstract class FacetType<Output = any> {}

class FacetNumber extends FacetType<number> {}

class FacetString extends FacetType<string> {}

class FacetBoolean extends FacetType<boolean> {}

class FacetBinary extends FacetType<Uint8Array> {}

class FacetNull extends FacetType<null> {}

export const f = {
  number: () => new FacetNumber(),
  string: () => new FacetString(),
  boolean: () => new FacetBoolean(),
  binary: () => new FacetBinary(),
  null: () => new FacetNull(),
};
