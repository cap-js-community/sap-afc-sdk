#!/bin/bash

cd temp/afcsdk
helm upgrade --install afcsdk ./gen/chart -n afc-sdk-dev && kubectl rollout restart deployment -n afc-sdk-dev
# kubectl get gateway -n kyma-system kyma-gateway -o jsonpath='{.spec.servers[0].hosts[0]}' | grep -v '^$'
