import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, AbstractControl } from '@angular/forms';

import { INCENTIVE_UNITS_FR, IncentiveUnitEnum } from '~/core/enums/campaign/incentive-unit.enum';
import { DestroyObservable } from '~/core/components/destroy-observable';

@Component({
  selector: 'app-retribution-form',
  templateUrl: './retribution-form.component.html',
  styleUrls: ['./retribution-form.component.scss'],
})
export class RetributionFormComponent extends DestroyObservable implements OnInit {
  @Input() campaignForm: FormGroup;
  @Input() forDriver: boolean;
  @Input() forPassenger: boolean;
  // @Input() forTrip = false;
  @Input() formGroup: FormGroup;
  incentiveUnitFr = INCENTIVE_UNITS_FR;

  get uiStatusControl(): FormControl {
    return this.campaignForm.get('ui_status') as FormControl;
  }

  get campaignFormControls(): { [key: string]: AbstractControl } {
    return this.campaignForm.controls;
  }

  get controls(): { [key: string]: AbstractControl } {
    return this.formGroup.controls;
  }

  get forDriverFormGroup(): FormGroup {
    return this.formGroup.get('for_driver') as FormGroup;
  }

  get forPassengerFormGroup(): FormGroup {
    return this.formGroup.get('for_passenger') as FormGroup;
  }

  get freeControl(): FormControl {
    return this.forPassengerFormGroup.get('free') as FormControl;
  }

  get isEuros(): boolean {
    return this.campaignForm.controls.unit.value === IncentiveUnitEnum.EUR;
  }

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.setValidators();
    this.initOnChange();
  }

  private initOnChange(): void {
    this.uiStatusControl.valueChanges.subscribe(() => {
      this.setValidators();
    });
    this.freeControl.valueChanges.subscribe((change) => {
      this.setValidators();
      // reset for passenger retribution form when free selected;
      if (change === true) {
        this.forPassengerFormGroup.patchValue({
          per_km: false,
          amount: 0,
        });
      }
    });
  }

  private setValidators(): void {
    const validators = [Validators.required, Validators.min(0)];
    const uiStatus = this.uiStatusControl.value;
    const free = this.freeControl.value;
    const validation = {
      driver: !!uiStatus.driver,
      passenger: free ? false : !!uiStatus.passenger,
    };

    validation.driver
      ? this.forDriverFormGroup.get('amount').setValidators(validators)
      : this.forDriverFormGroup.get('amount').clearValidators();

    validation.passenger
      ? this.forPassengerFormGroup.get('amount').setValidators(validators)
      : this.forPassengerFormGroup.get('amount').clearValidators();

    this.forDriverFormGroup.get('amount').updateValueAndValidity();
    this.forPassengerFormGroup.get('amount').updateValueAndValidity();
  }
}
