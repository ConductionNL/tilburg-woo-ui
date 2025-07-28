#!/bin/bash

# Tilburg WOO UI Deployment Script
# Usage: ./deploy.sh [environment] [namespace] [release-name] [--dry-run]

set -e

# Parse arguments
DRY_RUN=false
for arg in "$@"; do
    case $arg in
        --dry-run)
        DRY_RUN=true
        shift
        ;;
    esac
done

# Default values
ENVIRONMENT=${1:-"production"}
NAMESPACE=${2:-"tilburg-woo-ui"}
RELEASE_NAME=${3:-"tilburg-woo-ui"}
CHART_PATH="./tilburg-woo-ui"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if helm is installed
if ! command -v helm &> /dev/null; then
    print_error "Helm is not installed. Please install Helm first."
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check Kubernetes connection
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster. Please check your kubectl configuration."
    exit 1
fi

# Validate Helm chart
print_status "Validating Helm chart..."
if ! helm lint "$CHART_PATH" &> /dev/null; then
    print_error "Helm chart validation failed. Please fix the chart issues."
    helm lint "$CHART_PATH"
    exit 1
fi

print_status "Starting deployment of Tilburg WOO UI"
print_status "Environment: $ENVIRONMENT"
print_status "Namespace: $NAMESPACE"
print_status "Release Name: $RELEASE_NAME"

# Create namespace if it doesn't exist
print_status "Creating namespace '$NAMESPACE' if it doesn't exist..."
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

# Determine values file based on environment
VALUES_FILE=""
case $ENVIRONMENT in
    "production"|"prod")
        VALUES_FILE="values-production.yaml"
        print_status "Using production configuration"
        ;;
    "development"|"dev")
        VALUES_FILE="values-development.yaml"
        print_status "Using development configuration"
        ;;
    "default")
        print_status "Using default values.yaml"
        ;;
    *)
        print_warning "Unknown environment '$ENVIRONMENT'. Using default values."
        ;;
esac

# Build helm command
HELM_CMD="helm upgrade --install $RELEASE_NAME $CHART_PATH --namespace $NAMESPACE"

if [ ! -z "$VALUES_FILE" ] && [ -f "$CHART_PATH/$VALUES_FILE" ]; then
    HELM_CMD="$HELM_CMD -f $CHART_PATH/$VALUES_FILE"
    print_status "Using values file: $VALUES_FILE"
else
    if [ ! -z "$VALUES_FILE" ]; then
        print_warning "Values file '$VALUES_FILE' not found. Using default values."
    fi
fi

# Add any additional parameters passed as environment variables
if [ ! -z "$HELM_EXTRA_ARGS" ]; then
    HELM_CMD="$HELM_CMD $HELM_EXTRA_ARGS"
    print_status "Adding extra arguments: $HELM_EXTRA_ARGS"
fi

# Execute deployment
print_status "Executing: $HELM_CMD"
eval $HELM_CMD

if [ $? -eq 0 ]; then
    print_status "Deployment successful!"
    
    # Show deployment status
    print_status "Checking deployment status..."
    kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/name=tilburg-woo-ui"
    
    print_status "Services:"
    kubectl get svc -n "$NAMESPACE" -l "app.kubernetes.io/name=tilburg-woo-ui"
    
    print_status "Ingress:"
    kubectl get ingress -n "$NAMESPACE" -l "app.kubernetes.io/name=tilburg-woo-ui" 2>/dev/null || print_warning "No ingress found"
    
    print_status "Deployment completed successfully!"
    print_status "You can check the logs with: kubectl logs -n $NAMESPACE -l app.kubernetes.io/name=tilburg-woo-ui -f"
else
    print_error "Deployment failed!"
    exit 1
fi 