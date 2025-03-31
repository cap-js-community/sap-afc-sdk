#!/bin/bash

cd temp/afcsdk
#docker system prune -a -f
ctz containerize.yaml --push --logs
helm upgrade --install afcsdk ./gen/chart -n afc-sdk-dev
kubectl rollout restart deployment -n afc-sdk-dev