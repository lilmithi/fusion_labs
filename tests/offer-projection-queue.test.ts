import { describe, expect, test } from "bun:test";
import {
  OFFER_PROJECTION_JOB_REBUILD,
  OFFER_PROJECTION_JOB_RECOMPUTE_USER,
  OFFER_PROJECTION_QUEUE_NAME,
} from "../apps/api/queue/offer-projection-contracts";

describe("offer projection queue contracts", () => {
  test("exports stable queue and job names", () => {
    expect(OFFER_PROJECTION_QUEUE_NAME).toBe("offer-projection");
    expect(OFFER_PROJECTION_JOB_REBUILD).toBe("rebuild-offer-snapshots");
    expect(OFFER_PROJECTION_JOB_RECOMPUTE_USER).toBe("recompute-user-snapshots");
  });

  test("job names remain distinct for explicit worker routing", () => {
    expect(OFFER_PROJECTION_JOB_REBUILD).not.toBe(OFFER_PROJECTION_JOB_RECOMPUTE_USER);
  });
});
