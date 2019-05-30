import { Parents, Container } from '@pdc/core';

import { UserRepositoryProviderInterfaceResolver } from '../interfaces/UserRepositoryProviderInterface';
import { UserDbInterface } from '../interfaces/UserInterfaces';

@Container.handler({
  service: 'user',
  method: 'find',
})
export class FindUserAction extends Parents.Action {
  public readonly middlewares: (string|[string, any])[] = [
    ['validate', 'user.find'],
    ['scopeIt', [['user.read'], [
      (params, context) => {
        if ('id' in params && params.id === context.call.user._id) {
          return 'profile.read';
        }
      },
      (params, context) => {
        if ('aom' in params && params.aom === context.call.user.aom) {
          return 'aom.users.read';
        }
      },
      (params, context) => {
        if ('operator' in params && params.operator === context.call.user.operator) {
          return 'operator.users.read';
        }
      },
    ]]],
  ];
  constructor(
    private userRepository: UserRepositoryProviderInterfaceResolver,
  ) {
    super();
  }

  public async handle(request: {id: string}): Promise<UserDbInterface> {
    // middleware : "user.read"
    const foundUser = this.userRepository.find(request.id);

      // const results = await baseFind(query, options);
      // const aom = await Aom.find({}, { name: 1 });
      // const operators = await Operator.find({}, { nom_commercial: 1 });
      //
      // results.data = results.data.map((item) => {
      //   const user = item.toJSON();
      //
      //   if (user.aom && user.aom !== '') {
      //     const found = _.find(aom, a => a._id.toString() === user.aom.toString());
      //     if (found) user.aom = found.toJSON();
      //   }
      //
      //   if (user.operator && user.operator !== '') {
      //     const found = _.find(operators, a => a._id.toString() === user.operator.toString());
      //     if (found) user.operator = found.toJSON();
      //   }
      //
      //   return user;
      // });
      //
      // return results;

    return foundUser;
  }
}
