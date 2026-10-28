import { app } from "./app.js";
import { config } from "./lib/config.js";
import { prisma } from "./lib/prisma.js";

await prisma.$connect();
const server = app.listen(config.PORT, () =>
  console.log(`API em http://localhost:${config.PORT}`),
);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => {
      void prisma.$disconnect().finally(() => process.exit(0));
    });
  });
}
