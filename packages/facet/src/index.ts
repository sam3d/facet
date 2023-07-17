import { AttributeValue, DynamoDB } from "@aws-sdk/client-dynamodb";

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

  entity<T extends Record<string, BaseFacetAttribute>>(opts: {
    attributes: T;
  }): Entity<T> {
    return new Entity(opts.attributes, this);
  }
}

class Entity<T extends Record<string, BaseFacetAttribute>> {
  private attributes: T;
  private table: Table;

  constructor(attributes: T, table: Table) {
    this.attributes = attributes;
    this.table = table;
  }

  async create(input: InferInput<T>) {}
}

type InferInput<T extends Record<string, BaseFacetAttribute>> = {
  [K in keyof T]: InferInputValue<T[K]>;
};

type InferInputValue<T extends BaseFacetAttribute> =
  T extends FacetAttributeWithProps<infer U, infer P>
    ? ApplyProps<U extends FacetMap<infer M> ? InferInput<M> : U["_type"], P>
    : T extends FacetMap<infer M>
    ? InferInput<M>
    : T["_type"];

type ApplyProps<T, U extends AttributeProps> = U["required"] extends true
  ? T
  : T | undefined;

export function createTable(opts: { name: string }): Table {
  return new Table(opts.name);
}

type DefaultValue<T> = T | (() => T | Promise<T>);

type AttributeProps = {
  required: boolean;
  readOnly: boolean;
  default: boolean;
};

type UpdateProps<
  T extends AttributeProps,
  U extends Partial<AttributeProps>,
> = Omit<T, keyof U> & U;

abstract class BaseFacetAttribute<T = any> {
  declare _type: T;

  abstract serialize(input: unknown): AttributeValue;
  abstract deserialize(av: AttributeValue): T;
}

class FacetAttributeWithProps<
  T extends FacetAttribute,
  U extends AttributeProps,
> extends BaseFacetAttribute<T["_type"]> {
  private attribute: T;
  private props: U;

  private defaultValue?: DefaultValue<T["_type"]>;

  constructor(attribute: T, props: U, defaultValue?: DefaultValue<T["_type"]>) {
    super();
    this.attribute = attribute;
    this.props = props;
    this.defaultValue = defaultValue;
  }

  serialize(input: unknown): AttributeValue {
    return this.attribute.serialize(input);
  }

  deserialize(av: AttributeValue): T["_type"] {
    return this.attribute.deserialize(av);
  }

  optional(): FacetAttributeWithProps<T, UpdateProps<U, { required: false }>> {
    this.props.required = false;
    return this as ReturnType<this["optional"]>;
  }

  readOnly(): FacetAttributeWithProps<T, UpdateProps<U, { readOnly: true }>> {
    this.props.readOnly = true;
    return this as ReturnType<this["readOnly"]>;
  }

  default(
    value: DefaultValue<T["_type"]>,
  ): FacetAttributeWithProps<T, UpdateProps<U, { default: true }>> {
    this.defaultValue = value;
    this.props.default = true;
    return this as ReturnType<this["default"]>;
  }
}

abstract class FacetAttribute<T = any> extends BaseFacetAttribute<T> {
  list(): FacetList<this> {
    return new FacetList(this);
  }

  optional(): FacetAttributeWithProps<
    this,
    { required: false; readOnly: false; default: false }
  > {
    return new FacetAttributeWithProps(this, {
      required: false,
      readOnly: false,
      default: false,
    });
  }

  readOnly(): FacetAttributeWithProps<
    this,
    { required: true; readOnly: true; default: false }
  > {
    return new FacetAttributeWithProps(this, {
      required: true,
      readOnly: true,
      default: false,
    });
  }

  default(
    value: DefaultValue<T>,
  ): FacetAttributeWithProps<
    this,
    { required: true; readOnly: false; default: true }
  > {
    return new FacetAttributeWithProps(
      this,
      {
        required: true,
        readOnly: false,
        default: true,
      },
      value,
    );
  }
}

class FacetString extends FacetAttribute<string> {
  serialize(input: unknown) {
    if (typeof input !== "string") throw new TypeError();
    return { S: input };
  }

  deserialize(av: AttributeValue) {
    if (av.S === undefined) throw new TypeError();
    return av.S;
  }
}

class FacetNumber extends FacetAttribute<number> {
  serialize(input: unknown) {
    if (typeof input !== "number") throw new TypeError();
    return { N: input.toString() };
  }

  deserialize(av: AttributeValue) {
    if (av.N === undefined) throw new TypeError();
    return parseFloat(av.N);
  }
}

class FacetBinary extends FacetAttribute<Uint8Array> {
  serialize(input: unknown) {
    if (!(input instanceof Uint8Array)) throw new TypeError();
    return { B: input };
  }

  deserialize(av: AttributeValue) {
    if (av.B === undefined) throw new TypeError();
    return av.B;
  }
}

class FacetBoolean extends FacetAttribute<boolean> {
  serialize(input: unknown) {
    if (typeof input !== "boolean") throw new TypeError();
    return { BOOL: input };
  }

  deserialize(av: AttributeValue) {
    if (av.BOOL === undefined) throw new TypeError();
    return av.BOOL;
  }
}

class FacetList<T extends FacetAttribute> extends FacetAttribute<T["_type"][]> {
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

class FacetMap<
  T extends Record<string, BaseFacetAttribute>,
> extends FacetAttribute<{
  [K in keyof T]: T[K]["_type"];
}> {
  private attributes: T;

  constructor(attributes: T) {
    super();
    this.attributes = attributes;
  }

  serialize(input: unknown) {
    if (!input || typeof input !== "object") throw new TypeError();

    const serialized = Object.entries(input).reduce((acc, [key, value]) => {
      const attr = this.attributes[key];
      if (!attr) throw new TypeError(`Unexpected attribute: ${key}`);

      const serialized = attr.serialize(value);
      if (serialized === undefined) return acc;

      return { ...acc, [key]: serialized };
    }, {});

    return { M: serialized };
  }

  deserialize(av: AttributeValue) {
    if (av.M === undefined) throw new TypeError();

    const deserialized = Object.entries(av.M).reduce((acc, [key, value]) => {
      const attr = this.attributes[key];
      if (!attr) throw new TypeError(`Unexpected attribute: ${key}`);

      const deserialized = attr.deserialize(value);
      if (deserialized === undefined) return acc;

      return { ...acc, [key]: deserialized };
    }, {});

    return deserialized as { [K in keyof T]: T[K]["_type"] };
  }
}

class FacetStringSet extends FacetAttribute<Set<string>> {
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

class FacetNumberSet extends FacetAttribute<Set<number>> {
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

class FacetBinarySet extends FacetAttribute<Set<Uint8Array>> {
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

export const f = {
  // Scalar types
  string: () => new FacetString(),
  number: () => new FacetNumber(),
  binary: () => new FacetBinary(),
  boolean: () => new FacetBoolean(),

  // Document types
  list: <T extends FacetAttribute>(attribute: T) => new FacetList(attribute),
  map: <T extends Record<string, BaseFacetAttribute>>(attributes: T) =>
    new FacetMap(attributes),

  // Set types
  stringSet: () => new FacetStringSet(),
  numberSet: () => new FacetNumberSet(),
  binarySet: () => new FacetBinarySet(),
};
