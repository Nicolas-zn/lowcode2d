import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { UsersRepository } from './users.repository'

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getById(id: string) {
    const user = await this.usersRepository.findById(id)
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  findByEmailWithPassword(email: string) {
    return this.usersRepository.findByEmailWithPassword(email)
  }

  async createUser(input: { email: string; passwordHash: string; displayName?: string }) {
    const existing = await this.usersRepository.findByEmailWithPassword(input.email)
    if (existing) throw new ConflictException('Email already registered')

    return this.usersRepository.create({
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      displayName: input.displayName || input.email.split('@')[0]
    })
  }
}
