import {addField, AddFieldModel, FieldType, Model, removeField} from './models/Model';
import {signalStore, withComputed, withMethods, withState} from '@ngrx/signals';
import {updateState, withDevtools} from '@angular-architects/ngrx-toolkit';
import {computed} from '@angular/core';
import {AddFieldReq, FieldTypeOption, UpdateFieldReq} from './models/common';
import {comment, isSimpleFieldType} from './utils';

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

export type AddDataType = 'dataset' | 'model';

export type SimpleMapping = {
  originTree: string,
  description: string
}

export type ComplexMapping = {
  branches: MappingBranch[]
}

export type MappingBranch = {
  condition: string;
  mapping: SimpleMapping | ComplexMapping;
  otherwise: SimpleMapping | ComplexMapping;
}

export type FieldMapping = {
  fieldName: string;
  mapping: SimpleMapping | ComplexMapping | null;
}

export type DatasetMapping = {
  dataset: string,
  mappings: FieldMapping[]
}

export type AppState = {
  datasets: string[];
  models: NamedModel[];
  mappings: DatasetMapping[];
  indexedModels: IndexedModel[];
  selectedIndex: number | null;
  selectedDataset: string | null;
  selectedFieldMapping: string | null;
  addingNewModel: boolean;
  addDataType: AddDataType | null;
}

export const initialState: AppState = {
  datasets: [],
  models: [],
  mappings: [],
  indexedModels: [],
  selectedIndex: null,
  selectedDataset: null,
  selectedFieldMapping: null,
  addingNewModel: false,
  addDataType: null
}

export const AppStore = signalStore(
  {providedIn: 'root'},
  withDevtools('app-store'),
  withState(() => {
    const storedState = localStorage.getItem(STATE_KEY);
    localStorage.removeItem(STATE_KEY);
    if (storedState) {
      return { ... JSON.parse(storedState),
        selectedDataset: null,
        selectedFieldMapping : null
      } as AppState;
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

    addModel(name: string) {
      if (state.models().map(m => m?.name?.toLowerCase()).includes(name.toLowerCase())) {
        alert('Model already exists')
      } else if(Object.values(FieldType).map(m => m.toString().toLowerCase()).includes(name.toLowerCase())) {
        alert('Model name cannot be a reserved field type name')
      } else {
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

    addField(index: number, field: AddFieldReq) {

      let model = comment('Find model with name equal to field type',
        () => state.models().filter(m => m.name === field.type)?.[0]);

      let type = comment('If a model is found, use the model name as the field type, otherwise use the field type',
        () => model?.value ?? field.type );

      this._update(index, {
        type: 'add',
        value: { key: field.key, type: type, description: field.comment },
        indexedName: model?.name
      })

      comment('If a model is not found, it is a simple field type! So create a empty mapping for the field', () =>{
        if (!model) {
          model = state.models()[index];

          updateState(state, 'update mappings', {
            mappings: state.mappings().map(mapping => {
              return {
                ...mapping,
                mappings: mapping.mappings = [
                  ...mapping.mappings,
                  {fieldName: `${model.name}.${field.key}`, mapping: null}
                ]
              };
            })
          })
        }
      })
    },

    removeField(index: number, key: string) {
      this._update(index, {type: 'remove', key: key})
      comment('Delete all the fields mappings', () => {
        const model = state.models()[index];
        const fieldName = `${model.name}.${key}`;
        updateState(state, 'update mappings', {
          mappings: state.mappings().map(mapping => {
            return {
              ...mapping,
              mappings: mapping.mappings =  mapping.mappings.filter(m => m.fieldName !== fieldName),
            };
          })
        })
      })
    },

    updateField(req: UpdateFieldReq) {
      const {index, oldKey, newField} = req;

      const model = comment('Get the model to update', () => state.models()[index])

      const type = comment('Get the type of the new field', () => {
        return state.models().find(m => m.name === newField.type)?.value ?? (newField.type as FieldType)
      });

      comment('update the models and mappings', () => {
        updateState(state, 'update field', {
          models: state.models().map(m => {
            if (m.name === model.name) {
              let model: Model = {}

              Object.entries(m.value).forEach(([key, value]) => {
                if (key === oldKey) {
                  model[newField.key] = {
                    description: newField.comment,
                    type: type
                  };
                } else {
                  model[key] = value;
                }
              })

              return {
                name: m.name,
                value: model
              }
            }
            return m;
          }),
          mappings: state.mappings().map(mapping => {
            mapping.mappings = mapping.mappings.map(m => {
              if(m.fieldName === `${model.name}.${oldKey}`) {
                m.fieldName = `${model.name}.${newField.key}`
              }
              return m
            })
            return  mapping
          })
        })
      })
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
      const model = comment('Get the model to update', () => state.models()[index])
      updateState(state, 'delete', {
        models: state.models().filter((_, i) => i !== index),
        indexedModels: state.indexedModels().filter((_, i) => i !== index),
        selectedIndex: state.selectedIndex() === index ? null : state.selectedIndex(),
        mappings: state.mappings().map(mapping => {
          return {
            ...mapping,
            mappings: mapping.mappings.filter(m => !m.fieldName.startsWith(`${model.name}.`))
          }
        })
      })
    },

    startAddingData(type: AddDataType) {
      updateState(state, `start adding data : ${type}`, { addDataType: type });
    },

    endAddingData() {
      updateState(state, 'end adding data', { addDataType: null });
    },

    addDataset(name: string) {
      if (state.datasets().includes(name.toLowerCase())) {
        alert('Dataset already exists')
      }else {
        updateState(state, 'add dataset', {
          datasets: [
            ...state.datasets(),
            name.toLowerCase()
          ],
          mappings: [
            ...state.mappings(),
            {
              dataset: name.toLowerCase(),
              mappings: [
                ...state.models().map(model => {
                  return Object.keys(model.value).filter(k => isSimpleFieldType(model.value[k].type)).map(key => {
                    return {fieldName: `${model.name}.${key}`, mapping: null}
                  })
                }).flat(1)
              ]
            }
          ]
        })
      }
    },

    removeDataset(dataset: string) {
      updateState(state, 'remove dataset', {
        datasets: state.datasets().filter(d => d !== dataset),
        mappings: state.mappings().filter(m => m.dataset !== dataset)
      })
    },

    updateMapping(dataset: string, mapping: FieldMapping) {
      const mappings = state.mappings().map(m => {
        if(m.dataset === dataset) {
          m.mappings = m.mappings.map(f => {
            if (f.fieldName === mapping.fieldName) {
              f.mapping = mapping.mapping
            }
            return f;
          })
        }
        return m;
      })

      updateState(state, 'update mapping', { mappings })
    },

    selectDataset(dataset: string) {
      updateState(state, 'select dataset', { selectedDataset : ( dataset === '' || state.selectedDataset() === dataset ) ? null : dataset })
      if (dataset === '') {
        updateState(state, 'clear selected fieldMapping',  { selectedFieldMapping:  null})
      }
    },

    selectFieldMapping(field: string) {
      updateState(state, 'select field mapping',  { selectedFieldMapping : field === state.selectedFieldMapping() ? null : field })
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
