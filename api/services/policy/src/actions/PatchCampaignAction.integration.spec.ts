import anyTest, { TestFn, ExecutionContext } from 'ava';
import { handlerMacro, KernelTestFn } from '@pdc/helper-test';

import { ServiceProvider } from '../ServiceProvider';
import { handlerConfig, ParamsInterface, ResultInterface } from '../shared/policy/patch.contract';
import { ParamsInterface as CampaignInterface } from '../shared/policy/create.contract';
import { PostgresConnection } from '@ilos/connection-postgres/dist';
import { ContextType } from '@ilos/common';
import { CampaignRepositoryProviderInterfaceResolver } from '../interfaces';

const start = new Date();
start.setMonth(start.getMonth() + 1);

const end = new Date();
end.setMonth(start.getMonth() + 2);

const territory = 1;
const fakeCampaign: CampaignInterface = {
  territory_id: territory,
  name: 'Ma campagne',
  description: 'Incite les covoitureurs',
  start_date: start,
  end_date: end,
  unit: 'euro',
  status: 'draft',
  global_rules: [],
  rules: [
    [
      {
        slug: 'adult_only_filter',
      },
    ],
  ],
};

function mockContext(permissions: string[], territory_id = territory): ContextType {
  return {
    channel: {
      service: 'proxy',
      transport: 'http',
    },
    call: {
      user: {
        permissions,
        territory_id,
      },
    },
  };
}

interface TestContext extends KernelTestFn {
  policy_id: number;
}

const test = anyTest as TestFn<TestContext>;

const { before, after, success } = handlerMacro<ParamsInterface, ResultInterface, Error, TestContext>(
  ServiceProvider,
  handlerConfig,
);

test.before(async (t) => {
  const { kernel } = await before();
  t.context.kernel = kernel;

  const policy = await t.context.kernel
    .get(ServiceProvider)
    .get(CampaignRepositoryProviderInterfaceResolver)
    .create(fakeCampaign);

  t.context.policy_id = policy._id;
});
test.after.always(async (t) => {
  if (t.context.policy_id) {
    t.context.kernel
      .get(ServiceProvider)
      .get(PostgresConnection)
      .getClient()
      .query({
        text: `DELETE FROM policy.policies WHERE _id = $1`,
        values: [t.context.policy_id],
      });
  }
  await after({ kernel: t.context.kernel });
});

test(
  success,
  (t: ExecutionContext<TestContext>) =>
    ({
      _id: t.context.policy_id,
      patch: {
        ...fakeCampaign,
        start_date: fakeCampaign.start_date.toISOString(),
        end_date: fakeCampaign.end_date.toISOString(),
        name: 'Ma nouvelle campagne',
      },
    } as unknown as ParamsInterface),
  (response: ResultInterface, t: ExecutionContext<TestContext>) => {
    t.is(response.name, 'Ma nouvelle campagne');
  },
  mockContext(['territory.policy.patch']),
);
