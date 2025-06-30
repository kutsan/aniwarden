FROM node:24-alpine AS base

ENV PNPM_HOME="/usr/local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

RUN apk add --no-cache python3 build-base libc6-compat
#  sqlite sqlite-dev

FROM base AS development

WORKDIR /usr/src/app

COPY ./package.json /usr/src/app/package.json
COPY ./pnpm-lock.yaml /usr/src/app/pnpm-lock.yaml
COPY ./pnpm-workspace.yaml /usr/src/app/pnpm-workspace.yaml
COPY ./.env.development /usr/src/app/.env.development

RUN pnpm install --frozen-lockfile

CMD ["pnpm", "run", "dev"]
