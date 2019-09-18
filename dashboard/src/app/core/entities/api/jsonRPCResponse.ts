import { JsonRPCResult } from './jsonRPCResult';
import { JsonRPCError } from './jsonRPCError';

export interface JsonRPCResponse {
  id: number;
  error?: JsonRPCError;
  result?: JsonRPCResult;
}
