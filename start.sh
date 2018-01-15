#!/bin/sh
cd /app
redis-server &

node app.js "$@"
