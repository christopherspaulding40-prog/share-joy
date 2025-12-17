import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient;
}

const initPrisma = () => {
  try {
    if (process.env.NODE_ENV !== "production") {
      if (!global.prismaGlobal) {
        global.prismaGlobal = new PrismaClient({
          log: ["error", "warn"],
        });
      }
      return global.prismaGlobal;
    }
    
    return new PrismaClient({
      log: ["error", "warn"],
    });
  } catch (error) {
    console.error("[Prisma] Failed to initialize:", error);
    throw error;
  }
};

const prisma = initPrisma();

export default prisma;
