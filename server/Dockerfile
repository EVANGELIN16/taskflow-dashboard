
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts

COPY prisma ./prisma
COPY prisma.config.ts ./

RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npx prisma generate

COPY . .

EXPOSE 5000

CMD ["npx", "tsx", "index.ts"]
