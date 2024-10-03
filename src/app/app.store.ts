import {addField, AddFieldModel, FieldType, Model, removeField} from './models/Model';
import {signalStore, withComputed, withMethods, withState} from '@ngrx/signals';
import {updateState, withDevtools} from '@angular-architects/ngrx-toolkit';
import {computed} from '@angular/core';
import {FieldTypeOption} from './models/common';


const STATE_KEY = 'app_state';

export type NamedModel = {
  name: string;
  value: Model;
}
export type IndexedModel = {
  name: string;
  value: {
    [key: string]: string
  }
}

export type AppState = {
  models: NamedModel[];
  indexedModels: IndexedModel[];
  selectedIndex: number | null;
  addingNewModel: boolean;
}

export const initialState: AppState = {
  models: [],
  indexedModels: [],
  selectedIndex: null,
  addingNewModel: false,
}

export const AppStore = signalStore(
  {providedIn: 'root'},
  withDevtools('app-store'),
  withState(() => {
    const storedState = localStorage.getItem(STATE_KEY);
    localStorage.removeItem(STATE_KEY);
    if (storedState) {
      return JSON.parse(storedState) as AppState;
    }
    return initialState
  }),
  withComputed(state => ({
    fieldTypeSimpleOptions: computed<FieldTypeOption[]>(() => {
      return Object.values(FieldType).map(value => ({
        label: value.toLowerCase(),
        value: value,
        type: 'simple'
      })) as FieldTypeOption[]

    }),
    fieldTypeComplexOptions: computed<FieldTypeOption[]>(() => {
      return state.models().map(m => ({
        label: m.name,
        value: undefined,
        type: 'complex'
      })) as FieldTypeOption[]

    }),
    fieldModels: computed(() => {
      const map = new Map<string, NamedModel>();
      state.indexedModels().forEach(xm => {
        Object.keys(xm.value).forEach(key => {
          let k  = `${xm.name}.${key}`;
          let model = state.models().filter(m => m.name === xm.value[key])[0]
          map.set(k, model)
        })
      })
      return map;
    }),
  })),
  withMethods(state => ({

    add: (name: string) => {
      if (state.models().map(m => m?.name?.toLowerCase()).includes(name.toLowerCase())) {
        alert('Model already exists')
      } else if(Object.values(FieldType).map(m => m.toString().toLowerCase()).includes(name.toLowerCase())) {
        alert('Model name cannot be a reserved field type name')
      }else {
        updateState(state, 'add model', {
          models: [
            ...state.models(),
            {
              name: name,
              value: {}
            }
          ],
          indexedModels: [
            ...state.indexedModels(),
            {
              name: name,
              value: {}
            }
          ],
        })
      }
    },

    addField(index: number, field: { key: string, type: string | FieldType }) {
      let model = state.models().filter(m => m.name === field.type)?.[0];
      this._update(index, {
        type: 'add',
        value: { key: field.key, type: model?.value ?? field.type },
        indexedName: model?.name
      })
    },

    removeField(index: number, key: string) {
      this._update(index, {type: 'remove', key: key})
    },

    _update(index: number, field: { type: 'add', value: AddFieldModel, indexedName?: string } | { type: 'remove', key: string}) {

      let models = state.models();
      let indexedModels = state.indexedModels();

      updateState(state, 'update models', {
        models: models.map(model => {
          if (index === models.indexOf(model)) {
            let value = field.type === 'add' ? addField(model.value, field.value) : removeField(model.value, field.key);
            return { name: model.name, value: value};
          }
          return model;
        })
      })

      if (field.type === 'add' && field.indexedName) {
        updateState(state, 'update indexed models', {
          indexedModels: indexedModels.map(model => {
            if (index === indexedModels.indexOf(model)) {
              return {
                name: model.name,
                value: {
                  ...model.value,
                  [field.value.key]: field.indexedName!
                }
              }
            }
            return model;
          })
        })
      } else if(field.type === 'remove') {
        updateState(state, 'update indexed models', {
          indexedModels: indexedModels.map(model => {
            if (index === indexedModels.indexOf(model)) {
              let {[field.key]: _, ...value} = model.value;
              return {
                name: model.name,
                value: value
              }
            }
            return model;
          })
        })
      }

    },

    select(index: number) {
      updateState(state, 'select', { selectedIndex: state.selectedIndex() === index ? null : index });
    },

    delete(index: number) {
      updateState(state, 'delete', {
        models: state.models().filter((_, i) => i !== index),
        indexedModels: state.indexedModels().filter((_, i) => i !== index),
        selectedIndex: state.selectedIndex() === index ? null : state.selectedIndex()
      })
    },

    startAddNewModel() {
      updateState(state, 'startAdd model', {addingNewModel: true})
    },

    endAddNewModel() {
      updateState(state, 'endAdd model', {addingNewModel: false})
    },

    storeState() {

      const object = {};

      Object.keys(state).forEach((key) => {
        // @ts-ignore
        object[key] = state[key]();
      })

      localStorage.setItem(STATE_KEY, JSON.stringify(object));
    }
  }))
)
