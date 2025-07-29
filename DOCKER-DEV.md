# Docker Development Environment

This repository includes Docker development configuration compatible with the [anineplus-api PR #2](https://github.com/anineplus/anineplus-api/pull/2) comprehensive development environment.

## Files

- `Dockerfile.dev` - Development-optimized Docker image
- `package.docker.json` - Simplified package.json for Docker builds
- `validate-dockerfile.sh` - Validation script for Docker configuration

## Features

### Dockerfile.dev
- **Base Image**: Node.js 20-slim for reliability
- **gRPC Health Checks**: Includes `grpc_health_probe` for Docker Compose health checks
- **Bun Support**: Installs Bun for compatibility with local development
- **Port 50051**: Properly exposed for gRPC service
- **Hot Reload Ready**: Configured for volume mounts and watch mode

### package.docker.json
- **Minimal Dependencies**: Core NestJS packages only for faster builds
- **Development Scripts**: Includes `start:dev` for watch mode
- **No Local Dependencies**: Removes `@bune/common` and `@bune/casl-authorization` links

## Docker Compose Integration

This service integrates with the comprehensive Docker Compose development environment:

```yaml
user-service:
  build:
    context: .
    dockerfile: ./Dockerfile.dev
  container_name: "user-service-dev"
  ports:
    - "50051:50051"
  volumes:
    - ./src:/app/src:ro
    - ./package.json:/app/package.json:ro
    - ./tsconfig.json:/app/tsconfig.json:ro
    - ./nest-cli.json:/app/nest-cli.json:ro
    - user_service_node_modules:/app/node_modules
  environment:
    - NODE_ENV=development
  depends_on:
    user-database:
      condition: service_healthy
    cache-service:
      condition: service_healthy
  healthcheck:
    test: ["/bin/grpc_health_probe", "-addr=:50051"]
    interval: 30s
    timeout: 10s
    retries: 5
    start_period: 40s
  restart: "unless-stopped"
  networks:
    - backend
```

## Validation

Run the validation script to verify the Docker configuration:

```bash
./validate-dockerfile.sh
```

## Development Workflow

1. **Build the development image**:
   ```bash
   docker build -f Dockerfile.dev -t user-service-dev .
   ```

2. **Use with Docker Compose** (from anineplus-api repository):
   ```bash
   docker compose -f docker-compose-dev.yaml up user-service
   ```

3. **Volume Mounts Enable Hot Reload**:
   - Source code changes in `./src` are reflected immediately
   - No container rebuilds needed for development
   - Node modules cached in Docker volume for performance

## Compatibility

This Docker configuration is specifically designed to work with:
- [anineplus-api PR #2](https://github.com/anineplus/anineplus-api/pull/2) Docker Compose development environment
- Hot reload development workflow
- gRPC health checking
- Production-like networking and service discovery