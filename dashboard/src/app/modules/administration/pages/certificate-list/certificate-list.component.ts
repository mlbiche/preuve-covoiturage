import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { DestroyObservable } from '~/core/components/destroy-observable';
import { REGEXP } from '~/core/const/validators.const';
import { ResultRowInterface, RowType } from '~/shared/certificate/common/interfaces/ResultRowInterface';
import { ParamsInterface as ListParamsInterface } from '~/core/entities/api/shared/certificate/list.contract';
import { catchHttpStatus } from '~/core/operators/catchHttpStatus';
import { AuthenticationService } from '~/core/services/authentication/authentication.service';
import { CommonDataService } from '~/core/services/common-data.service';
import { CertificateApiService, CreateParamsInterface } from '../../../certificate/services/certificate-api.service';
import { CertificateMetaDialogComponent } from './certificate-meta-dialog/certificate-meta-dialog.component';

@Component({
  selector: 'app-certificate-list',
  templateUrl: './certificate-list.component.html',
  styleUrls: ['./certificate-list.component.scss'],
})
export class CertificateListComponent extends DestroyObservable implements OnInit {
  public readonly PAGE_SIZE = 25;

  certificateForm: FormGroup;
  filterForm: FormGroup;
  constructor(
    public auth: AuthenticationService,
    protected certificateApi: CertificateApiService,
    protected commonData: CommonDataService,
    protected fb: FormBuilder,
    protected dialog: MatDialog,
    protected snackbar: MatSnackBar,
    protected toastr: ToastrService,
  ) {
    super();
  }
  @ViewChild('paginator', { static: true }) paginator: MatPaginator;

  length = 0;
  startIndex = 0;
  certificates: ResultRowInterface[] = [];
  searchState = new BehaviorSubject<ListParamsInterface>({ pagination: { length: this.PAGE_SIZE, start_index: 0 } });
  isLoading = false;
  showForm = false;

  displayedColumns = [
    'status',
    'uuid',
    'operator',
    'driver_km',
    'driver_eur',
    'passenger_km',
    'passenger_eur',
    'actions',
  ];

  get controls(): { [key: string]: AbstractControl } {
    return this.certificateForm.controls;
  }

