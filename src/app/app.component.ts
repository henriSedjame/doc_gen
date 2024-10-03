import {Component, computed, HostListener, inject} from '@angular/core';
import {ModelComponent} from './components/model/model.component';
import {AppStore} from './app.store';
import {patchState, signalState} from '@ngrx/signals';
import {NgClass} from '@angular/common';
import {InputComponent} from './components/input/input.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ModelComponent, NgClass, InputComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  store = inject(AppStore)

  state = signalState<{
    editingValue: string | null;
  }>({
   editingValue: null,
  })

  inputValid = computed(() => (this.state.editingValue()?.length ?? 0) >= 3)



  onInput(value: string) {
    patchState(this.state, {editingValue: value});
  }

  addModel() {
    if (this.inputValid()) {
      this.store.add(this.state.editingValue()!);
      patchState(this.state, { editingValue: null });
      this.store.endAddNewModel()
    }
  }

  @HostListener('window:beforeunload')
  onWindowUnload() {
    this.store.storeState()
  }

}
