import {
  DynamoDB,
  PutItemCommandOutput,
  type AttributeValue,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDB({
  region: "eu-west-2",
  credentials: {
    accessKeyId: process.env["AWS_ACCESS_KEY_ID"] ?? "",
    secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"] ?? "",
  },
});

class Table {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  entity<T extends Record<string, FacetAttribute>>(opts: {
    schema: T;
  }): Entity<T> {
    return new Entity(opts.schema, { name: this.name });
  }
}

class Entity<T extends Record<string, FacetAttribute>> {
  private schema: T;
  private tableName: string;

  constructor(schema: T, table: { name: string }) {
    this.schema = schema;
    this.tableName = table.name;
  }

  async get(PK: string, SK: string): Promise<InferInput<T> | null> {
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
      {} as InferInput<T>,
    );

    return deserialized;
  }

  async create(input: InferInput<T>): Promise<PutItemCommandOutput> {
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

abstract class FacetAttribute<
  TInput = any,
  TOutput extends AttributeValue = AttributeValue,
> {
  declare _input: TInput;
  declare _output: TOutput;

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

class FacetMap<T extends Record<string, FacetAttribute>> extends FacetAttribute<
  { [K in keyof T]: T[K]["_input"] },
  AttributeValue.MMember
> {
  private attributes: T;

  constructor(attributes: T) {
    super();
    this.attributes = attributes;
  }

  serialize(input: unknown) {
    if (!input || typeof input !== "object") throw new TypeError();

    return {
      M: Object.entries(this.attributes).reduce((acc, [key, attr]) => {
        return {
          ...acc,
          [key]: attr.serialize((input as { [key: string]: unknown })[key]),
        };
      }, {}),
    };
  }

  deserialize(av: AttributeValue) {
    if (av.M === undefined) throw new TypeError();

    return Object.entries(this.attributes).reduce((acc, [key, attr]) => {
      const subAv = av.M[key];
      if (!subAv) return acc;
      return { ...acc, [key]: attr.deserialize(subAv) };
    }, {} as InferInput<T>);
  }
}

class FacetUnion<T extends FacetAttribute[]> extends FacetAttribute<
  T[number]["_input"],
  T[number]["_output"]
> {
  private attributes: T;

  constructor(attributes: [...T]) {
    super();
    this.attributes = attributes;
  }

  serialize(input: unknown) {
    // TODO: Implement
    return {} as any;
  }

  deserialize(av: any) {
    // TODO: Implement
    return {} as any;
  }
}

export const f = {
  number: () => new FacetNumber(),
  string: () => new FacetString(),
  binary: () => new FacetBinary(),
  boolean: () => new FacetBoolean(),

  map: <T extends Record<string, FacetAttribute>>(attributes: T) =>
    new FacetMap(attributes),

  union: <T extends FacetAttribute[]>(attributes: [...T]) =>
    new FacetUnion(attributes),
};

// NOTE: This is a conditional type for now so intellisense expands it, it
// actually doesn't gain any additional benefit over having it just be the
// mapped type definition
type InferInput<T extends Record<string, FacetAttribute>> = T extends Record<
  string,
  FacetAttribute
>
  ? { [K in keyof T]: T[K]["_input"] }
  : never;
