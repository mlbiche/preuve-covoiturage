import { provider } from '@ilos/common';

import {
  CampaignInterface,
  IncentiveInterface,
  TripInterface,
} from '../interfaces';
import {
  MetadataProviderInterfaceResolver,
} from './interfaces';

import { ProcessableCampaign } from './ProcessableCampaign';

@provider()
export class PolicyEngine {
  constructor(protected metaRepository: MetadataProviderInterfaceResolver) {}

  public async process(trip: TripInterface, campaign: CampaignInterface): Promise<IncentiveInterface[]> {
    const results: IncentiveInterface[] = [];
    if (
      trip.territories.indexOf(campaign.territory_id) < 0 ||
      trip.datetime > campaign.end_date ||
      trip.datetime < campaign.start_date
    ) {
      return results;
    }

    const pc = new ProcessableCampaign(campaign.global_rules, campaign.rules);

    // get metadata wrapper
    const meta = await this.metaRepository.get(campaign._id);

    for (const person of trip.people) {
      const ctx = { trip, person, meta, result: undefined, stack: [] };
      await pc.apply(ctx);
      results.push({
        policy_id: campaign._id,
        carpool_id: person.carpool_id,
        amount: Math.round(ctx.result),
        result: Math.round(ctx.result),
        datetime: ctx.person.datetime,
        status: 'draft',
        state: 'regular',
        meta: {
          // TODO
        }
        // status
        // detail:
      } as any);
    }

    await this.metaRepository.set(campaign._id, meta);
    return results;
  }
}
