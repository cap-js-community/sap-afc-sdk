#!/bin/bash

cd temp/afcsdkjava
docker system prune -a -f
ctz containerize.yaml --push --logs
helm upgrade --install afcsdkjava ./gen/chart -n afc-sdk-dev
kubectl rollout restart deployment -n afc-sdk-dev