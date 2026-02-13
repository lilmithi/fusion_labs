import cron from "node-cron";
import { queueOfferProjection } from "../queue/offer-projection-queue";

export const startOfferProjectionCron = (): void => {
  // Safety net: catches time/budget transitions that happen without a write event (e.g., offer just expired).
  cron.schedule("*/2 * * * *", async () => {
    await queueOfferProjection({
      reason: "scheduled-refresh",
    });
  });
};
