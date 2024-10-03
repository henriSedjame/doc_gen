import {Component, computed, input, output} from '@angular/core';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [
    NgClass
  ],
  templateUrl: './input.component.html',
  styleUrl: './input.component.css'
})
export class InputComponent {

  onInput = output<string>()
  send =  output<void>()
  cancel =  output<void>()
  valid = input.required<boolean>()
  placeholder = input.required<string>()

  sendBtnClass = computed(() => ({
    disabled: !this.valid(),
  }))

}
