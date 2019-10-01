import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { takeUntil } from 'rxjs/operators';

import { TripService } from '~/modules/trip/services/trip.service';
import { Trip } from '~/core/entities/trip/trip';
import { FilterService } from '~/core/services/filter.service';
import { DestroyObservable } from '~/core/components/destroy-observable';
import { UserGroupEnum } from '~/core/enums/user/user-group.enum';
import { UserService } from '~/modules/user/services/user.service';
import { FilterInterface } from '~/core/interfaces/filter/filterInterface';
import { DEFAULT_TRIP_LIMIT, DEFAULT_TRIP_SKIP, TRIP_SKIP_SCROLL } from '~/core/const/filter.const';
import { AuthenticationService } from '~/core/services/authentication/authentication.service';

@Component({
  selector: 'app-trip-list',
  templateUrl: './trip-list.component.html',
  styleUrls: ['./trip-list.component.scss'],
})
export class TripListComponent extends DestroyObservable implements OnInit {
  isExporting: boolean;
  trips: Trip[] = [];
  skip = DEFAULT_TRIP_SKIP;
  limit = DEFAULT_TRIP_LIMIT;

  constructor(
    public filterService: FilterService,
    public tripService: TripService,
    private toastr: ToastrService,
    private cd: ChangeDetectorRef,
    private authService: AuthenticationService,
  ) {
    super();
  }

  ngOnInit() {
    this.filterService._filter$.pipe(takeUntil(this.destroy$)).subscribe((filter: FilterInterface) => {
      this.loadTrips({
        ...filter,
        skip: this.skip,
        limit: this.limit,
      });
    });
  }

  onScroll() {
    // TODO stop fetching trips when end (count 0) is reached
    this.skip += TRIP_SKIP_SCROLL;
    const filter = {
      ...this.filterService._filter$.value,
      skip: this.skip,
      limit: this.limit,
    };
    this.loadTrips(filter, true);
  }

  exportTrips() {
    this.isExporting = true;
    this.tripService
      .exportTrips()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        () => {
          this.isExporting = false;
        },
        (err) => {
          this.isExporting = false;
          this.toastr.error(err.message);
        },
      );
  }

  private loadTrips(filter: FilterInterface | {} = {}, loadMore = false): void {
    const user = this.authService.user;
    if (this.tripService.loading) {
      return;
    }
    if (user.group === UserGroupEnum.TERRITORY) {
      filter['territory_id'] = [user.territory];
    }
    // TODO: temp, remove when filter operator added
    if ('operator_id' in filter) {
      delete filter.operator_id;
    }
    this.tripService
      .load(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (trips) => {
          this.trips = loadMore ? this.trips.concat(trips) : trips;
        },
        (err) => {
          this.toastr.error(err.message);
        },
      );
  }
}
