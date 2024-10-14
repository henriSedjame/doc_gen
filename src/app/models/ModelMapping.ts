import {FieldType, Model} from "./Model";
import {Tree} from "./common";


export type ModelMapping<T extends Model> = {
    [K in keyof T]: FieldMapping<T[K]['type']>;
}

export type FieldMapping<T extends Model | FieldType> = {
    [K in keyof T]: T extends Model ? FieldMapping<T[K]['type']> : SingleFieldMapping;
}

export type SingleFieldMapping = {
    origin : FieldMappingOrigin,
    result: string
}

export type FieldMappingOrigin = {
    type: MappingOriginType,
    data: MappingOriginData
}

export type MappingOriginType = 'client-request' | 'cache'  | Api

export type Api = {
    name: string,
    version?: string,
}

export type MappingOriginData = '$' | {
    root: '$',
    tree: Tree
}

