import { Payment } from './Payment';

export class User {
  id: string;

  username: string;

  email: string;

  displayName?: string;

  payments: Payment[];
}
