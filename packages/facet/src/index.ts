import { AttributeValue } from "@aws-sdk/client-dynamodb";

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
  entity: <EntitySchema extends Record<string, FacetAttribute>>(
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

abstract class FacetAttribute<
  TInput = any,
  TOutput extends AttributeValue = AttributeValue,
> {
  _input!: TInput;
  _output!: TOutput;

  abstract serialize(input: unknown): TOutput;
  abstract deserialize(av: TOutput): TInput;
}

class FacetString extends FacetAttribute<string, AttributeValue.SMember> {
  serialize(input: unknown) {
    if (typeof input !== "string") throw new TypeError();
    return { S: input };
  }
  deserialize(av: AttributeValue) {
    if (av.S === undefined) throw new TypeError();
    return av.S;
  }
}

class FacetNumber extends FacetAttribute<number, AttributeValue.NMember> {
  serialize(input: unknown) {
    if (typeof input !== "number") throw new TypeError();
    return { N: input.toString() };
  }
  deserialize(av: AttributeValue) {
    if (av.N === undefined) throw new TypeError();
    return parseFloat(av.N);
  }
}

class FacetMap<T extends Record<string, FacetAttribute>> extends FacetAttribute<
  Record<string, any>,
  AttributeValue.MMember
> {
  private shape: T;

  constructor(shape: T) {
    super();
    this.shape = shape;
  }

  serialize(input: unknown) {
    if (!input || typeof input !== "object") throw new TypeError();

    return {
      M: Object.entries(this.shape).reduce((acc, [key, attr]) => {
        return {
          ...acc,
          [key]: attr.serialize((input as { [key: string]: unknown })[key]),
        };
      }, {}),
    };
  }

  deserialize(av: AttributeValue) {
    if (av.M === undefined) throw new TypeError();

    return Object.entries(this.shape).reduce((acc, [key, attr]) => {
      const subAv = av.M[key];
      if (!subAv) return acc;
      return { ...acc, [key]: attr.deserialize(subAv) };
    }, {});
  }
}

export const f = {
  string: () => new FacetString(),
  number: () => new FacetNumber(),

  map: <T extends Record<string, FacetAttribute>>(shape: T) =>
    new FacetMap(shape),
};

export type CreateEntityInput<T extends Record<string, FacetAttribute>> = {
  [K in keyof T]: T[K] extends FacetMap<infer U>
    ? CreateEntityInput<U>
    : T[K]["_input"];
};
