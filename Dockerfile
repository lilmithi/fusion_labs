FROM oven/bun:1.3.9

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# Prisma 7 config reads DATABASE_URL from prisma.config.ts during generate.
# A placeholder keeps generate deterministic during image build.
ARG DATABASE_URL="postgresql://postgres:postgres@db:5432/fusion_labs"
ENV DATABASE_URL=${DATABASE_URL}

RUN bun run prisma:generate

EXPOSE 3000

CMD ["sh", "-c", "bun run prisma:generate && bun run prisma:migrate:deploy && bun run start"]
