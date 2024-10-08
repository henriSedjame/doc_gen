import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TitleBlocComponent } from './title-bloc.component';

describe('TitleBlocComponent', () => {
  let component: TitleBlocComponent;
  let fixture: ComponentFixture<TitleBlocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TitleBlocComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TitleBlocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
