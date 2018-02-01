#!/bin/sh
echo Starting Public-UI version: $PUBLIC_UI_VER
rm -rf /home/centos/egar-public-ui/scripts/kube/public-ui-deployment.yaml; envsubst < "/home/centos/egar-public-ui/scripts/kube/public-ui-deployment-template.yaml" > "/home/centos/egar-public-ui/scripts/kube/public-ui-deployment.yaml"
kubectl create -f /home/centos/egar-public-ui/scripts/kube/public-ui-deployment.yaml
kubectl create -f /home/centos/egar-public-ui/scripts/kube/public-ui-service.yaml
