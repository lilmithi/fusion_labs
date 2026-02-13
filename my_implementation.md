# Offers Query Performance - What I Changed

## Context

The `offers` endpoint is a hot path. It gets called frequently by web and mobile clients, so small inefficiencies add up fast.

Before this refactor, every request rebuilt a large Prisma filter with multiple nested `OR` conditions across cashback, exclusive offers, and loyalty programs. On top of that, it also checked customer type eligibility, date ranges, budgets, active flags, and review status in the same query flow.

It was correct, but expensive.

## My approach

I focused on reducing work at **request time**.

Instead of recalculating all eligibility logic on each `offers` query, I introduced a precomputed read model:

- `OfferEligibilitySnapshot`
- one row per `userId + outletId`
- stores whether that outlet currently has eligible cashback/exclusive/loyalty offers for that user

So the heavy logic runs in the background, and the resolver does a much lighter read.

## What changed

### 1) Read model in the database

I added `OfferEligibilitySnapshot` plus indexes optimized for user-scoped lookups.

This lets the API fetch “which outlets are eligible for this user” quickly without building huge dynamic query trees each time.

### 2) Refactored `offers` resolver

The resolver now:

- reads from snapshot table first
- applies search/category/percentage filters
- hydrates outlet + merchant details
- if snapshot rows look stale, it triggers async recomputation (without blocking the response)

That keeps response time stable while still keeping data fresh.

### 3) Moved eligibility logic to a projector service

I created a projector that rebuilds snapshots per user (or per user + merchant scope).

It still applies all business rules, including:

- active/inactive and deleted checks
- approved review checks
- date window checks
- budget remaining checks
- customer-type rules (`All`, `NonCustomer`, and exact matches)
- loyalty tier hierarchy rules

So behavior is preserved, just moved out of the hot read path.

### 4) Added async refresh flow

I added queue + worker + cron support:

- queue jobs for offer/merchant/customer-type changes
- worker to rebuild snapshots
- cron as a safety net for time-based transitions (e.g., offer expired)

This gives us a practical balance between freshness and speed.

### 5) Added seed and tests for easier evaluation

To make review easier, I added:

- `prisma/seed.ts` with realistic merchants/offers/users
- lightweight tests for core eligibility/filter logic

So anyone evaluating the task can run it quickly and verify behavior without manual setup.

## Why this helps performance

The key improvement is that the API no longer performs the full eligibility computation on every read.

Now the hot query is mostly:

- indexed snapshot lookup
- small filter conditions
- relation hydration

This is much easier for Postgres to handle consistently under load.

## Trade-offs I considered

This design introduces more moving parts (queue/worker/cron), so operationally it is more complex than a single query.

But for a frequently-hit endpoint, I think this is a reasonable trade-off:

- read performance gets much better
- logic stays correct
- data freshness is handled asynchronously with periodic safety refresh

## If I had more time

I would add:

- lightweight metrics around snapshot age and projection latency
- integration tests for end-to-end projection flow
- a simpler fallback mode (single-process recompute) for very small deployments

## Summary

In short: I kept the same business behavior, but moved expensive eligibility logic out of the hot request path and into a background projection pipeline. That makes the `offers` endpoint faster and more scalable while staying maintainable.
