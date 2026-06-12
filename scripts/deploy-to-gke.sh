#!/bin/bash
set -e

# Configuration for your specific GKE cluster
PROJECT_ID="bubbly-card-458011-g1"
CLUSTER_NAME="foodwise-test"
CLUSTER_REGION="us-central1"
REGISTRY="gcr.io"
FRONTEND_APP="foodwise-ui"
BACKEND_SERVICES=("auth-service" "product-service" "api-gateway")

# Authenticate with Google Cloud
gcloud auth login
gcloud config set project ${PROJECT_ID}

# Install External Secrets Operator for Secret Manager integration
echo "Installing External Secrets Operator..."
kubectl apply -f https://github.com/external-secrets/external-secrets/releases/download/v0.9.5/external-secrets.yaml

# Build and push frontend Docker image
echo "Building and pushing frontend Docker image..."
docker build -t ${REGISTRY}/${PROJECT_ID}/${FRONTEND_APP}:latest .
docker push ${REGISTRY}/${PROJECT_ID}/${FRONTEND_APP}:latest

# Build and push backend Docker images (example - adjust paths as needed)
echo "Building and pushing backend service Docker images..."
for service in "${BACKEND_SERVICES[@]}"; do
  if [ -d "backend/${service}" ]; then
    echo "Building ${service}..."
    cd "backend/${service}"
    docker build -t ${REGISTRY}/${PROJECT_ID}/${service}:latest .
    docker push ${REGISTRY}/${PROJECT_ID}/${service}:latest
    cd - > /dev/null
  else
    echo "Warning: directory for ${service} not found, skipping build"
  fi
done

# Connect to the GKE cluster - note the change from zone to region for Autopilot
echo "Connecting to GKE Autopilot cluster..."
gcloud container clusters get-credentials ${CLUSTER_NAME} --region ${CLUSTER_REGION} --project ${PROJECT_ID}

# Create necessary secrets in Secret Manager if they don't exist
echo "Setting up GCP Secret Manager secrets..."
# Check if secrets exist, create them if they don't
gcloud secrets describe foodwise-maps-api-key --project ${PROJECT_ID} || \
  echo "Please run: gcloud secrets create foodwise-maps-api-key --data-file=/path/to/maps-api-key.txt"
gcloud secrets describe foodwise-api-base-url --project ${PROJECT_ID} || \
  echo "Please run: gcloud secrets create foodwise-api-base-url --data-file=/path/to/api-base-url.txt"

# Apply Kubernetes namespaces first
echo "Creating namespaces..."
kubectl apply -f k8s/namespaces.yaml

# Apply all Kubernetes configurations with kustomize
echo "Applying Kubernetes configurations..."
cd k8s
kubectl apply -k .

# Verify deployment
echo "Checking frontend deployment status..."
kubectl get pods -n frontend

echo "Checking backend deployment status..."
kubectl get pods -n backend

echo "Deployment completed successfully!"
echo "Frontend service info:"
kubectl get ingress -n frontend
echo "Backend service info:"
kubectl get ingress -n backend
