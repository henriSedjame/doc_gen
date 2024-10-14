import {Component, computed, inject, input, output} from '@angular/core';
import {NgClass, NgStyle} from '@angular/common';
import {AppStore, NamedModel} from '../../app.store';
import {patchState, signalState} from '@ngrx/signals';
import {InputComponent} from '../input/input.component';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AddFieldReq, UpdateFieldReq} from '../../models/common';
import {FieldType, Model} from '../../models/Model';
import {AddBtnComponent} from '../add-btn/add-btn.component';
import {updateState} from '@angular-architects/ngrx-toolkit';

type State = {
  addingField: boolean,
  fieldExpanded: string | null,
  editingField: AddFieldReq | null,
  updatingFieldKey: string | null
}

const initialState: State = {
  addingField: false,
  fieldExpanded: null,
  editingField: null,
  updatingFieldKey: null
}

@Component({
  selector: 'app-model',
  standalone: true,
  imports: [
    InputComponent,
    NgClass,
    ReactiveFormsModule,
    NgStyle,
    AddBtnComponent
  ],
  templateUrl: './model.component.html',
  styleUrl: './model.component.css'
})
export class ModelComponent {
  index = input.required<number>()
  model = input.required<NamedModel>();
  showOnlyTree = input<boolean>(false)
  delete = output<void>()
  store = inject(AppStore)

  form = new FormGroup({
    key: new FormControl<string>('', Validators.required),
    type: new FormControl<FieldType | string>(FieldType.STRING, Validators.required),
    comment: new FormControl<string>('', Validators.required)
  })

  selected =computed(() => this.store.selectedIndex() === this.index())

  fields = computed(() => {
    return Object.keys(this.model().value).map(key => {
      return {
        key,
        type: this.model().value[key].type,
        description: this.model().value[key].description
      }
    })
  })

  state = signalState<State>(initialState)

  blocClass = computed(() => ({
    treeOnly: this.showOnlyTree(),
    selected: this.selected()
  }))

  select(){
    this.store.select(this.index())
    patchState(this.state, initialState)
  }

  expand(key: string) {
    patchState(this.state, {fieldExpanded: key})
  }

  collapse() {
    patchState(this.state, {fieldExpanded: null})
  }

  startAddingNewField() {
    patchState(this.state, {addingField: true});
  }

  addField() {
    if (this.form.dirty && this.form.valid) {
      this.store.addField(this.index(), this.form.value as AddFieldReq)
      patchState(this.state, { editingField: null})
      this.endAddingNewField()
      this.form.reset()
    }
  }

  removeField(key: string) {
    this.store.removeField(this.index(), key)
  }

  startUpdatingField(field: { key: string, type: FieldType | Model, description: string }) {
    patchState(this.state, { updatingFieldKey: field.key, addingField: true})
    const type = this.isModel(field.type) ? (typeof field.type) : field.type
    this.form.patchValue({
      key: field.key,
      type: type,
      comment: field.description
    })

  }

  updateField() {
    this.store.updateField({
      index: this.index(),
      oldKey: this.state.updatingFieldKey()!,
      newField: this.form.value as AddFieldReq
    })

    patchState(this.state, { updatingFieldKey: null, addingField: false})
    this.form.reset()
  }

  submit() {
    if(this.state.updatingFieldKey()) {
      this.updateField()
    } else {
      this.addField()
    }
  }

  endAddingNewField() {
    patchState(this.state, { addingField: false, editingField: null});
    this.form.reset()
  }

  selectMapping(key: string) {
    this.store.selectFieldMapping(`${this.model().name}.${key}`)
  }

  briefModel(key: string) {
    return this.modelOf(key).name + ' { . . . }'
  }

  isModel(value: FieldType | Model) {
    return typeof value === 'object'
  }

  modelOf(key: string): NamedModel {
    return this.store.fieldModels().get(this.model().name + '.' + key)!
  }
}
