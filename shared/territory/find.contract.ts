import { TerritoryGroupInterface } from './common/interfaces/TerritoryInterface';

export interface ParamsInterface {
  _id: number;
}

export interface ResultInterface extends TerritoryGroupInterface {}

export const handlerConfig = {
  service: 'territory',
  method: 'find',
};
export const signature = `${handlerConfig.service}:${handlerConfig.method}`;
