import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { User } from './user.schema';

export class UserRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectConnection() private readonly connection: Connection
  ) {}

  async create(email: string, passwordHash: string): Promise<User> {
    const createdUser = new this.userModel({ email, passwordHash });
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().sort({ createdAt: -1 }).exec();
  }

  async isDatabaseReady(): Promise<boolean> {
    if (this.connection.readyState !== 1) {
      return false;
    }

    const db = this.connection.db;
    if (!db) {
      return false;
    }

    await db.admin().ping();
    return true;
  }
}
