export type Schema = {
  entities: Entity[];
};

export type Entity = {
  name: string;
};

export function parseSchema(schema: string): Schema {
  return {
    entities: [],
  };
}

export function stringifySchema(schema: Schema): string {
  return "";
}
