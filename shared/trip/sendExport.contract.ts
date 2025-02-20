export interface ParamsInterface {
  format: {
    tz: string;
  };
  query: {
    date: {
      start: Date;
      end: Date;
    };
    territory_authorized_operator_id?: number[]; // territory id for operator visibility filtering
    operator_id?: number[];
    territory_id?: number[];
  };
  type?: string;
  from: {
    type?: string;
    email: string;
    fullname: string;
  };
}
export type ResultInterface = void;

export const handlerConfig = {
  service: 'trip',
  method: 'sendExport',
};

export const signature = `${handlerConfig.service}:${handlerConfig.method}`;
