FROM node:alpine

# Handle create-react-app known bugs with docker
ENV CI=true
ENV WDS_SOCKET_PORT=0

WORKDIR /app
COPY package.json ./
RUN npm install
COPY ./ ./

CMD npm start