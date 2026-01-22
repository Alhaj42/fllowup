import { PrismaClientOptions } from '@prisma/client'

export const clientOptions: PrismaClientOptions = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
}
