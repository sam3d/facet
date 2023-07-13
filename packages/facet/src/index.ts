import {
  AttributeValue,
  DynamoDB,
  PutItemCommandOutput,
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

  entity<T extends Record<string, AnyFacetAttribute>>(opts: {
    attributes: T;
  }): Entity<T> {
    return new Entity(opts.attributes, { name: this.name });
  }
}

class Entity<T extends Record<string, AnyFacetAttribute>> {
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
        if (!attr) throw new TypeError(`Unexpected attribute: ${key}`);
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
      if (!attr) throw new TypeError(`Unexpected attribute: ${key}`);
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

type AttributeConfig = {
  required: boolean;
  readOnly: boolean;
  default: boolean;
};

type UpdateAttributeConfig<
  T extends AttributeConfig,
  U extends Partial<AttributeConfig>,
> = Omit<T, keyof U> & U;

type AnyFacetAttribute = FacetAttribute<any, AttributeValue, AttributeConfig>;

abstract class FacetAttribute<
  TInput,
  TOutput extends AttributeValue,
  TConfig extends AttributeConfig,
> {
  declare _: { input: TInput; output: TOutput; config: TConfig };

  private config: TConfig;

  constructor(config: TConfig) {
    this.config = config;
  }

  abstract serialize(input: unknown): TOutput;
  abstract deserialize(av: AttributeValue): TInput;

  optional(): FacetAttribute<
    TInput,
    TOutput,
    UpdateAttributeConfig<TConfig, { required: false }>
  > {
    this.config.required = false;
    return this as ReturnType<this["optional"]>;
  }

  readOnly(): FacetAttribute<
    TInput,
    TOutput,
    UpdateAttributeConfig<TConfig, { readOnly: true }>
  > {
    this.config.readOnly = true;
    return this as ReturnType<this["readOnly"]>;
  }

  default(): FacetAttribute<
    TInput,
    TOutput,
    UpdateAttributeConfig<TConfig, { default: true }>
  > {
    this.config.default = true;
    return this as ReturnType<this["default"]>;
  }
}

class FacetString extends FacetAttribute<
  string,
  AttributeValue.SMember,
  { required: true; readOnly: false; default: false }
> {
  constructor() {
    super({ required: true, readOnly: false, default: false });
  }

  serialize(input: unknown) {
    if (typeof input !== "string") throw new TypeError();
    return { S: input };
  }

  deserialize(av: AttributeValue) {
    if (av.S === undefined) throw new TypeError();
    return av.S;
  }
}

class FacetNumber extends FacetAttribute<
  number,
  AttributeValue.NMember,
  { required: true; readOnly: false; default: false }
> {
  constructor() {
    super({ required: true, readOnly: false, default: false });
  }

  serialize(input: unknown) {
    if (typeof input !== "number") throw new TypeError();
    return { N: input.toString() };
  }

  deserialize(av: AttributeValue) {
    if (av.N === undefined) throw new TypeError();
    return parseFloat(av.N);
  }
}

class FacetBinary extends FacetAttribute<
  Uint8Array,
  AttributeValue.BMember,
  { required: true; readOnly: false; default: false }
> {
  constructor() {
    super({ required: true, readOnly: false, default: false });
  }

  serialize(input: unknown) {
    if (!(input instanceof Uint8Array)) throw new TypeError();
    return { B: input };
  }

  deserialize(av: AttributeValue) {
    if (av.B === undefined) throw new TypeError();
    return av.B;
  }
}

class FacetBoolean extends FacetAttribute<
  boolean,
  AttributeValue.BOOLMember,
  { required: true; readOnly: false; default: false }
> {
  constructor() {
    super({ required: true, readOnly: false, default: false });
  }

  serialize(input: unknown) {
    if (typeof input !== "boolean") throw new TypeError();
    return { BOOL: input };
  }

  deserialize(av: AttributeValue) {
    if (av.BOOL === undefined) throw new TypeError();
    return av.BOOL;
  }
}

class FacetList<T extends AnyFacetAttribute> extends FacetAttribute<
  T["_"]["input"][],
  AttributeValue.LMember,
  { required: true; readOnly: false; default: false }
> {
  private attribute: T;

  constructor(attribute: T) {
    super({ required: true, readOnly: false, default: false });
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

class FacetMap<
  T extends Record<string, AnyFacetAttribute>,
> extends FacetAttribute<
  { [K in keyof T]: T[K]["_"]["input"] },
  AttributeValue.MMember,
  { required: true; readOnly: false; default: false }
> {
  private attributes: T;

  constructor(attributes: T) {
    super({ required: true, readOnly: false, default: false });
    this.attributes = attributes;
  }

  serialize(input: unknown) {
    if (!input || typeof input !== "object") throw new TypeError();

    const serialized = Object.entries(input).reduce((acc, [key, value]) => {
      const attr = this.attributes[key];
      if (!attr) throw new TypeError(`Unexpected map attribute: ${key}`);
      return { ...acc, [key]: attr.serialize(value) };
    }, {});

    return { M: serialized };
  }

  deserialize(av: AttributeValue) {
    if (av.M === undefined) throw new TypeError();

    const deserialized = Object.entries(av.M).reduce((acc, [key, value]) => {
      const attr = this.attributes[key];
      if (!attr) throw new TypeError(`Unexpected map attribute: ${key}`);
      return { ...acc, [key]: attr.deserialize(value) };
    }, {});

    return deserialized as this["_"]["input"];
  }
}

class FacetStringSet extends FacetAttribute<
  Set<string>,
  AttributeValue.SSMember,
  { required: true; readOnly: false; default: false }
> {
  constructor() {
    super({ required: true, readOnly: false, default: false });
  }

  serialize(input: unknown) {
    if (!(input instanceof Set)) throw new TypeError();

    const values: string[] = [];
    for (const value of input.values()) {
      if (typeof value !== "string") throw new TypeError();
      values.push(value);
    }

    return { SS: values };
  }

  deserialize(av: AttributeValue) {
    if (av.SS === undefined) throw new TypeError();
    return new Set(av.SS);
  }
}

class FacetNumberSet extends FacetAttribute<
  Set<number>,
  AttributeValue.NSMember,
  { required: true; readOnly: false; default: false }
> {
  constructor() {
    super({ required: true, readOnly: false, default: false });
  }

  serialize(input: unknown) {
    if (!(input instanceof Set)) throw new TypeError();

    const values: string[] = [];
    for (const value of input.values()) {
      if (typeof value !== "number") throw new TypeError();
      values.push(value.toString());
    }

    return { NS: values };
  }

  deserialize(av: AttributeValue) {
    if (av.NS === undefined) throw new TypeError();
    return new Set(av.NS.map((item) => parseFloat(item)));
  }
}

class FacetBinarySet extends FacetAttribute<
  Set<Uint8Array>,
  AttributeValue.BSMember,
  { required: true; readOnly: false; default: false }
> {
  constructor() {
    super({ required: true, readOnly: false, default: false });
  }

  serialize(input: unknown) {
    if (!(input instanceof Set)) throw new TypeError();

    const values: Uint8Array[] = [];
    for (const value of input.values()) {
      if (!(value instanceof Uint8Array)) throw new TypeError();
      values.push(value);
    }

    return { BS: values };
  }

  deserialize(av: AttributeValue) {
    if (av.BS === undefined) throw new TypeError();
    return new Set(av.BS);
  }
}

class FacetUnion<T extends AnyFacetAttribute[]> extends FacetAttribute<
  T[number]["_"]["input"],
  T[number]["_"]["output"],
  { required: true; readOnly: false; default: false }
> {
  private attributes: T;

  constructor(attributes: [...T]) {
    super({ required: true, readOnly: false, default: false });
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
  string: () => new FacetString(),
  number: () => new FacetNumber(),
  binary: () => new FacetBinary(),
  boolean: () => new FacetBoolean(),

  // Document types
  list: <T extends AnyFacetAttribute>(attribute: T) => new FacetList(attribute),
  map: <T extends Record<string, AnyFacetAttribute>>(attributes: T) =>
    new FacetMap(attributes),

  // Set types
  stringSet: () => new FacetStringSet(),
  numberSet: () => new FacetNumberSet(),
  binarySet: () => new FacetBinarySet(),

  // Meta types
  union: <T extends AnyFacetAttribute[]>(attributes: [...T]) =>
    new FacetUnion(attributes),
};

type InferInput<T extends Record<string, AnyFacetAttribute>> = {
  [K in keyof T]: T[K] extends FacetMap<infer U>
    ? InferInput<U>
    : T[K]["_"]["config"]["required"] extends true
    ? T[K]["_"]["input"]
    : T[K]["_"]["input"] | undefined;
};
