export function campaignThirdStepSetMaxRetribution(maxRetribution: string): void {
  it('sets max retribution', () => {
    // open MAX RETRIBUTION extension
    cy.get('.ParametersForm .ParametersForm-maxRetribution mat-form-field:first-child input').type(maxRetribution);
  });
}

export function campaignThirdStepSetUnit(): void {
  it('sets retribution unit: €', () => {
    cy.get('.ParametersForm .ParametersForm-maxRetribution mat-form-field:nth-child(2)').click();

    // select euros
    cy.get('.mat-select-panel mat-option:first-child').click();

    // focus out of material select
    cy.get('.cdk-overlay-backdrop').click({ force: true });
  });
}

export function campaignThirdStepSetDates(start: string, end: string): void {
  it('sets start & end dates', () => {
    // open extension
    cy.get('.ParametersForm .mat-expansion-panel:nth-child(2) mat-expansion-panel-header').click();

    // open START DATE
    cy.get('.ParametersForm .ParametersForm-date mat-form-field:first-child input').type(start);

    // open END DATE
    cy.get('.ParametersForm .ParametersForm-date mat-form-field:nth-child(2) input').type(end);
  });
}

export function campaignThirdStepSetMaxTrips(maxTrips): void {
  it('sets max trips', () => {
    // open extension
    cy.get('.ParametersForm .mat-expansion-panel:nth-child(3) mat-expansion-panel-header').click();

    cy.get('.ParametersForm .ParametersForm-maxTrips mat-form-field input').type(maxTrips);
  });
}

export function campaignThirdStepClickPreviousStep(): void {
  it('clicks on previous step to go to step 3', () => {
    cy.get('.mat-horizontal-stepper-content:nth-child(3)  .CampaignForm-content-actions button:nth-child(1)').click();
  });
}

export function campaignThirdStepClickNextStep(): void {
  it('clicks on next step to go to step 4', () => {
    cy.get('.mat-horizontal-stepper-content:nth-child(3)  .CampaignForm-content-actions button:nth-child(2)').click();
  });
}

export function campaignThirdStepCheckDisabledNextStep(): void {
  it('check button to go to step 4 is disabled', () => {
    cy.get('.mat-horizontal-stepper-content:nth-child(3)  .CampaignForm-content-actions button:nth-child(2)').should(
      'be.disabled',
    );
  });
}

export function campaignThirdStepSetRestriction(
  amount: number,
  whatIndex: number,
  targetIndex: number,
  periodIndex: number,
): void {
  it('set new restriction', () => {
    // click add new
    cy.get('.ParametersForm .mat-expansion-panel:nth-child(4) .CampaignSubForm-inputs > button').click();
    cy.wait(500);

    // set amount
    cy.get(`.RestrictionForm-howMuch input`).type(amount.toString());

    // set what
    cy.get(`.RestrictionForm-what`).click();
    cy.get(`.mat-select-panel .mat-option:nth-child(${whatIndex})`).click();

    // select passenger
    cy.get(`.RestrictionForm-who`).click();
    cy.get(`.mat-select-panel .mat-option:nth-child(${targetIndex})`).click();

    cy.wait(300); // to avoid select multiple bug

    // select period
    cy.get(`.RestrictionForm-period`).click();
    cy.get(`.mat-select-panel .mat-option:nth-child(${periodIndex})`).click();
    cy.get(`.ParametersForm .ConfirmBtn`).click();
    cy.wait(200);
  });
}
