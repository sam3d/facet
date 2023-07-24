import { AttributeValue, DynamoDB } from "@aws-sdk/client-dynamodb";

const client = new DynamoDB({
  region: "eu-west-2",
  credentials: {
    accessKeyId: process.env["AWS_ACCESS_KEY_ID"] ?? "",
    secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"] ?? "",
  },
});

/**
 * A map is the only kind of attribute that can also contain other attributes
 * that are read-only (i.e. a FacetAttributeWithProps). Read-only maps (which
 * cannot be reassigned) are the only type to have interior mutability (i.e.
 * organization ID is immutable, but the name is mutable).
 *
 * For primary key selection, you cannot select a whole read-only map attribute
 * as a dependency. Otherwise, internal mutable properties may change (as
 * above). Instead, maps must be recursed into for another read-only property to
 * select. This is also how read-only properties behave in typescript.
 *
 * // TODO: Consider marking read-only properties in maps using the `readonly`
 * keyword (similar to adding question marks to `undefined`).
 */
type AttributeMask<T extends Record<string, BaseFacetAttribute<any>>> = {
  [K in keyof T]?: UnwrapProps<T[K]> extends FacetMap<infer U>
    ? AttributeMask<U>
    : true;
};

type AttributePick<
  T extends Record<string, BaseFacetAttribute<any>>,
  U extends AttributeMask<T>,
> = AddQuestionMarks<{
  [K in keyof T & keyof U]: U[K] extends object
    ? UnwrapProps<T[K]> extends FacetMap<infer M>
      ? AttributePick<M, U[K]>
      : never
    : T[K]["_output"];
}>;

type UnwrapProps<T extends BaseFacetAttribute<any>> =
  T extends FacetAttributeWithProps<infer U, any> ? U : T;

type EntityPrimaryKey<
  T extends Record<string, BaseFacetAttribute<any>>,
  U extends AttributeMask<T>,
> = {
  needs: U;
  compute: (entity: AttributePick<T, U>) => { PK: string; SK: string };
};

type EntitySecondaryIndex<
  T extends Record<string, BaseFacetAttribute<any>>,
  U extends AttributeMask<T>,
> = {
  needs: U;
  compute: (
    entity: AttributePick<T, U>,
  ) => { PK: string; SK: string } | null | undefined;
};

type RequiredKeys<T extends object> = {
  [K in keyof T]: undefined extends T[K] ? never : K;
}[keyof T];

type AddQuestionMarks<
  T extends object,
  R extends keyof T = RequiredKeys<T>,
> = Pick<Required<T>, R> & Partial<T>;

