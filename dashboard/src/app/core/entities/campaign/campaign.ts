import { Territory } from '~/core/entities/territory/territory';
import { CampaignStatus } from '~/core/entities/campaign/campaign-status';
import { CampaignInterface } from '~/core/interfaces/campaignInterface';

export class Campaign {
  public _id: string;
  public name: string;
  public description: string;
  public territory?: Territory;
  public start: Date;
  public end: Date;
  public status: CampaignStatus;
  /* tslint:disable:variable-name */
  public max_trips: number;
  public max_amount: number;
  public trips_number?: number;
  public amount_spent?: number;

  constructor(obj: CampaignInterface) {
    this._id = obj._id;
    this.name = obj.name;
    this.description = obj.description;
    this.territory = obj.territory;
    this.start = obj.start;
    this.end = obj.end;
    this.status = obj.status;
    this.max_trips = obj.max_trips;
    this.max_amount = obj.max_amount;
    this.trips_number = obj.trips_number;
    this.amount_spent = obj.amount_spent;
  }
}
