import {FieldType, Model} from './models/Model';

export function comment<T>(text: string, action: () => T) : T {
  console.log(text);
  return action();
}

export function isSimpleFieldType(type: Model | FieldType) : boolean {

  return typeof type === 'string';
}
