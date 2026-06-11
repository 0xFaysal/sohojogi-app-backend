import { Role } from '../enums/role.enum';

export interface RequestUser {
  userId: string;
  email: string;
  roles: Role[];
}
