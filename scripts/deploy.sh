#!/bin/bash
set -e

echo "Building the application..."
npm run build

echo "Initializing Terraform..."
cd terraform
terraform init

echo "Applying Terraform configuration..."
terraform apply -auto-approve

echo "Retrieving bucket name..."
BUCKET=$(terraform output -raw bucket_name)
echo "Deploy target: $BUCKET"

cd ..
echo "Syncing files to S3..."
aws s3 sync dist s3://$BUCKET --delete

echo "Deployment complete!"
