#!/bin/sh
kubectl delete -f /home/centos/egar-public-ui/scripts/kube/public-ui-deployment.yaml
kubectl delete -f /home/centos/egar-public-ui/scripts/kube/public-ui-service.yaml

