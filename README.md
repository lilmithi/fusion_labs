# Fusion Labs Take-Home

Performance-focused refactor of the `offers` resolver using TypeScript, Bun, GraphQL, Prisma 7, PostgreSQL, and Redis-backed background processing.

## Stack

- Bun + TypeScript
- GraphQL Yoga
- Prisma 7 + PostgreSQL
- BullMQ + Redis
- node-cron

## Project Layout

```text
apps/api/
  graphql/      # schema + resolvers
  services/     # offer eligibility/projection logic
  queue/        # BullMQ setup
  workers/      # queue consumer + cron trigger
  lib/          # shared clients
prisma/
  schema.prisma
  migrations/
  seed.ts
tests/
```

## Quick Start

1. Install

```bash
bun install
```

2. Configure env

```bash
cp .env.example .env
```

3. Generate client + migrate

```bash
bun run prisma:generate
bun run prisma:migrate
```

4. Seed sample data

```bash
bun run prisma:seed
```

5. Run API + worker bootstrap

```bash
bun run dev
```

## Testing

```bash
bun run typecheck
bun test
```

## Seeded Demo Users

Use `x-user-id` request header when calling GraphQL:

- `user_alice`
- `user_bob`
- `user_chris`

## GraphQL Endpoint

- `http://localhost:3000/graphql`

## Docker

1. Start app + PostgreSQL + Redis

```bash
docker compose up --build -d
```

2. Seed data (client generation + migrations run automatically at container start)

```bash
docker compose exec app bun run prisma:seed
```

3. Query GraphQL

- `http://localhost:3000/graphql`

4. Stop services

```bash
docker compose down
```
