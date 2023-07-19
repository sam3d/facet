import { AttributeValue, DynamoDB } from "@aws-sdk/client-dynamodb";

const client = new DynamoDB({
  region: "eu-west-2",
  credentials: {
    accessKeyId: process.env["AWS_ACCESS_KEY_ID"] ?? "",
    secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"] ?? "",
  },
});

type ReadOnlyPick<T extends Record<string, BaseFacetAttribute<any>>> = {
  [K in keyof T as T[K] extends FacetAttributeWithProps<any, infer P>
    ? P["readOnly"] extends true
      ? K
      : never
    : never]?: UnwrapProps<T[K]> extends FacetMap<infer U>
    ? ReadOnlyPick<U> | true
    : true;
};

type UnwrapProps<T extends BaseFacetAttribute<any>> =
  T extends FacetAttributeWithProps<infer U, any> ? U : T;

type ReadOnlyMask<
  T extends Record<string, BaseFacetAttribute<any>>,
  U extends ReadOnlyPick<T>,
> = {
  [K in keyof U]: U[K];
};

type EntityPrimaryKey<
  T extends Record<string, BaseFacetAttribute<any>>,
  U extends ReadOnlyPick<T> = ReadOnlyPick<T>,
> = {
  needs: U;
  compute: (entity: ReadOnlyMask<T, U>) => { PK: string; SK: string };
};

class Table {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  entity<
    Name extends string,
    T extends Record<string, BaseFacetAttribute<any>>,
  >(opts: {
    name: Name;
    attributes: T;
    primaryKey: EntityPrimaryKey<T>;
  }): Entity<Name, T> {
    return new Entity(opts.name, opts.attributes, this);
  }
}

class Entity<
  Name extends string,
  T extends Record<string, BaseFacetAttribute<any>>,
> {
  private name: Name;
  private attributes: T;
  private table: Table;

  constructor(name: Name, attributes: T, table: Table) {
    this.name = name;
    this.attributes = attributes;
    this.table = table;
  }

  serialize(input: { [K in keyof T]: T[K]["_type"] }): Record<
    string,
    AttributeValue
  > {
    return new FacetMap(this.attributes).serialize(input).M;
  }

  deserialize(av: Record<string, AttributeValue>): {
    [K in keyof T]: T[K]["_type"];
  } {
    return new FacetMap(this.attributes).deserialize({ M: av });
  }
}

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

abstract class BaseFacetAttribute<T> {
  declare _type: T;

  abstract serialize(input: unknown): AttributeValue | undefined;
  abstract deserialize(av: AttributeValue): T;
}

class FacetAttributeWithProps<
  T extends FacetAttribute<any>,
  P extends AttributeProps,
> extends BaseFacetAttribute<
  P["required"] extends true ? T["_type"] : T["_type"] | undefined
> {
  private attribute: T;
  private props: P;

  private defaultValue?: DefaultValue<T["_type"]>;

  constructor(attribute: T, props: P, defaultValue?: DefaultValue<T["_type"]>) {
    super();
    this.attribute = attribute;
    this.props = props;
    this.defaultValue = defaultValue;
  }

  serialize(input: unknown): AttributeValue | undefined {
    if (!this.props.required && input === undefined) return undefined;
    return this.attribute.serialize(input);
  }

  deserialize(av: AttributeValue): T["_type"] | undefined {
    if (!this.props.required && av === undefined) return undefined;
    return this.attribute.deserialize(av);
  }

  optional(): FacetAttributeWithProps<T, UpdateProps<P, { required: false }>> {
    this.props.required = false;
    return this as ReturnType<this["optional"]>;
  }

  readOnly(): FacetAttributeWithProps<T, UpdateProps<P, { readOnly: true }>> {
    this.props.readOnly = true;
    return this as ReturnType<this["readOnly"]>;
  }

  default(
    value: DefaultValue<T["_type"]>,
  ): FacetAttributeWithProps<T, UpdateProps<P, { default: true }>> {
    this.defaultValue = value;
    this.props.default = true;
    return this as ReturnType<this["default"]>;
  }
}

abstract class FacetAttribute<T> extends BaseFacetAttribute<T> {
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

class FacetList<T extends FacetAttribute<any>> extends FacetAttribute<
  T["_type"][]
> {
  private attribute: T;

  constructor(attribute: T) {
    super();
    this.attribute = attribute;
  }

  serialize(input: unknown) {
    if (!Array.isArray(input)) throw new TypeError();
    return { L: input.map((item) => this.attribute.serialize(item)!) };
  }

  deserialize(av: AttributeValue) {
    if (av.L === undefined) throw new TypeError();
    return av.L.map((item) => this.attribute.deserialize(item));
  }
}

class FacetMap<
  T extends Record<string, BaseFacetAttribute<any>>,
> extends FacetAttribute<{
  [K in keyof T]: T[K] extends FacetAttributeWithProps<any, infer P>
    ? P["required"] extends true
      ? T[K]["_type"]
      : T[K]["_type"] | undefined
    : T[K]["_type"];
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

    return deserialized as this["_type"];
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
  list: <T extends FacetAttribute<any>>(attribute: T) =>
    new FacetList(attribute),
  map: <T extends Record<string, BaseFacetAttribute<any>>>(attributes: T) =>
    new FacetMap(attributes),

  // Set types
  stringSet: () => new FacetStringSet(),
  numberSet: () => new FacetNumberSet(),
  binarySet: () => new FacetBinarySet(),
};
