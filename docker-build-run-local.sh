#!/bin/sh
create_ui_container=0

while [ "$1" != "" ]; do
    echo "$1"
    case $1 in
        "-c" | "--create-ui-container")
        shift
        create_ui_container=1
        ;;
        *)
        shift
        ;;
    esac
done

export KEYCLOAK_REALM=egarlocal
export KEYCLOAK_CLIENT_SECRET=db407a84-a911-4a7b-ab39-a0621ba9302e
export KEYCLOAK_ENC_KEY=AgXa7xRcoClDEU0ZDSH4X0XhL5Qy2Z2j
export KEYCLOAK_ADDRESS=`sudo docker inspect -f "{{ .NetworkSettings.IPAddress }}" keycloak`
export DOCKER_HOST_ADDRESS=`sudo ifconfig docker0 | grep 'inet addr' | cut -d: -f2 | awk '{print $1}'`

rm -rf local-deployment.yml; envsubst < "local-deployment-template.yml" > "local-deployment.yml";

if [ $create_ui_container == 1 ]; then
    docker build --no-cache -f ./Dockerfile-local -t local-public-ui:latest .
fi

docker-compose -f local-deployment.yml up -d
