import {Component, computed, HostListener, inject, ViewChild} from '@angular/core';
import {ModelComponent} from './components/model/model.component';
import {AppStore, FieldMapping} from './app.store';
import {patchState, signalState} from '@ngrx/signals';
import {NgClass} from '@angular/common';
import {InputComponent} from './components/input/input.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TitleBlocComponent} from './components/title-bloc/title-bloc.component';
import {FieldMappingComponent} from './components/field-mapping/field-mapping.component';

type Section = 'models' | 'datasets' | 'mappings'

type State = {
  editingValue: string | null;
  collapsed: Section[],
  selectedModelMapping: string | null
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ModelComponent, NgClass, InputComponent, FormsModule, ReactiveFormsModule, TitleBlocComponent, FieldMappingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  @ViewChild('input') input?: HTMLInputElement;

  @ViewChild('select') select?: HTMLSelectElement;

  store = inject(AppStore)

  state = signalState<State>({
    editingValue: null,
    collapsed: ['datasets'],
    selectedModelMapping: null
  })

  inputValid = computed(() => (this.state.editingValue()?.length ?? 0) >= 3)

  placeholder = computed(() => {
    switch (this.store.addDataType()) {
      case 'model':
        return 'Enter model name'
      case 'dataset':
        return 'Enter dataset name'
      default:
        return ''
    }
  })

  formClass = computed(() => ({
    visible: this.store.addDataType()
  }))

  datasetCollapsed = computed(() => this.state.collapsed().includes('datasets'))

  modelsCollapsed = computed(() => this.state.collapsed().includes('models'))

  mappingsCollapsed = computed(() => this.state.collapsed().includes('mappings'))

  mappings = computed(() => this.store.mappings().filter(m => m.dataset === this.store.selectedDataset()))

  datasetClass = computed(() => ({
    expanded: !this.datasetCollapsed(),
    collapsed: this.datasetCollapsed()
  }))

  modelsClass = computed(() => ({
    expanded: !this.modelsCollapsed(),
    collapsed: this.modelsCollapsed()
  }))

  mappingsClass = computed(() => ({
    expanded: !this.mappingsCollapsed(),
    collapsed: this.mappingsCollapsed()
  }))

  onInput(value: string) {
    patchState(this.state, {editingValue: value});
  }

  addModel() {
    if (this.inputValid()) {
      this.store.addModel(this.state.editingValue()!);
      patchState(this.state, {editingValue: null});
      this.store.endAddingData()
    }
  }

  addDataset() {
    if (this.inputValid()) {
      this.store.addDataset(this.state.editingValue()!);
      patchState(this.state, {editingValue: null});
      this.store.endAddingData()
    }
  }

  addData() {
    switch (this.store.addDataType()) {
      case 'model':
        this.addModel();
        break;
      case 'dataset':
        this.addDataset();
        break;
    }
  }

  endAddingData() {
    patchState(this.state, {editingValue: null});
    this.store.endAddingData()
  }

  collapse(section: Section) {
    patchState(this.state, { collapsed: [ ...this.state.collapsed(), section]})
  }

  expand(section: Section) {
    patchState(this.state, { collapsed: this.state.collapsed().filter(s => s !== section)})
  }

  selectDataset(dataset: string) {
    this.store.selectDataset(dataset)
  }

  transform(mappings: FieldMapping[]) : { model: string, fields: FieldMapping[]}[]{

    let result: {model: string, fields: FieldMapping[]}[] = []

    mappings.forEach(mapping => {
      let model = mapping.fieldName.split('.')[0]
      let existing = result.find(r => r.model === model)
      if (existing) {
        existing.fields.push(mapping)
      } else {
        result.push({model, fields: [mapping]})
      }
    })

    return result
  }

  selectModelMapping(model: string) {
    patchState(this.state, { selectedModelMapping : this.state.selectedModelMapping() === model ? null : model })
  }

  @HostListener('window:beforeunload')
  onWindowUnload() {
    this.store.storeState()
  }


}
