import { TripStatInterface } from './common/interfaces/TripStatInterface';

export interface ParamsInterface extends TripStatInterface { }

interface CommonStatInterface {
  distance: number;
  carpoolers: number;
  trip: number;
  average_carpoolers_by_car: number;
  trip_subsidized: number;
  operators: number;
  incentive_sum: number;
  financial_incentive_sum: number;
}
interface StatByMonthInterface extends CommonStatInterface {
  month: number;
}
interface StatByDayInterface extends CommonStatInterface {
  day: Date;
}

export type SingleResultInterface = StatByDayInterface | StatByMonthInterface;

export type ResultInterface = SingleResultInterface[];

export const handlerConfig = {
  service: 'trip',
  method: 'stats',
};

export const signature = `${handlerConfig.service}:${handlerConfig.method}`;
