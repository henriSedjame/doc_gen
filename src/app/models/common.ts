import {FieldType} from './Model';

export type Tree = {

}

export type FieldTypeOption = { label: string, value: FieldType, type: 'simple' } | { label: string, value: undefined, type: 'complex' }

export type AddFieldReq = {
  comment: string,
  key: string,
  type: string | FieldType
}

export type UpdateFieldReq = {
  index: number,
  oldKey: string,
  newField: AddFieldReq
}