  ngOnInit(): void {
    this.startIndex = 0;
    this.length = 0;
    this.auth.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user.operator_id) {
        this.searchState.next({ ...this.searchState.value, operator_id: user.operator_id });
      }
    });

    this.filterForm = this.fb.group({ operator_id: [null, []] });

    this.filterForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((filterState) => {
      const searchStateValue = this.searchState.value;
      if (filterState.operator_id) {
        searchStateValue.operator_id = filterState.operator_id;
      } else {
        delete searchStateValue.operator_id;
      }
      this.searchState.next(searchStateValue);
    });

    this.certificateForm = this.fb.group({
      operator_id: [null, []],
      identity_type: ['phone_number', [Validators.required]],
      start_lat: [null, [Validators.pattern(REGEXP.lat)]],
      start_lng: [null, [Validators.pattern(REGEXP.lon)]],
      end_lat: [null, [Validators.pattern(REGEXP.lat)]],
      end_lng: [null, [Validators.pattern(REGEXP.lon)]],
      phone_number_trunc: [],
      operator_user_id: [],
      phone_number: [],
      identity_uuid: [],
    });

    this.certificateForm.setControl('start_date', new FormControl());
    this.certificateForm.setControl('end_date', new FormControl());

    this.certificateForm
      .get('identity_type')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((val) => this.updateValidation(val));

    this.paginator.page.pipe(takeUntil(this.destroy$)).subscribe((page) => {
      this.searchState.next({
        ...this.searchState.value,
        pagination: {
          start_index: page.pageIndex * page.pageSize,
          length: page.pageSize,
        },
      });

      this.startIndex = page.pageIndex;
      this.updateList();
    });

    this.searchState.pipe(takeUntil(this.destroy$)).subscribe((state) => this.updateList(state));
  }

  updateList(state = this.searchState.value): void {
    this.isLoading = true;

    this.certificateApi
      .getList(state)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((certificates) => {
        this.length = certificates.length;
        this.certificates = certificates.rows;
      });
  }

  updateValidation(identity_type = this.certificateForm.value.identity_type): void {
    ['phone_number_trunc', 'operator_user_id', 'phone_number', 'identity_uuid'].forEach((formName) => {
      const formControl = this.certificateForm.get(formName);
      formControl.setValue(null);
      switch (formName) {
        case 'phone_number':
          formControl.setValidators(
            identity_type === 'phone_number' ? [Validators.required, Validators.pattern(REGEXP.phone)] : [],
          );
          break;
        case 'phone_number_trunc':
          formControl.setValidators(
            identity_type === 'phone_number_trunc' ? [Validators.required, Validators.pattern(REGEXP.phone_trunc)] : [],
          );
          break;
        case 'operator_user_id':
          formControl.setValidators(identity_type === 'phone_number_trunc' ? [Validators.required] : []);
          break;
        case 'identity_uuid':
          formControl.setValidators(identity_type === 'uuid' ? [Validators.required] : []);
          break;
      }

      formControl.updateValueAndValidity();
      formControl.markAsUntouched();
    });
    const operatorControl = this.certificateForm.get('operator_id');
    operatorControl.setValidators(!this.auth.user || !this.auth.user.operator_id ? [Validators.required] : []);
    operatorControl.updateValueAndValidity();
    operatorControl.markAsUntouched();
  }

  showCreationForm(): void {
    this.certificateForm.setValue({
      operator_id: this.auth.user.operator_id ? this.auth.user.operator_id : null,
      identity_type: 'phone_number',
      phone_number_trunc: null,
      operator_user_id: null,
      phone_number: null,
      identity_uuid: null,
      start_lat: null,
      start_lng: null,
      start_date: null,
      end_lat: null,
      end_lng: null,
      end_date: null,
    });
    this.updateValidation();
    this.certificateForm.get('operator_id').markAsUntouched();
    // this.certificateForm.get('territory_id').markAsUntouched();
    this.showForm = true;

    for (const controlName in this.certificateForm.controls)
      if (this.certificateForm.controls.hasOwnProperty(controlName)) {
        this.certificateForm.controls[controlName].markAsUntouched();
      }
  }

  /**
   * Direct download the PDF certificate without meta data.
   */
  async download(row: ResultRowInterface): Promise<void> {
    try {
      await this.certificateApi.downloadPrint({ uuid: row.uuid, operator_id: row.operator._id });
      this.toastr.success('Attestation générée');
    } catch (e) {
      this.toastr.error(e.message);
    }
  }

  /**
   * Open a dialog box to fill the meta and download the PDF
   */
  downloadWithMeta(row: ResultRowInterface): void {
    const modal = this.dialog.open(CertificateMetaDialogComponent, { data: row });
    modal
      .afterClosed()
      .toPromise()
      .then((ok) => {
        if (ok) this.toastr.success('Attestation avec meta-données générée');
      })
      .catch((err) => this.toastr.error(err.message));
  }

  onCreateCertificate(): void {
    const formVal = this.certificateForm.value;
    const certificate: CreateParamsInterface = {
      operator_id: formVal.operator_id,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      positions: [],
      identity:
        formVal.identity_type === 'phone_number'
          ? {
              phone: formVal.phone_number.trim(),
            }
          : formVal.identity_type === 'phone_number_trunc'
          ? {
              phone_trunc: formVal.phone_number_trunc.trim(),
              operator_user_id: formVal.operator_user_id.trim(),
            }
          : {
              uuid: formVal.identity_uuid.trim(),
            },
    };

    // cast and format dates
    if (formVal.start_date) certificate.start_at = (formVal.start_date as Date).toISOString();
    if (formVal.end_date) certificate.end_at = (formVal.end_date as Date).toISOString();

    // add start and end positions
    if (formVal.start_lat || formVal.start_lng) {
      certificate.positions.push({ lat: parseFloat(formVal.start_lat), lon: parseFloat(formVal.start_lng) });
    }

    if (formVal.end_lat || formVal.end_lng) {
      certificate.positions.push({ lat: parseFloat(formVal.end_lat), lon: parseFloat(formVal.end_lng) });
    }

    // clean up if empty
    if (certificate.positions.length === 0) {
      delete certificate.positions;
    }

    // hide any existing snackbar
    this.snackbar.dismiss();

    this.certificateApi
      .create(certificate)
      .pipe(
        catchHttpStatus(400, (err) => {
          this.toastr.error('Erreur de formulaire');
          console.error(err);
          throw err;
        }),
        catchHttpStatus(401, (err) => {
          this.toastr.error('Non connecté');
          throw err;
        }),
        catchHttpStatus(403, (err) => {
          this.toastr.error('Action non autorisée');
          throw err;
        }),
        catchHttpStatus(404, (err) => {
          this.toastr.error('Identité non trouvée');
          throw err;
        }),
        catchHttpStatus(500, (err) => {
          this.toastr.error("Une erreur s'est produite");
          throw err;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((certResponse: { created_at: Date; pdf_url: string; uuid: string }) => {
        this.updateList();
        this.showForm = false;
        const sb = this.snackbar.open('Attestation créé.', 'Télécharger le PDF', {
          duration: 30000,
        });

        sb.onAction().subscribe(() => {
          this.certificateApi.downloadPrint({ uuid: certResponse.uuid });
        });
      });
  }

  onCancelCreateCertificate(): void {
    this.showForm = false;
  }

  // UI helpers
  statusIsOk(row: ResultRowInterface): boolean {
    return row.type === 'ok';
  }

  getIconStatus(status: RowType): string {
    switch (status) {
      case RowType.OK:
        return 'check_circle';
      case RowType.EXPIRED:
        return 'warning';
      default:
        return '';
    }
  }

  getIconClass(status: RowType): string {
    switch (status) {
      case RowType.OK:
        return 'success';
      case RowType.EXPIRED:
        return 'warning';
      default:
        return '';
    }
  }

  getTooltip(status: RowType): string {
    switch (status) {
      case RowType.OK:
        return 'Valide';
      case RowType.EXPIRED:
        return "Expirée. Le format d'attestation en base n'est plus valide.";
      default:
        return null;
    }
  }
}
