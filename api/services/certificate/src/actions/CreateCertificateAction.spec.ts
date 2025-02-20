/* eslint-disable max-len */
import { ConfigInterfaceResolver, ContextType, KernelInterfaceResolver } from '@ilos/common';
import anyTest, { TestFn } from 'ava';
import faker from '@faker-js/faker';
import sinon, { SinonStub } from 'sinon';
import { mapFromCarpools } from '../helpers/mapFromCarpools';
import { CarpoolRepositoryProviderInterfaceResolver } from '../interfaces/CarpoolRepositoryProviderInterface';
import { CertificateRepositoryProviderInterfaceResolver } from '../interfaces/CertificateRepositoryProviderInterface';
import { CarpoolInterface, CarpoolTypeEnum } from '../shared/certificate/common/interfaces/CarpoolInterface';
import { CertificateBaseInterface } from '../shared/certificate/common/interfaces/CertificateBaseInterface';
import { CertificateInterface } from '../shared/certificate/common/interfaces/CertificateInterface';
import { CertificateMetaInterface } from '../shared/certificate/common/interfaces/CertificateMetaInterface';
import { ParamsInterface, ResultInterface } from '../shared/certificate/create.contract';
import { WithHttpStatus } from '../shared/common/handler/WithHttpStatus';
import { CreateCertificateAction } from './CreateCertificateAction';

interface Context {
  // Injected tokens
  fakeKernelInterfaceResolver: KernelInterfaceResolver;
  certificateRepositoryProviderInterface: CertificateRepositoryProviderInterfaceResolver;
  carpoolRepositoryProviderInterfaceResolver: CarpoolRepositoryProviderInterfaceResolver;
  configInterfaceResolver: ConfigInterfaceResolver;

  // Injected tokens method's stubs
  carpoolRepositoryFindStub: SinonStub;
  certificateRepositoryCreateStub: SinonStub<[params: CertificateBaseInterface]>;
  kernelCallStub: SinonStub<[method: string, params: any, context: ContextType]>;
  configGetStub: SinonStub;

  // Constants
  OPERATOR_UUID: string;
  OPERATOR_NAME: string;
  USER_RPC_UUID_LIST: string[];
  CERTIFICATE_UUID: string;

  // Tested token
  createCertificateAction: CreateCertificateAction;
}

const test = anyTest as TestFn<Partial<Context>>;

const carpoolData: CarpoolInterface[] = [
  /* eslint-disable prettier/prettier */
  { type: CarpoolTypeEnum.DRIVER, datetime: new Date('2021-01-01'), trips: 15, km: 100, euros: 10 },
  { type: CarpoolTypeEnum.DRIVER, datetime: new Date('2021-01-08'), trips: 10, km: 100, euros: 10 },
  { type: CarpoolTypeEnum.DRIVER, datetime: new Date('2021-01-09'), trips: 10, km: 100, euros: 10 },
  { type: CarpoolTypeEnum.DRIVER, datetime: new Date('2021-02-01'), trips: 2, km: 10, euros: 1 },
  { type: CarpoolTypeEnum.PASSENGER, datetime: new Date('2021-01-01'), trips: 15, km: 100, euros: 10 },
  { type: CarpoolTypeEnum.PASSENGER, datetime: new Date('2021-01-08'), trips: 10, km: 100, euros: 10 },
  { type: CarpoolTypeEnum.PASSENGER, datetime: new Date('2021-01-09'), trips: 10, km: 100, euros: 10 },
  { type: CarpoolTypeEnum.PASSENGER, datetime: new Date('2021-02-01'), trips: 2, km: 10, euros: 1 },
  /* eslint-enable prettier/prettier */
];

test.beforeEach((t) => {
  const fakeKernelInterfaceResolver = new (class extends KernelInterfaceResolver {})();
  const configInterfaceResolver = new (class extends ConfigInterfaceResolver {})();
  const certificateRepositoryProviderInterface =
    new (class extends CertificateRepositoryProviderInterfaceResolver {})();
  const carpoolRepositoryProviderInterfaceResolver =
    new (class extends CarpoolRepositoryProviderInterfaceResolver {})();
  const createCertificateAction = new CreateCertificateAction(
    fakeKernelInterfaceResolver,
    certificateRepositoryProviderInterface,
    carpoolRepositoryProviderInterfaceResolver,
    configInterfaceResolver,
  );

  // Unchanged stubs results
  const configGetStub = sinon.stub(configInterfaceResolver, 'get');
  configGetStub.returns(6);

  t.context = {
    OPERATOR_UUID: faker.datatype.uuid(),
    USER_RPC_UUID_LIST: [faker.datatype.uuid(), faker.datatype.uuid()],
    CERTIFICATE_UUID: faker.datatype.uuid(),
    OPERATOR_NAME: faker.random.alpha(),
    fakeKernelInterfaceResolver,
    configInterfaceResolver,
    certificateRepositoryProviderInterface,
    carpoolRepositoryProviderInterfaceResolver,
    createCertificateAction,
    configGetStub,
  };
  t.context.certificateRepositoryCreateStub = sinon.stub(t.context.certificateRepositoryProviderInterface, 'create');
  t.context.carpoolRepositoryFindStub = sinon.stub(t.context.carpoolRepositoryProviderInterfaceResolver, 'find');
  t.context.kernelCallStub = sinon.stub(t.context.fakeKernelInterfaceResolver, 'call');

  t.context.kernelCallStub.onCall(0).resolves(t.context.USER_RPC_UUID_LIST);
  t.context.kernelCallStub.onCall(1).resolves({ uuid: t.context.OPERATOR_UUID, name: t.context.OPERATOR_NAME });
});

