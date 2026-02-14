# NestJS Monorepo: Gateway + Authentication

This repository contains a NestJS monorepo with two applications:

- **Gateway** (`apps/gateway`) exposes REST endpoints and Swagger.
- **Authentication** (`apps/authentication`) owns business logic, persistence, JWT issuing, and TCP microservice handlers.

## Architecture
- **MVC layering**: Controller → Service → Repository.
- **Gateway** communicates with **Authentication** using NestJS Microservices over TCP via a `NetworkingService`.
- **Shared contracts** live in `common/` (DTOs, RTOs, and message pattern constants).

## API Endpoints
- `POST /auth/register` — register a new user.
- `POST /auth/login` — authenticate a user and return a JWT access token.
- `GET /auth/users` — list all users (cached with Nest CacheModule and protected by JWT bearer auth).

Swagger UI is available at: `http://localhost:3000/docs`.

## Repository Structure
```
apps/
  gateway/
  authentication/
common/
core/
config/
```

## Environment Variables
Copy `.env.example` to `.env` and adjust as needed.

```
GATEWAY_PORT=3000
AUTH_TCP_HOST=127.0.0.1
AUTH_TCP_PORT=4001
MONGO_URI=mongodb://localhost:27017/auth
CACHE_TTL_SECONDS=20
JWT_SECRET=super-secret-jwt-key-change-this-value
JWT_EXPIRES_IN=1h
```

## Install Dependencies
```
npm install
```

## Run in Dev Mode (Two Terminals)
```
# Terminal 1
npm run start:dev:authentication
```

```
# Terminal 2
npm run start:dev:gateway
```

## Run with Docker Compose
```
docker compose up --build
```

## Tests
```
# Run all tests
npm test

# Run only auth tests
npm run test:auth
```

## Notes
- Duplicate email registration returns **409 Conflict** from the gateway.
- Invalid login credentials return **401 Unauthorized** from the gateway.
- Input validation is enforced in the gateway using `class-validator` with a global validation pipe.
- Authentication service owns MongoDB models, schemas, and token generation.
