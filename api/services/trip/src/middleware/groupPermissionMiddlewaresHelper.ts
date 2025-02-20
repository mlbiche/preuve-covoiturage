import {
  hasPermissionByScopeMiddleware,
  HasPermissionByScopeMiddlewareParams,
  ListOfConfiguredMiddlewares,
} from '@pdc/provider-middleware';

//
// Custom groupPermissionMiddlewares() using authorizedZoneCodes in place of territory_id
//
export function groupPermissionMiddlewaresHelper(groups: {
  territory: string;
  operator: string;
  registry: string;
}): ListOfConfiguredMiddlewares<HasPermissionByScopeMiddlewareParams> {
  const middlewareParameters = [];
  const { territory: territoryPermission, operator: operatorPermission, registry: registryPermission } = groups;

  middlewareParameters.push([territoryPermission, 'call.user.authorizedZoneCodes._id', 'territory_id']);
  middlewareParameters.push([operatorPermission, 'call.user.operator_id', 'operator_id']);

  return [hasPermissionByScopeMiddleware(registryPermission, ...middlewareParameters)];
}
