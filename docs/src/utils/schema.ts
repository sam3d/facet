export type Schema = {
  entities: Entity[];
};

type Entity = {
  name: string;
  fields: Field[];
};

type Field = {
  name: string;
  type: string;
};

export function parseSchema(code: string): Schema {
  const schema: Schema = {
    entities: [],
  };
  const tokens = code
    .replace(/{/g, " { ")
    .replace(/}/g, " } ")
    .split(/[\s\n,]/)
    .filter((seg) => seg);

  // Naive implementation of schema lexer

  let blockDepth = 0;
  let entity: Entity | null = null;
  let field: Field | null = null;

  for (const token of tokens) {
    if (token === "{") {
      blockDepth++;
      continue;
    }

    if (token === "}") {
      blockDepth--;

      // Finish parsing entity
      if (entity && blockDepth === 0) {
        schema.entities.push(entity);
        entity = null;
      }

      continue;
    }

    // Begin parsing entity
    if (token === "entity" && !entity) {
      entity = { name: "", fields: [] };
      continue;
    }

    // Parse entity name
    if (entity && !entity.name && token.match(/[a-zA-Z0-9_]/)) {
      entity.name = token;
      continue;
    }

    // Begin parsing entity field
    if (entity && blockDepth === 1 && !field) {
      field = { name: token, type: "" };
      continue;
    }

    // Parse field type
    if (entity && field && !field.type) {
      field.type = token;
      entity.fields.push(field);
      field = null;
      continue;
    }
  }

  return schema;
}

export function stringifySchema(schema: Schema): string {
  let code = "";

  for (const entity of schema.entities) {
    code += `entity ${entity.name} {\n`;

    const fieldNameLength = Math.max(
      ...entity.fields.map((field) => field.name.length)
    );

    for (const field of entity.fields) {
      const padding = " ".repeat(fieldNameLength - field.name.length);
      code += `  ${field.name} ${padding}${field.type}\n`;
    }

    code += "}\n\n";
  }

  return code.trim();
}
