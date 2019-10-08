import { Action as AbstractAction } from '@ilos/core';
import { handler, ConfigInterfaceResolver } from '@ilos/common';
import { ListUserParamsInterface } from '@pdc/provider-schema';

import { UserRepositoryProviderInterfaceResolver } from '../interfaces/UserRepositoryProviderInterface';
import { UserListResponseInterface } from '../interfaces/UserListResponseInterface';
import { UserContextInterface } from '../interfaces/UserContextInterfaces';

const whiteList = ['_id', 'email', 'lastname', 'firstname', 'group', 'role', 'status', 'operator', 'territory'];

/*
 * list users filtered by territory or operator and paginate with limit & skip
 */
@handler({
  service: 'user',
  method: 'list',
})
export class ListUserAction extends AbstractAction {
  public readonly middlewares: (string | [string, any])[] = [
    ['validate', 'user.list'],
    [
      'scopeIt',
      [
        ['user.list'],
        [
          (_params, context) => {
            if (context.call.user.territory) {
              return 'territory.users.list';
            }
          },
          (_params, context) => {
            if (context.call.user.operator) {
              return 'operator.users.list';
            }
          },
        ],
      ],
    ],
    ['content.whitelist', [...whiteList.map((key: string) => `data.*.${key}`), 'meta.*']],
  ];

  constructor(
    private userRepository: UserRepositoryProviderInterfaceResolver,
    private config: ConfigInterfaceResolver,
  ) {
    super();
  }

  public async handle(
    params: ListUserParamsInterface,
    context: UserContextInterface,
  ): Promise<UserListResponseInterface> {
    const contextParam: { territory?: string; operator?: string } = {};

    if (context.call.user.territory) {
      contextParam.territory = context.call.user.territory;
    }

    if (context.call.user.operator) {
      contextParam.operator = context.call.user.operator;
    }

    // Pagination
    const page = 'page' in params ? this.castPage(params.page) : this.config.get('pagination.defaultPage');
    const limit = 'limit' in params ? this.castPage(params.limit) : this.config.get('pagination.defaultLimit');
    const pagination = this.paginate({ limit, page });

    const data = await this.userRepository.list(contextParam, pagination);

    return {
      data: data.users,
      meta: {
        pagination: {
          total: data.total,
          count: data.users.length,
          per_page: this.config.get('pagination.per_page'), // not used in front
          current_page: Math.floor((pagination.skip || 0) / pagination.limit) + 1,
          total_pages: Math.floor(data.total / pagination.limit),
        },
      },
    };
  }

  private castPage(page: number): number {
    return page || this.config.get('pagination.defaultPage');
  }

  private castLimit(limit: number): number {
    const lim = limit || this.config.get('pagination.defaultLimit');
    return lim > this.config.get('pagination.maxLimit') ? this.config.get('pagination.maxLimit') : lim;
  }

  private paginate(query: { limit: number; page: number }): { skip: number; limit: number } {
    const limit = this.castLimit(query.limit);
    const skip = (this.castPage(query.page) - 1) * limit;
    return { skip, limit };
  }
}
