import { WeekDay } from '@angular/common';

import { TripClassEnum } from '~/core/enums/trip/trip-class.enum';
import { TripStatusEnum } from '~/core/enums/trip/trip-status.enum';
import { FilterInterface } from '~/core/interfaces/filter/filterInterface';

export class Filter {
  campaignIds: string[];
  date: {
    start: Date;
    end: Date;
  };
  hour: {
    start: string;
    end: string;
  };
  days: WeekDay[];
  towns: string[];
  distance: {
    min: number;
    max: number;
  };
  ranks: TripClassEnum[];
  status: TripStatusEnum;
  operatorIds: string[];
  territoryIds: string[];
  constructor(
    obj: FilterInterface = {
      campaignIds: [],
      date: {
        start: null,
        end: null,
      },
      hour: {
        start: null,
        end: null,
      },
      days: [],
      towns: [],
      distance: {
        min: null,
        max: null,
      },
      ranks: [],
      status: null,
      operatorIds: [],
      territoryIds: [],
    },
  ) {
    this.campaignIds = obj.campaignIds;
    this.date = obj.date;
    this.hour = obj.hour;
    this.days = obj.days;
    this.towns = obj.towns;
    this.distance = obj.distance;
    this.ranks = obj.ranks;
    this.status = obj.status;
    this.operatorIds = obj.operatorIds;
    this.territoryIds = obj.territoryIds;
  }
}
