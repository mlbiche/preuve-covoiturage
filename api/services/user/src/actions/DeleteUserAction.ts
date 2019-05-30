import { Parents, Container } from '@pdc/core';

import { UserRepositoryProviderInterfaceResolver } from '../interfaces/UserRepositoryProviderInterface';
import { UserDbInterface } from '../interfaces/UserInterfaces';

@Container.handler({
  service: 'user',
  method: 'delete',
})
export class DeleteUserAction extends Parents.Action {
  public readonly middlewares: (string|[string, any])[] = [
    ['validate', 'user.delete'],
    ['scopeIt', [['user.delete'], [
      (params, context) => {
        if ('id' in params && params.id === context.call.user._id) {
          return 'profile.delete';
        }
      },
      (params, context) => {
        if ('aom' in params && params.aom === context.call.user.aom) {
          return 'aom.users.remove';
        }
      },
      (params, context) => {
        if ('operator' in params && params.operator === context.call.user.operator) {
          return 'operator.users.remove';
        }
      },
    ]]],
  ];

  constructor(
    private userRepository: UserRepositoryProviderInterfaceResolver,
  ) {
    super();
  }

  public async handle(request: {id: string}): Promise<void> {
    return this.userRepository.delete(request.id);
  }
}
