import type { AttributeValue } from "@aws-sdk/client-dynamodb";

class Table {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  entity<T extends FacetAttributes>(opts: { schema: T }): Entity<T> {
    return new Entity(opts.schema);
  }
}

class Entity<T extends FacetAttributes> {
  private schema: T;

  constructor(schema: T) {
    this.schema = schema;
  }
}

export function createTable(opts: { name: string }): Table {
  return new Table(opts.name);
}

type FacetAttributes = Record<string, FacetAttribute>;

abstract class FacetAttribute<
  TInput = any,
  TOutput extends AttributeValue = AttributeValue,
> {
  declare _: { input: TInput; output: TOutput };

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

class FacetMap<T extends FacetAttributes> extends FacetAttribute<
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

  map: <T extends FacetAttributes>(shape: T) => new FacetMap(shape),
};

export type CreateEntityInput<T extends FacetAttributes> = {
  [K in keyof T]: T[K] extends FacetMap<infer U>
    ? CreateEntityInput<U>
    : T[K]["_"]["input"];
};
