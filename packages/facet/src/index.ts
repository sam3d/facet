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

  entity<T extends Record<string, FacetAttribute | FacetAttributeValue>>(opts: {
    attributes: T;
  }): Entity<T> {
    return new Entity(opts.attributes, { name: this.name });
  }
}

class Entity<T extends Record<string, FacetAttribute | FacetAttributeValue>> {
  private attributes: T;
  private tableName: string;

  constructor(attributes: T, table: { name: string }) {
    this.attributes = attributes;
    this.tableName = table.name;
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

class FacetAttribute<
  T extends FacetAttributeValue = any,
  U extends AttributeProps = any,
> {
  private value: T;
  private props: U;
  private defaultValue?: DefaultValue<T["_"]["type"]>;

  constructor(value: T, props: U, defaultValue?: DefaultValue<T["_"]["type"]>) {
    this.value = value;
    this.props = props;
    this.defaultValue = defaultValue;
  }

  optional(): FacetAttribute<T, UpdateProps<U, { required: false }>> {
    this.props.required = false;
    return this as ReturnType<this["optional"]>;
  }

  readOnly(): FacetAttribute<T, UpdateProps<U, { readOnly: true }>> {
    this.props.readOnly = true;
    return this as ReturnType<this["readOnly"]>;
  }

  default(
    value: DefaultValue<T["_"]["type"]>,
  ): FacetAttribute<T, UpdateProps<U, { default: true }>> {
    this.defaultValue = value;
    this.props.default = true;
    return this as ReturnType<this["default"]>;
  }
}

abstract class FacetAttributeValue<T = any> {
  declare _: { type: T };

  abstract serialize(input: unknown): AttributeValue;
  abstract deserialize(input: AttributeValue): T;

  optional(): FacetAttribute<
    this,
    { required: false; readOnly: false; default: false }
  > {
    return new FacetAttribute(this, {
      required: false,
      readOnly: false,
      default: false,
    });
  }

  readOnly(): FacetAttribute<
    this,
    { required: true; readOnly: true; default: false }
  > {
    return new FacetAttribute(this, {
      required: true,
      readOnly: true,
      default: false,
    });
  }

  default(
    value: DefaultValue<T>,
  ): FacetAttribute<this, { required: true; readOnly: false; default: true }> {
    return new FacetAttribute(
      this,
      { required: true, readOnly: false, default: true },
      value,
    );
  }
}

class FacetString extends FacetAttributeValue<string> {
  serialize(input: unknown) {
    if (typeof input !== "string") throw new TypeError();
    return { S: input };
  }

  deserialize(av: AttributeValue) {
    if (av.S === undefined) throw new TypeError();
    return av.S;
  }
}

export const f = {
  string: () => new FacetString(),
};
