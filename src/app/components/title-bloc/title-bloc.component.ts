import {Component, input, output} from '@angular/core';

@Component({
  selector: 'app-title-bloc',
  standalone: true,
  imports: [],
  templateUrl: './title-bloc.component.html',
  styleUrl: './title-bloc.component.css'
})
export class TitleBlocComponent {
  title = input.required<string>()
  icon = input.required<string>()
  canAdd = input<boolean>(true)
  add = output<void>()
}
