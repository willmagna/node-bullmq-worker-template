/* eslint-disable @typescript-eslint/no-empty-function */

import { PrismaClient } from '../../../prisma/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

import { ConnectionNotFoundError } from './errors.js';

export class PgConnection {
  private static instance?: PgConnection;
  private databaseUrl?: string;
  public connection?: PrismaClient;

  private constructor() {}

  static getInstance(): PgConnection {
    if (PgConnection.instance === undefined) PgConnection.instance = new PgConnection();
    return PgConnection.instance;
  }

  async connect(): Promise<void> {
    this.connection = new PrismaClient({ adapter });
    await this.connection.$connect();
  }

  async disconnect(): Promise<void> {
    if (this.connection === undefined) throw new ConnectionNotFoundError();
    this.connection.$disconnect();
  }

  getPrismaClient(): PrismaClient {
    if (this.connection === undefined) throw new ConnectionNotFoundError();
    return this.connection;
  }
}
