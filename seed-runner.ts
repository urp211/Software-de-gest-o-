import { seedDb } from "./src/db/seed";

seedDb().then(() => {
  console.log("Seed complete");
  process.exit(0);
}).catch((e) => {
  console.error("Seed failed", e);
  process.exit(1);
});