class Table {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  entity<
    Name extends string,
    T extends Record<string, BaseFacetAttribute<any>>,
    U extends AttributeMask<T>,
    V extends Record<string, AttributeMask<T>>,
  >(opts: {
    name: Name;
    attributes: T;
    primaryKey: EntityPrimaryKey<T, U>;
    globalSecondaryIndexes: { [K in keyof V]: EntitySecondaryIndex<T, V[K]> };
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

  async create(
    input: AddQuestionMarks<{ [K in keyof T]: T[K]["_input"] }>,
  ): Promise<AddQuestionMarks<{ [K in keyof T]: T[K]["_output"] }>> {
    return {} as any;
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

abstract class BaseFacetAttribute<TOutput, TInput = TOutput> {
  declare _input: TInput;
  declare _output: TOutput;

  abstract serialize(input: unknown): AttributeValue | undefined;
  abstract deserialize(av: AttributeValue): TOutput;
}

class FacetAttributeWithProps<
  T extends FacetAttribute<any>,
  P extends AttributeProps,
> extends BaseFacetAttribute<
  T["_output"] | (P["required"] extends false ? undefined : never),
  | T["_input"]
  | (P["required"] extends false ? undefined : never)
  | (P["default"] extends true ? undefined : never)
> {
  private attribute: T;
  private props: P;

  private defaultValue?: DefaultValue<T["_input"]>;

  constructor(
    attribute: T,
    props: P,
    defaultValue?: DefaultValue<T["_input"]>,
  ) {
    super();
    this.attribute = attribute;
    this.props = props;
    this.defaultValue = defaultValue;
  }

  get isOptional() {
    return !this.props.required;
  }

  serialize(input: unknown) {
    if (!this.props.required && input === undefined) return undefined;
    return this.attribute.serialize(input);
  }

  deserialize(av: AttributeValue) {
    return this.attribute.deserialize(av);
  }

  optional(): FacetAttributeWithProps<T, UpdateProps<P, { required: false }>> {
    return new FacetAttributeWithProps(
      this.attribute,
      { ...this.props, required: false },
      this.defaultValue,
    );
  }

  readOnly(): FacetAttributeWithProps<T, UpdateProps<P, { readOnly: true }>> {
    return new FacetAttributeWithProps(
      this.attribute,
      { ...this.props, readOnly: true },
      this.defaultValue,
    );
  }

  default(
    value: DefaultValue<T["_input"]>,
  ): FacetAttributeWithProps<T, UpdateProps<P, { default: true }>> {
    return new FacetAttributeWithProps(
      this.attribute,
      { ...this.props, default: true },
      value,
    );
  }
}

abstract class FacetAttribute<
  TOutput,
  TInput = TOutput,
> extends BaseFacetAttribute<TOutput, TInput> {
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
    value: DefaultValue<TInput>,
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
  T["_output"][],
  T["_input"][]
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
> extends FacetAttribute<
  AddQuestionMarks<{ [K in keyof T]: T[K]["_output"] }>,
  AddQuestionMarks<{ [K in keyof T]: T[K]["_input"] }>
> {
  private attributes: T;

  constructor(attributes: T) {
    super();
    this.attributes = attributes;
  }

  private getRequiredAttributes() {
    const keys = Object.entries(this.attributes).flatMap(([key, attr]) =>
      !(attr instanceof FacetAttributeWithProps) || !attr.isOptional
        ? [key]
        : [],
    );
    return new Set(keys);
  }

  serialize(input: unknown) {
    if (!input || typeof input !== "object") throw new TypeError();

    const requiredAttrs = this.getRequiredAttributes();

    const serialized = Object.entries(input).reduce((acc, [key, value]) => {
      requiredAttrs.delete(key);

      const attr = this.attributes[key];
      if (!attr) throw new TypeError(`Unexpected attribute: ${key}`);

      const serialized = attr.serialize(value);
      if (serialized === undefined) return acc;

      return { ...acc, [key]: serialized };
    }, {});

    if (requiredAttrs.size > 0)
      throw new Error(
        "Missing required attributes: " +
          [...requiredAttrs.values()].join(", "),
      );

    return { M: serialized };
  }

  deserialize(av: AttributeValue) {
    if (av.M === undefined) throw new TypeError();

    const requiredAttrs = this.getRequiredAttributes();

    const deserialized = Object.entries(av.M).reduce((acc, [key, value]) => {
      requiredAttrs.delete(key);

      const attr = this.attributes[key];
      if (!attr) throw new TypeError(`Unexpected attribute: ${key}`);

      const deserialized = attr.deserialize(value);
      if (deserialized === undefined) return acc;

      return { ...acc, [key]: deserialized };
    }, {});

    if (requiredAttrs.size > 0)
      throw new Error(
        "Missing required attributes: " +
          [...requiredAttrs.values()].join(", "),
      );

    return deserialized as this["_output"];
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

class FacetDate extends FacetAttribute<Date> {
  serialize(input: unknown) {
    if (!(input instanceof Date)) throw new TypeError();
    return { S: input.toISOString() };
  }

  deserialize(av: AttributeValue) {
    if (av.S === undefined) throw new TypeError();
    const date = new Date(av.S);
    if (isNaN(date.getTime())) throw new TypeError();
    return date;
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

  // Helper types
  date: () => new FacetDate(),
};
