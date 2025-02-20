import { PoolClient } from '@ilos/connection-postgres';

import { IncentiveInterface, IncentiveStatusEnum } from '.';
import { CampaignStateInterface } from './CampaignInterface';

export type IncentiveCreateOptionsType = { connection?: PoolClient | null; release?: boolean };

export interface IncentiveRepositoryProviderInterface {
  updateManyAmount(
    data: { carpool_id: number; policy_id: number; amount: number; status: IncentiveStatusEnum }[],
    status?: IncentiveStatusEnum,
  ): Promise<void>;
  createOrUpdateMany(data: IncentiveInterface[]): Promise<void>;
  disableOnCanceledTrip(): Promise<void>;
  lockAll(before: Date): Promise<void>;
  findDraftIncentive(to: Date, batchSize?: number, from?: Date): AsyncGenerator<IncentiveInterface[], void, void>;
  getCampaignState(policy_id: number): Promise<CampaignStateInterface>;
}

export abstract class IncentiveRepositoryProviderInterfaceResolver implements IncentiveRepositoryProviderInterface {
  abstract updateManyAmount(
    data: { carpool_id: number; policy_id: number; amount: number; status: IncentiveStatusEnum }[],
    status?: IncentiveStatusEnum,
  ): Promise<void>;
  abstract createOrUpdateMany(data: IncentiveInterface[]): Promise<void>;
  abstract disableOnCanceledTrip(): Promise<void>;
  abstract lockAll(before: Date): Promise<void>;
  abstract findDraftIncentive(
    to: Date,
    batchSize?: number,
    from?: Date,
  ): AsyncGenerator<IncentiveInterface[], void, void>;
  abstract getCampaignState(policy_id: number): Promise<CampaignStateInterface>;
}
