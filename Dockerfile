FROM node:16 as build

WORKDIR /usr/src/app

COPY package.json /usr/src/app/package.json
RUN npm install

RUN npm install -g pm2 

COPY . .
RUN npm run-script build
CMD ["npm", "start"]
