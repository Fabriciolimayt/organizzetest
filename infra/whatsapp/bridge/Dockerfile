FROM node:22.14.0-alpine3.21

ENV NODE_ENV=production
WORKDIR /app

COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

USER node
EXPOSE 3000

CMD ["node", "src/index.js"]