test.afterEach((t) => {
  t.context.certificateRepositoryCreateStub.restore();
  t.context.carpoolRepositoryFindStub.restore();
  t.context.kernelCallStub.restore();
});

test('CreateCertificateAction: should generate certificate payload', async (t) => {
  // Arrange
  const params: ParamsInterface = stubCertificateCreateAndGetParams(t);
  t.context.carpoolRepositoryFindStub.resolves(carpoolData);

  // Act
  const result: WithHttpStatus<ResultInterface> = await t.context.createCertificateAction.handle(params, null);

  // Assert
  const expected = {
    tz: 'Europe/Paris',
    identity: { uuid: t.context.USER_RPC_UUID_LIST[0] },
    operator: { uuid: t.context.OPERATOR_UUID, name: t.context.OPERATOR_NAME },
    positions: [],
    carpools: carpoolData,
  };

  const expectCreateCertificateParams = getExpectedCertificateParams(expected, t);

  sinon.assert.calledOnceWithExactly(t.context.certificateRepositoryCreateStub, expectCreateCertificateParams);
  sinon.assert.calledOnce(t.context.carpoolRepositoryFindStub);
  sinon.assert.calledTwice(t.context.kernelCallStub);
  t.is(result.meta.httpStatus, 201);
  t.is(result.data.uuid, t.context.CERTIFICATE_UUID);
});

test('CreateCertificateAction: should return empty cert if no trips', async (t) => {
  // Arrange
  const params: ParamsInterface = stubCertificateCreateAndGetParams(t);
  t.context.carpoolRepositoryFindStub.resolves([]);

  // Act
  const result: WithHttpStatus<ResultInterface> = await t.context.createCertificateAction.handle(params, null);

  // Assert
  const expected = {
    tz: 'Europe/Paris',
    identity: { uuid: t.context.USER_RPC_UUID_LIST[0] },
    operator: { uuid: t.context.OPERATOR_UUID, name: t.context.OPERATOR_NAME },
    positions: [],
    carpools: [],
  };

  const expectCreateCertificateParams = getExpectedCertificateParams(expected, t);

  sinon.assert.calledOnceWithExactly(t.context.certificateRepositoryCreateStub, expectCreateCertificateParams);
  sinon.assert.calledOnce(t.context.carpoolRepositoryFindStub);
  sinon.assert.calledTwice(t.context.kernelCallStub);
  t.is(result.meta.httpStatus, 201);
  t.is(result.data.uuid, t.context.CERTIFICATE_UUID);
});

function getExpectedCertificateParams(
  certificateMeta: Partial<CertificateMetaInterface & { carpools: CarpoolInterface[] }>,
  t,
): CertificateBaseInterface {
  const { identity, operator, tz, positions, carpools } = certificateMeta;

  return mapFromCarpools({
    carpools,
    operator: { _id: 4, ...operator },
    person: { uuid: identity.uuid },
    params: {
      tz,
      positions,
      end_at: t.context.certificateRepositoryCreateStub.args[0][0].end_at,
      start_at: t.context.certificateRepositoryCreateStub.args[0][0].start_at,
    },
  });
}

function stubCertificateCreateAndGetParams(t) {
  t.context.certificateRepositoryCreateStub.resolves({
    _id: 1,
    uuid: t.context.CERTIFICATE_UUID,
    identity_uuid: t.context.USER_RPC_UUID_LIST[0],
    operator_id: 4,
    meta: {
      identity: { uuid: t.context.USER_RPC_UUID_LIST[0] },
    },
  } as CertificateInterface);

  const params: ParamsInterface = {
    tz: 'Europe/Paris',
    operator_id: 4,
    identity: {
      phone_trunc: '+33696989598',
      uuid: t.context.USER_RPC_UUID_LIST[0],
    },
  };

  return params;
}
