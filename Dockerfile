FROM node:20-bullseye AS builder
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates build-essential python3 \
    && rm -rf /var/lib/apt/lists/*

ENV METEOR_ALLOW_SUPERUSER=1
RUN curl --fail --location "https://install.meteor.com/?release=3.3.2" | sh

WORKDIR /app

COPY package.json package-lock.json .meteor/ .
RUN meteor npm ci

COPY . .

RUN meteor build --directory /opt/build --allow-superuser --server-only

FROM node:20-bullseye-slim AS runtime

ENV NODE_ENV=production \
    PORT=3000 \
    ROOT_URL=http://localhost:3000 \
    MONGO_URL=mongodb://mongo:27017/meteor

WORKDIR /opt/app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/build/bundle ./bundle

RUN cd bundle/programs/server \
    && npm install --omit=dev

EXPOSE 3000

WORKDIR /opt/app/bundle
CMD ["node", "main.js"]
