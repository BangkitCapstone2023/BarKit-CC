FROM node:14

WORKDIR /usr/src/app

# Install dependencies required for building native modules and TensorFlow
RUN apt-get update && apt-get install -y build-essential python

COPY package*.json ./

RUN npm install

COPY . .

# Copy credential files into the container
COPY config/firebaseAccountKey2.json ./app/config/firebaseAccountKey2.json
COPY config/firebaseClientConfig2.json ./app/config/firebaseClientConfig2.json
COPY config/cloudStorageKey2.json ./app/config/cloudStorageKey2.json

CMD [ "npm", "start" ]