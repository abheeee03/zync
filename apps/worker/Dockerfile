FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @repo/prisma generate

ENV NODE_ENV=production

CMD ["pnpm", "--filter", "worker", "start"]
