#!/bin/bash

cd temp/afcjdk
docker system prune -a -f
ctz containerize.yaml --push --logs
helm upgrade --install afcjdk ./gen/chart -n afc-sdk-dev
kubectl rollout restart deployment -n afc-sdk-dev