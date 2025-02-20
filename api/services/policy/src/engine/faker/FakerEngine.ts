import random from 'lodash/random';
import { v4 } from 'uuid';

import { DatetimeVariant } from './DatetimeVariant';
import { DistanceVariant } from './DistanceVariant';
import { IdentityVariant } from './IdentityVariant';
import { OperatorClassVariant } from './OperatorClassVariant';
import { SeatVariant } from './SeatVariant';
import { TerritoryVariant } from './TerritoryVariant';

import { AbstractVariant } from './AbstractVariant';
import { PersonInterface } from '../../shared/policy/common/interfaces/PersonInterface';
import { TripInterface } from '../../shared/policy/common/interfaces/TripInterface';
import { CampaignInterface } from '../../shared/policy/common/interfaces/CampaignInterface';

export class FakerEngine {
  constructor(protected readonly variants: AbstractVariant<any>[]) {}

  public static getBasicPerson(carpool_id = 1, is_driver = false): PersonInterface {
    return {
      carpool_id,
      trip_id: v4(),
      is_driver,
      datetime: new Date(),
      identity_uuid: 'no one',
      is_over_18: true,
      has_travel_pass: false,
      operator_id: 1,
      operator_class: 'C',
      seats: 1,
      duration: 600,
      distance: 5000,
      cost: 2,
      start_territory_id: [1],
      end_territory_id: [1],
    };
  }

  public static getBasicTrip(nb: number, trip_id = 0): PersonInterface[] {
    const array = new Array(nb);
    for (let i = 0; i < nb; i++) {
      array[i] = FakerEngine.getBasicPerson(trip_id * 10 + i, i === 0);
    }
    return array;
  }

  public static fromPolicy(policy: CampaignInterface): FakerEngine {
    const variants: AbstractVariant<any>[] = [];
    variants.push(
      new DatetimeVariant({
        start: policy.start_date,
        end: policy.end_date,
      }),
    );
    variants.push(new DistanceVariant([1, 50]));
    variants.push(new IdentityVariant());
    variants.push(new OperatorClassVariant());
    variants.push(new SeatVariant());
    variants.push(
      new TerritoryVariant({
        start: [policy.territory_id],
        end: [policy.territory_id],
      }),
    );
    return new FakerEngine(variants);
  }

  public generate(nb: number): TripInterface[] {
    const trips = new Array(nb);
    for (let i = 0; i < nb; i++) {
      trips[i] = this.generateOne(i);
    }
    return trips;
  }

  public generateOne(trip_id = 0): TripInterface {
    let trip = FakerEngine.getBasicTrip(random(2, 4), trip_id);
    for (const variant of this.variants) {
      trip = variant.generate(trip);
    }
    return new TripInterface(...trip);
  }
}
