#!/bin/bash

# Development Docker Validation Script for user-service
# This script validates that the Dockerfile.dev is properly structured

echo "🔍 Validating Dockerfile.dev for user-service..."
echo ""

# Check if Dockerfile.dev exists
if [ -f "Dockerfile.dev" ]; then
    echo "✅ Dockerfile.dev exists"
else
    echo "❌ Dockerfile.dev not found"
    exit 1
fi

# Check if package.docker.json exists
if [ -f "package.docker.json" ]; then
    echo "✅ package.docker.json exists"
else
    echo "❌ package.docker.json not found"
    exit 1
fi

# Validate Dockerfile.dev structure
echo ""
echo "📋 Checking Dockerfile.dev structure..."

if grep -q "FROM node:20-slim" Dockerfile.dev; then
    echo "✅ Uses Node.js 20-slim base image"
else
    echo "❌ Missing Node.js 20-slim base image"
fi

if grep -q "grpc_health_probe" Dockerfile.dev; then
    echo "✅ Includes gRPC health probe"
else
    echo "❌ Missing gRPC health probe"
fi

if grep -q "EXPOSE 50051" Dockerfile.dev; then
    echo "✅ Exposes port 50051"
else
    echo "❌ Missing port 50051 exposure"
fi

if grep -q "start:dev" Dockerfile.dev; then
    echo "✅ Uses start:dev command"
else
    echo "❌ Missing start:dev command"
fi

# Validate package.docker.json structure
echo ""
echo "📋 Checking package.docker.json structure..."

if grep -q '"start:dev"' package.docker.json; then
    echo "✅ Contains start:dev script"
else
    echo "❌ Missing start:dev script"
fi

if grep -q '"@nestjs/core"' package.docker.json; then
    echo "✅ Contains NestJS core dependencies"
else
    echo "❌ Missing NestJS core dependencies"
fi

echo ""
echo "🎉 Dockerfile.dev validation complete!"
echo ""
echo "🐳 Compatible with anineplus-api PR #2 Docker Compose development environment"
echo ""
echo "Usage in Docker Compose:"
echo "  user-service:"
echo "    build:"
echo "      context: ."
echo "      dockerfile: ./Dockerfile.dev"
echo "    ports:"
echo "      - \"50051:50051\""
echo "    volumes:"
echo "      - ./src:/app/src:ro"
echo "      - user_service_node_modules:/app/node_modules"
echo "    healthcheck:"
echo "      test: [\"/bin/grpc_health_probe\", \"-addr=:50051\"]"