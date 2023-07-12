import {
  DynamoDB,
  PutItemCommandOutput,
  type AttributeValue,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDB({
  region: "eu-west-2",
  credentials: {},
});

class Table {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  entity<T extends FacetAttributes>(opts: { schema: T }): Entity<T> {
    return new Entity(opts.schema, { name: this.name });
  }
}

class Entity<T extends FacetAttributes> {
  private schema: T;
  private tableName: string;

  constructor(schema: T, table: { name: string }) {
    this.schema = schema;
    this.tableName = table.name;
  }

  async get(PK: string, SK: string): Promise<CreateEntityInput<T> | null> {
    const res = await client.getItem({
      TableName: this.tableName,
      Key: { PK: { S: PK }, SK: { S: SK } },
    });
    const item = res.Item;
    if (!item) return null;

    const deserialized = Object.entries(this.schema).reduce(
      (acc, [key, attr]) => {
        const av = item[key];
        if (!av) return acc;
        return { ...acc, [key]: attr.deserialize(av) };
      },
      {} as CreateEntityInput<T>,
    );

    return deserialized;
  }

  async create(input: CreateEntityInput<T>): Promise<PutItemCommandOutput> {
    if (!input || typeof input !== "object") throw new TypeError();

    const serialized = Object.entries(this.schema).reduce(
      (acc, [key, attr]) => ({ ...acc, [key]: attr.serialize(input[key]) }),
      {},
    );

    return client.putItem({
      TableName: this.tableName,
      Item: serialized,
    });
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

class FacetBinary extends FacetAttribute<Uint8Array, AttributeValue.BMember> {
  serialize(input: unknown) {
    if (!(input instanceof Uint8Array)) throw new TypeError();
    return { B: input };
  }
  deserialize(av: AttributeValue) {
    if (av.B === undefined) throw new TypeError();
    return av.B;
  }
}

class FacetBoolean extends FacetAttribute<boolean, AttributeValue.BOOLMember> {
  serialize(input: unknown) {
    if (typeof input !== "boolean") throw new TypeError();
    return { BOOL: input };
  }
  deserialize(av: AttributeValue) {
    if (av.BOOL === undefined) throw new TypeError();
    return av.BOOL;
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
  number: () => new FacetNumber(),
  string: () => new FacetString(),
  binary: () => new FacetBinary(),
  boolean: () => new FacetBoolean(),

  map: <T extends FacetAttributes>(shape: T) => new FacetMap(shape),
};

type CreateEntityInput<T extends FacetAttributes> = {
  [K in keyof T]: T[K] extends FacetMap<infer U>
    ? CreateEntityInput<U>
    : T[K]["_"]["input"];
};
