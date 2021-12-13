import { Injectable } from '@angular/core';
import { endOfDay, startOfDay } from 'date-fns';
import { cloneDeep } from 'lodash-es';
import { BehaviorSubject, Observable } from 'rxjs';
import { BaseParamsInterface as TripExportParamsInterface } from 'shared/trip/export.contract';
import { LightTrip } from '~/core/entities/trip/trip';
import { FilterInterface } from '~/core/interfaces/filter/filterInterface';
import { GetListStore } from '~/core/services/store/getlist-store';
import { TripApiService } from '~/modules/trip/services/trip-api.service';

@Injectable({
  providedIn: 'root',
})
export class TripStoreService extends GetListStore<LightTrip, LightTrip, TripApiService> {
  // total type is string as it can overflow Number.MAX_SAFE_INTEGER
  protected _total$ = new BehaviorSubject<string>(null);

  constructor(protected tripApi: TripApiService) {
    super(tripApi);
  }

  get loaded(): boolean {
    return this.isLoaded;
  }

  get total$(): Observable<string> {
    return this._total$;
  }

  get total(): string {
    return this._total$.value;
  }

  public exportTrips(filter: TripExportParamsInterface): Observable<any> {
    const params: TripExportParamsInterface = {
      ...filter,
      date: {
        start: startOfDay(filter.date.start),
        end: endOfDay(filter.date.end),
        // end: ((): string => {
        //   const end = moment(filter.date.end);
        //   const endOf = end.endOf('day');
        //   const ago = moment().subtract(5, 'days');
        //   return endOf.toDate().getTime() > ago.toDate().getTime() ? ago.toISOString() : endOf.toISOString();
        // })(),
      },
    };

    return this.rpcGetList.exportTrips(params);
  }

  public load(filter: FilterInterface | {} = {}, refreshCount = true): void {
    const params = cloneDeep(filter);

    if ('date' in filter && filter.date.start) {
      params['date'].start = filter.date.start.toISOString();
    } else {
      const nowMinus1Year = new Date();
      nowMinus1Year.setMonth(nowMinus1Year.getMonth() - 12);
      nowMinus1Year.setHours(0, 0, 0, 0);
      if (!params['date']) params['date'] = {};
      params['date'].start = nowMinus1Year.toISOString();
    }
    if ('date' in filter && filter.date.end) {
      params['date'].end = filter.date.end.toISOString();
    }

    if (refreshCount) {
      // @ts-ignore Not matching TripSearchInterfaceWithPagination for params...
      this.rpcGetList.count(params).subscribe((count) => {
        this._total$.next(count);
      });
    }

    this.filterSubject.next(params);
  }
}
