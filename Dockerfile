FROM node:14

WORKDIR /usr/src/app

# Install dependencies required for building native modules and TensorFlow
RUN apt-get update && apt-get install -y build-essential python

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "npm", "start" ]
