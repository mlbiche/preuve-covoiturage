/**
 * Test journey status
 *
 * Create an application to mock an operator.
 * 1. Check a 'pending' journey written manually in
 * 2. Check wrong permissions
 * 3. Check wrong journey_id
 * 4. Check wrong operator_id
 */

import { get } from 'lodash';
import supertest from 'supertest';
import anyTest, { TestFn } from 'ava';

import { KernelInterface, TransportInterface } from '@ilos/common';
import { CryptoProvider } from '@pdc/provider-crypto';
import { TokenProvider } from '@pdc/provider-token';
import { dbBeforeMacro, dbAfterMacro, DbContextInterface, uuid, getDbMacroConfig } from '@pdc/helper-test';
import { Kernel } from '../Kernel';

import { HttpTransport } from '../HttpTransport';
import { MockJWTConfigProvider } from './mocks/MockJWTConfigProvider';
import { cookieLoginHelper } from './helpers/cookieLoginHelper';

interface ContextType {
  kernel: KernelInterface;
  app: TransportInterface;
  request: any;
  crypto: CryptoProvider;
  token: TokenProvider;
  applications: number[];
  operators: number[];
  users: number[];
  journeys: number[];
  journey: any;
  operator: any;
  operatorUser: any;
  application: any;
  cookies: string;
  db: DbContextInterface;
}

// create a test to configure the 'after' hook
// this must be done before using the macro to make sure this hook
// runs before the one from the macro
const test = anyTest as TestFn<ContextType>;
const config = getDbMacroConfig();
process.env.APP_POSTGRES_URL = config.tmpConnectionString;

test.before(async (t) => {
  t.context.db = await dbBeforeMacro(config);
  t.context.crypto = new CryptoProvider();
  t.context.token = new TokenProvider(new MockJWTConfigProvider());
  await t.context.token.init();

  t.context.kernel = new Kernel();
  t.context.app = new HttpTransport(t.context.kernel);

  // see @pdc/helper-test README.md
  t.context.application = {
    _id: 1,
    uuid: '1efacd36-a85b-47b2-99df-cabbf74202b3',
    owner_id: 1,
    owner_service: 'operator',
    // import permissions
    permissions: ['journey.create', 'certificate.create', 'certificate.download'],
  };

  await t.context.kernel.bootstrap();
  await t.context.app.up(['0']);
  t.context.request = supertest(t.context.app.getInstance());
});

test.after.always(async (t) => {
  await t.context.app.down();
  await t.context.kernel.shutdown();
  await dbAfterMacro(t.context.db);
});

test.beforeEach(async (t) => {
  // login with the operator admin
  t.context.cookies = await cookieLoginHelper(t.context.request, 'maxicovoit.admin@example.com', 'admin1234');
});

test.skip("Status: check 'pending' journey", async (t) => {
  const journey_id = uuid();

  // manually create a journey in database
  const res = await t.context.db.tmpConnection.getClient().query({
    text: `
    INSERT INTO acquisition.acquisitions
    (application_id, operator_id, journey_id, payload)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `,
    values: [1, 1, journey_id, '{}'],
  });

  // check the status
  const response = await t.context.request
    .get(`/v2/journeys/${journey_id}`)
    .set('Accept', 'application/json')
    .set('Content-type', 'application/json')
    .set(
      'Authorization',
      `Bearer ${await t.context.token.sign({
        a: t.context.application.uuid,
        o: 1,
        s: 'operator',
        p: ['journey.create', 'certificate.create', 'certificate.download'],
        v: 2,
      })}`,
    );
  t.is(response.status, 200);
  t.deepEqual(get(response, 'body.result.data'), {
    status: 'pending',
    journey_id,
    created_at: res.rows[0].created_at.toISOString(),
  });
});

test.skip('Status: check wrong permissions', async (t) => {
  const journey_id = uuid();

  // check the status
  const response = await t.context.request
    .get(`/v2/journeys/${journey_id}`)
    .set('Accept', 'application/json')
    .set('Content-type', 'application/json')
    .set(
      'Authorization',
      `Bearer ${await t.context.token.sign({
        a: t.context.application.uuid,
        o: 1,
        s: 'operator',
        p: ['wrong.permission'],
        v: 2,
      })}`,
    );
  t.log(response.body);
  t.is(response.status, 403);

  // FIX ME with RPC error code
  t.deepEqual(get(response, 'body.error', {}), {
    code: 403,
    data: 'Error',
    message: 'Forbidden Error',
  });
});

test.skip('Status: check wrong journey_id', async (t) => {
  const journey_id = uuid();

  // manually create a journey in database
  await t.context.db.tmpConnection.getClient().query({
    text: `
    INSERT INTO acquisition.acquisitions
    (application_id, operator_id, journey_id, payload)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `,
    values: [1, 1, journey_id, '{}'],
  });

  // check the status
  const response = await t.context.request
    .get(`/v2/journeys/${journey_id}-wrong`)
    .set('Accept', 'application/json')
    .set('Content-type', 'application/json')
    .set(
      'Authorization',
      `Bearer ${await t.context.token.sign({
        a: t.context.application.uuid,
        o: 1,
        s: 'operator',
        p: ['journey.create', 'certificate.create', 'certificate.download'],
        v: 2,
      })}`,
    );
  t.is(response.status, 404);
  t.deepEqual(get(response, 'body.error', {}), {
    code: -32504,
    message: 'Not found',
  });
});

test.skip('Status: check wrong operator_id', async (t) => {
  const journey_id = `test-${Math.random()}`;

  // manually create a journey in database
  await t.context.db.tmpConnection.getClient().query({
    text: `
    INSERT INTO acquisition.acquisitions
    (application_id, operator_id, journey_id, payload)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `,
    values: [1, 1000, journey_id, '{}'],
  });

  // check the status
  const response = await t.context.request
    .get(`/v2/journeys/${journey_id}`)
    .set('Accept', 'application/json')
    .set('Content-type', 'application/json')
    .set(
      'Authorization',
      `Bearer ${await t.context.token.sign({
        a: t.context.application.uuid,
        o: 1,
        s: 'operator',
        p: ['journey.create', 'certificate.create', 'certificate.download'],
        v: 2,
      })}`,
    );
  t.is(response.status, 404);
  t.deepEqual(get(response, 'body.error', {}), {
    code: -32504,
    message: 'Not found',
  });
});
