import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // We use DIRECT_URL here because Prisma CLI needs the direct connection to push structural changes
    url: env("DIRECT_URL"), 
  },
});