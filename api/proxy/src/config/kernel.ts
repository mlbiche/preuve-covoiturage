import { env } from '@ilos/core';

export const is_worker = env('APP_WORKER', false);
export const timeout = env('APP_REQUEST_TIMEOUT', is_worker ? 0 : 5000);
