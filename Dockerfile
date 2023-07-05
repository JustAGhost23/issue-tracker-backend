FROM node:18.16.0-bookworm
ENV NODE_ENV development
WORKDIR /usr/local/app

COPY package.json ./
COPY package-lock.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

CMD [ "npm", "run", "dev" ]