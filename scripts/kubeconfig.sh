# API server URL is api.KYMA_CLUSTER_DOMAIN
ns=afc-sdk-dev
API_SERVER_URL=$(kubectl config view -o=jsonpath='{.clusters[].cluster.server}')

SECRET_NAME=afcsdk-service-account

CA=$(kubectl get secret/${SECRET_NAME} -n $ns -o jsonpath='{.data.ca\.crt}')
TOKEN=$(kubectl get secret/${SECRET_NAME} -n $ns -o jsonpath='{.data.token}' | base64 --decode)

echo "apiVersion: v1
kind: Config
clusters:
  - name: default-cluster
    cluster:
      certificate-authority-data: ${CA}
      server: ${API_SERVER_URL}
users:
  - name: default-user
    user:
      token: ${TOKEN}
contexts:
  - name: default-context
    context:
      cluster: default-cluster
      namespace: $ns
      user: default-user
current-context: default-context"
