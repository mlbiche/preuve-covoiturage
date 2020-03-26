/// <reference types="Cypress" />
import { campaignFirstStepCustom } from './steps/campaign-create-first-step';
import {
  campaignSecondeStepAddInseeFilter,
  campaignSecondStepAddSecondTimeRange,
  campaignSecondStepClickNextStep,
  campaignSecondStepSelectDays,
  campaignSecondStepSelectOperators,
  campaignSecondStepSelectRange,
  campaignSecondStepSelectRanks,
  campaignSecondStepSelectTargets,
  campaignSecondStepSelectTimeRange,
} from './steps/campaign-create-second-step';
import {
  campaignThirdStepCheckDisabledNextStep,
  campaignThirdStepClickNextStep,
  campaignThirdStepClickPreviousStep,
  campaignThirdStepSetDates,
  campaignThirdStepSetMaxRetribution,
  campaignThirdStepSetMaxTrips,
  campaignThirdStepSetRestriction,
  campaignThirdStepSetUnit,
} from './steps/campaign-create-third-step';
import { CypressExpectedCampaign } from '../../expectedApiPayload/expectedCampaign';
import { closeNotification } from '../notification.cypress';

export function cypress_campaignCreate(e2e = false): void {
  it('clicks on campaign section', () => {
    cy.get('.Header-menu .Header-menu-item:first-child').click();
  });

  it('clicks button to create new campaign', () => {
    cy.get('.CampaignDashboard-trips-header button').click();
    cy.wait(2000);
  });

  // FIRST STEP
  campaignFirstStepCustom();

  // SECOND STEP
  campaignSecondStepSelectDays();

  // add time
  campaignSecondStepSelectTimeRange(
    CypressExpectedCampaign.firstTimeStart.toString(),
    CypressExpectedCampaign.firstTimeEnd.toString(),
  );

  // add second time
  campaignSecondStepAddSecondTimeRange(
    CypressExpectedCampaign.secondTimeStart.toString(),
    CypressExpectedCampaign.secondTimeEnd.toString(),
  );

  campaignSecondStepSelectRange();

  campaignSecondStepSelectRanks();

  campaignSecondeStepAddInseeFilter('blackList');

  campaignSecondStepSelectTargets(true, true);

  campaignSecondStepSelectOperators();

  campaignSecondStepClickNextStep();

  // THIRD STEP
  campaignThirdStepSetMaxRetribution(CypressExpectedCampaign.maxAmount.toString());

  campaignThirdStepSetUnit();

  campaignThirdStepSetDates(
    CypressExpectedCampaign.startMoment.format('DD/MM/YYYY'),
    CypressExpectedCampaign.endMoment.format('DD/MM/YYYY'),
  );

  campaignThirdStepSetMaxTrips(CypressExpectedCampaign.maxTrips.toString());

  campaignThirdStepCheckDisabledNextStep();

  it('open panel', () => {
    cy.get('.ParametersForm .mat-expansion-panel:nth-child(4) mat-expansion-panel-header').click();
  });

  campaignThirdStepSetRestriction(CypressExpectedCampaign.firstRestrictionAmount, 1, 2, 4);
  campaignThirdStepSetRestriction(CypressExpectedCampaign.secondRestrictionAmount, 2, 1, 1);

  it('sets retribution', () => {
    // open retribution extension
    cy.get('.ParametersForm .mat-expansion-panel:nth-child(5)').click();

    // driver amount
    cy.get('.ParametersForm-incentiveMode-value-inputs app-retribution-form:first-child mat-form-field input').type(
      (CypressExpectedCampaign.forDriverAmount / 100).toString(),
    );

    // press 'par km'
    cy.get(
      // eslint-disable-next-line
      '.ParametersForm-incentiveMode-value-inputs app-retribution-form:first-child mat-checkbox:first-of-type .mat-checkbox-layout',
    ).click({ force: true });

    // passenger amount
    cy.get('.ParametersForm-incentiveMode-value-inputs app-retribution-form:nth-child(2) mat-form-field input').type(
      '0.2',
    );
  });

  // click previous step
  campaignThirdStepClickPreviousStep();

  // uncheck passenger
  campaignSecondStepSelectTargets(true, false);

  campaignSecondStepClickNextStep();

  campaignThirdStepClickNextStep();

  // LAST STEP
  it('sets name of form', () => {
    // save screenshot to validate text
    cy.screenshot();

    cy.get('.SummaryForm mat-form-field:first-child input').type(CypressExpectedCampaign.campaignName);
  });

  it('sets description of form', () => {
    cy.get('.SummaryForm mat-form-field:nth-child(2) textarea').type(CypressExpectedCampaign.description);
  });

  it('clicks button to save campaign', () => {
    cy.server();

    cy.get('.SummaryForm .SummaryForm-actions button:nth-of-type(1)').click();

    if (!e2e) {
      cy.wait('@campaignCreate').then((xhr) => {
        const method = xhr.request.body[0].method;

        expect(method).equal('campaign:create');
        const expectedCampaign = CypressExpectedCampaign.get();

        delete expectedCampaign.parent_id;
        delete expectedCampaign._id;
      });
    }
  });

  closeNotification();
}
