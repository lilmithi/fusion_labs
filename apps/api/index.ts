import type { Job } from "bullmq";
import type { OfferProjectionJobPayload } from "./queue/offer-projection-contracts";
import "./server";
import { offerProjectionWorker } from "./workers/offer-projection.worker";
import { startOfferProjectionCron } from "./workers/offer-projection-cron";

startOfferProjectionCron();

offerProjectionWorker.on("ready", () => {
  console.log("Offer projection worker ready");
});

offerProjectionWorker.on("failed", (job: Job<OfferProjectionJobPayload> | undefined, error: Error) => {
  console.error("Offer projection job failed", {
    jobId: job?.id,
    error,
  });
});
