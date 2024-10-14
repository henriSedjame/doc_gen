export enum FieldType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  ZONED_DATETIME = 'ZONED_DATETIME',
}


export type Model = {
  [key: string]: {
    description: string,
    type: Model | FieldType
  };
}

export type ModelFieldType = Model | FieldType

export type AddFieldModel = {
  key: string,
  type: ModelFieldType,
  description: string
}

export function addField(model: Model, field: AddFieldModel): Model {
  return {
    ...model,
    [field.key]: {
      description: field.description,
      type: field.type
    }
  }
}

export function removeField(model: Model, key: string): Model {
  let {[key]: _, ...rest} = model;
  return rest;
}
