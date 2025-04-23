import { User } from 'src/typeorm/entities/User';
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dtos/CreateUser.dto';

@Injectable()
export class UsersService {
  constructor() {}

  createUser(createUserDto: CreateUserDto): User {
    const user: User = {
      email: 'user123@gmail.com',
      id: '12347213445',
      username: 'user123',
    };
    return user;
  }

  getUserById(userId: string) {
    const user: User = {
      email: 'user123@gmail.com',
      id: '12347213445',
      username: 'user123',
    };
    return user;
  }
}
