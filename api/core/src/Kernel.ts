import { KernelInterface } from './interfaces/KernelInterface';
import { ProviderInterface } from './interfaces/ProviderInterface';
import { RPCCallType } from './types/RPCCallType';
import { RPCResponseType } from './types/RPCResponseType';
import { RPCSingleCallType } from './types/RPCSingleCallType';
import { RPCSingleResponseType } from './types/RPCSingleResponseType';

import { resolveMethodFromString } from './helpers/resolveMethod';
import { HttpProvider } from './providers/HttpProvider';

export class Kernel implements KernelInterface {
  registry: Map<string, ProviderInterface> = new Map();
  providers: ProviderInterface[];
  config: any;

  constructor(config) {
    this.config = config;
    this.boot();
  }

  protected boot() {
    this.providers.forEach((provider) => {
      this.registry.set(provider.signature, provider);
      provider.boot();
    });

    if ('providers' in this.config) {
      Reflect.ownKeys(this.config.providers).forEach((serviceName: string) => {
        this.registry.set(serviceName, new HttpProvider(serviceName, this.config.providers[serviceName]));
      });
    }
  }

  protected async resolve(call: RPCSingleCallType): Promise<RPCSingleResponseType> {
    const { method, service } = resolveMethodFromString(<string>call.method);

    if (!this.registry.has(service)) {
      throw new Error('Unknown service');
    }

    try {
      const response = await this.registry.get(service).call(method, call.params, null);
      return {
        id: call.id,
        result: response,
        jsonrpc: '2.0',
      };
    } catch (e) {
      return {
        id: call.id,
        error: {
          code: 0,
          message: e.message,
        },
        jsonrpc: '2.0',
      };
    }
  }

  async handle(call: RPCCallType): Promise<RPCResponseType> {
    // DO VALIDATION
    function hasMultipleCall(c: RPCCallType): c is RPCSingleCallType[] {
      return (<RPCCallType[]>c).forEach !== undefined;
    }

    if (!hasMultipleCall(call)) {
      return this.resolve(call);
    }

    const promises: Promise<RPCSingleResponseType>[] = [];
    call.forEach((c) => {
      promises.push(this.resolve(c));
    });

    const responses = await Promise.all(promises);
    return responses;
  }
}
