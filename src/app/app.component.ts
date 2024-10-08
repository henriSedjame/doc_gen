import {Component, computed, HostListener, inject, ViewChild} from '@angular/core';
import {ModelComponent} from './components/model/model.component';
import {AppStore} from './app.store';
import {patchState, signalState} from '@ngrx/signals';
import {NgClass} from '@angular/common';
import {InputComponent} from './components/input/input.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TitleBlocComponent} from './components/title-bloc/title-bloc.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ModelComponent, NgClass, InputComponent, FormsModule, ReactiveFormsModule, TitleBlocComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  @ViewChild('input') input?: HTMLInputElement;

  store = inject(AppStore)

  state = signalState<{ editingValue: string | null; }>({
   editingValue: null,
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

  onInput(value: string) {
    patchState(this.state, {editingValue: value});
  }

  addModel() {
    if (this.inputValid()) {
      this.store.addModel(this.state.editingValue()!);
      patchState(this.state, { editingValue: null });
      this.store.endAddingData()
    }
  }

  addDataset() {
    if (this.inputValid()) {
      this.store.addDataset(this.state.editingValue()!);
      patchState(this.state, { editingValue: null });
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
    patchState(this.state, { editingValue: null });
    this.store.endAddingData()
  }

  @HostListener('window:beforeunload')
  onWindowUnload() {
    this.store.storeState()
  }

}
