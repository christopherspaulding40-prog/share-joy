
FROM node:20

WORKDIR /app

COPY . .

RUN npm install --legacy-peer-deps

EXPOSE 9293

CMD ["npm", "run", "dev"]
