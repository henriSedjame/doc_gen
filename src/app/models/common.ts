import {FieldType} from './Model';

export type Tree = {

}

export type FieldTypeOption = { label: string, value: FieldType, type: 'simple' } | { label: string, value: undefined, type: 'complex' }

export type AddFieldReq = { key: string, type: string | FieldType }
