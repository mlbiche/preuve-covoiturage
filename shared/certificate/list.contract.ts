import { ResultRowInterface } from './common/interfaces/ResultRowInterface';

export interface Pagination {
  start_index: number;
  length: number;
}

export interface ParamsInterface {
  operator_id?: number;
  pagination?: Pagination;
}

export type ResultInterface = {
  rows: ResultRowInterface[];
  length: number;
};

export type RepositoryInterface = ParamsInterface;

export const handlerConfig = {
  service: 'certificate',
  method: 'list',
};

export const signature = `${handlerConfig.service}:${handlerConfig.method}`;
