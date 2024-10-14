import {Component, Input, output} from '@angular/core';
import {patchState} from "@ngrx/signals";

@Component({
  selector: 'app-add-btn',
  standalone: true,
  imports: [],
  templateUrl: './add-btn.component.html',
  styleUrl: './add-btn.component.css'
})
export class AddBtnComponent {

  onClick = output<void>()

}
