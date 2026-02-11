ARG NODE_VERSION=22.20.0

FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN yarn install --frozen-lockfile

COPY prisma ./prisma

COPY . .

RUN yarn build

FROM node:${NODE_VERSION}-alpine AS runner

WORKDIR /app

RUN apk add --no-cache tzdata \
  && cp /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime \
  && echo "America/Sao_Paulo" > /etc/timezone \
  && apk del tzdata

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/prisma ./prisma

CMD ["yarn", "start"]
