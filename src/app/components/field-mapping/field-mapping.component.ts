import {Component, inject, input} from '@angular/core';
import {AppStore, FieldMapping, SimpleMapping} from '../../app.store';
import {AddBtnComponent} from '../add-btn/add-btn.component';
import {patchState, signalState} from '@ngrx/signals';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';


type State = {
  editingMapping: boolean
}

@Component({
  selector: 'app-field-mapping',
  standalone: true,
  imports: [
    AddBtnComponent,
    ReactiveFormsModule
  ],
  templateUrl: './field-mapping.component.html',
  styleUrl: './field-mapping.component.css'
})
export class FieldMappingComponent {

  dataset = input.required<string | null>()
  modelName = input.required<string>()
  fieldMapping = input.required<FieldMapping>()

  store = inject(AppStore)

  state = signalState<State>({
    editingMapping: false
  })

  simpleForm = new FormGroup({
    originTree: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
  })

  editMapping() {
    patchState(this.state, {editingMapping: true})
    if (this.fieldMapping().mapping) {
      if ('originTree' in this.fieldMapping().mapping!) {
        this.simpleForm.patchValue(this.fieldMapping().mapping as SimpleMapping)
      } else {
        // handle complex types of mapping
      }
    }
  }

  submit() {
    this.store.updateMapping(this.dataset()!, {
      fieldName: this.fieldMapping().fieldName,
      mapping: this.simpleForm.value as SimpleMapping
    })
    this.cancel()
  }

  cancel() {
    patchState(this.state, {editingMapping: false})
    this.simpleForm.reset()
  }

  isSimpleMapping() {
   if(this.fieldMapping().mapping) {
      return 'originTree' in this.fieldMapping().mapping!!
    } else {
      return false
   }
  }

  simpleMapping() {
    return this.fieldMapping().mapping as SimpleMapping
  }
}
