FROM quay.io/ukhomeofficedigital/nodejs-base:v6.11.1

RUN rpm --rebuilddb
RUN yum -y install epel-release
RUN yum -y install redis

RUN mkdir -p /app
WORKDIR /app

COPY package.json .
RUN npm install
COPY . .
RUN npm run-script build
RUN npm run-script test:lint

EXPOSE 8080

RUN chmod 755 start.sh
ENTRYPOINT ["/app/start.sh"]
