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
    attributes: T;
  }): Entity<T> {
    return new Entity(opts.attributes, { name: this.name });
  }
}

class Entity<T extends Record<string, FacetAttribute>> {
  private attributes: T;
  private tableName: string;

  constructor(attributes: T, table: { name: string }) {
    this.attributes = attributes;
    this.tableName = table.name;
  }

  async get(PK: string, SK: string): Promise<InferInput<T> | null> {
    const res = await client.getItem({
      TableName: this.tableName,
      Key: { PK: { S: PK }, SK: { S: SK } },
    });
    if (!res.Item) return null;

    const deserialized = Object.entries(res.Item).reduce(
      (acc, [key, value]) => {
        const attr = this.attributes[key];
        if (!attr) throw new Error(`Unexpected attribute: ${key}`);
        return { ...acc, [key]: attr.deserialize(value) };
      },
      {},
    );

    return deserialized as InferInput<T>;
  }

  async create(input: InferInput<T>): Promise<PutItemCommandOutput> {
    if (!input || typeof input !== "object") throw new TypeError();

    const serialized = Object.entries(input).reduce((acc, [key, value]) => {
      const attr = this.attributes[key];
      if (!attr) throw new Error(`Unexpected attribute: ${key}`);
      return { ...acc, [key]: attr.serialize(value) };
    }, {});

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

class FacetList<T extends FacetAttribute> extends FacetAttribute<
  T["_"]["input"][],
  AttributeValue.LMember
> {
  private attribute: T;

  constructor(attribute: T) {
    super();
    this.attribute = attribute;
  }

  serialize(input: unknown) {
    if (!Array.isArray(input)) throw new TypeError();
    return { L: input.map((item) => this.attribute.serialize(item)) };
  }

  deserialize(av: AttributeValue) {
    if (av.L === undefined) throw new TypeError();
    return av.L.map((item) => this.attribute.deserialize(item));
  }
}

class FacetMap<T extends Record<string, FacetAttribute>> extends FacetAttribute<
  { [K in keyof T]: T[K]["_"]["input"] },
  AttributeValue.MMember
> {
  private attributes: T;

  constructor(attributes: T) {
    super();
    this.attributes = attributes;
  }

  serialize(input: unknown) {
    if (!input || typeof input !== "object") throw new TypeError();

    const serialized = Object.entries(input).reduce((acc, [key, value]) => {
      const attr = this.attributes[key];
      if (!attr) throw new Error(`Unexpected map attribute: ${key}`);
      return { ...acc, [key]: attr.serialize(value) };
    }, {});

    return { M: serialized };
  }

  deserialize(av: AttributeValue) {
    if (av.M === undefined) throw new TypeError();

    const deserialized = Object.entries(av.M).reduce((acc, [key, value]) => {
      const attr = this.attributes[key];
      if (!attr) throw new Error(`Unexpected map attribute: ${key}`);
      return { ...acc, [key]: attr.deserialize(value) };
    }, {});

    return deserialized as this["_"]["input"];
  }
}

class FacetUnion<T extends FacetAttribute[]> extends FacetAttribute<
  T[number]["_"]["input"],
  T[number]["_"]["output"]
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
  // Scalar types
  number: () => new FacetNumber(),
  string: () => new FacetString(),
  binary: () => new FacetBinary(),
  boolean: () => new FacetBoolean(),

  // Document types
  list: <T extends FacetAttribute>(attribute: T) => new FacetList(attribute),
  map: <T extends Record<string, FacetAttribute>>(attributes: T) =>
    new FacetMap(attributes),

  // Meta types
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
  ? { [K in keyof T]: T[K]["_"]["input"] }
  : never;
