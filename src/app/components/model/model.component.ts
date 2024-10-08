import {Component, computed, inject, input, output} from '@angular/core';
import {NgClass, NgStyle} from '@angular/common';
import {AppStore, NamedModel} from '../../app.store';
import {patchState, signalState} from '@ngrx/signals';
import {InputComponent} from '../input/input.component';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AddFieldReq} from '../../models/common';
import {FieldType, Model} from '../../models/Model';

type State = {
  addingField: boolean,
  fieldExpanded: string | null,
  fieldSelected: string | null,
  editingField: AddFieldReq | null
}

const initialState: State = {
  addingField: false,
  fieldExpanded: null,
  fieldSelected: null,
  editingField: null
}
@Component({
  selector: 'app-model',
  standalone: true,
  imports: [
    InputComponent,
    NgClass,
    ReactiveFormsModule,
    NgStyle
  ],
  templateUrl: './model.component.html',
  styleUrl: './model.component.css'
})
export class ModelComponent {
  model = input.required<NamedModel>();
  selected = input<boolean>(false)
  showOnlyTree = input<boolean>(false)
  delete = output<void>()
  select = output<void>()
  addField = output<AddFieldReq>()
  removeField = output<string>()

  store = inject(AppStore)

  form = new FormGroup({
    key: new FormControl<string>('', Validators.required),
    type: new FormControl<FieldType | string>(FieldType.STRING, Validators.required),
  })

  fields = computed(() => {
    return Object.keys(this.model().value).map(key => {
      return {
        key,
        value: this.model().value[key]
      }
    })
  })

  state = signalState<State>(initialState)

  blocClass = computed(() => ({
    treeOnly: this.showOnlyTree(),
    selected: this.selected()
  }))

  doSelect(){
    this.select.emit()
    patchState(this.state, initialState)
  }

  expand(key: string) {
    patchState(this.state, {fieldExpanded: key})
  }

  collapse() {
    patchState(this.state, {fieldExpanded: null})
  }

  selectField(key: string) {
    if(!this.showOnlyTree()) {
      patchState(this.state, {fieldSelected: this.state.fieldSelected() === key ? null : key})
    }
  }

  startAddingNewField() {
    patchState(this.state, {addingField: true});
  }

  endAddingNewField() {
    patchState(this.state, {addingField: false});
    if (this.state.editingField()) {
      this.addField.emit(this.state.editingField()!)
      patchState(this.state, {editingField: null})
    }
  }

  doAddField() {
    if (this.form.dirty && this.form.valid) {
      this.addField.emit(this.form.value as AddFieldReq)
      patchState(this.state, {editingField: null})
      this.endAddingNewField()
      this.form.reset()
    }
  }

  isModel(value: FieldType | Model) {
    return typeof value === 'object'
  }

  modelOf(key: string): NamedModel {
    return this.store.fieldModels().get(this.model().name + '.' + key)!
  }

  briefModel(key: string) {
    return this.modelOf(key).name + ' { . . . }'
  }

  editField(field: { key: string, value: FieldType | Model }) {

    this.form.patchValue(field)

    this.removeField.emit(field.key)

    patchState(this.state, {
      editingField: {
        key: field.key,
        type: this.isModel(field.value) ? this.modelOf(field.key).name : field.value
      },
      addingField: true
    })

  }

}
