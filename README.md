# Munshi Backend - Production-Ready Accounting System

A fully production-ready backend architecture for the Munshi accounting system built with Node.js, TypeScript, and modern best practices.

## 🏗️ Architecture Overview

### Tech Stack

- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript (strict mode)
- **Web Framework**: Fastify (high performance)
- **Databases**:
  - MySQL (Prisma ORM) - Transactional & ledger data
  - MongoDB (Mongoose) - Documents, logs, AI tasks
  - Redis - Caching & sessions
- **Task Queue**: BullMQ
- **Validation**: Zod
- **Authentication**: JWT + Refresh Tokens + Device Fingerprinting
- **Password Hashing**: Argon2
- **Logging**: Pino
- **Containerization**: Docker + Docker Compose

### Folder Structure

```
munshi/
├── src/
│   ├── config/           # Configuration (env, logger, security)
│   ├── db/
│   │   ├── mysql/        # Prisma client & transactions
│   │   └── mongo/        # Mongoose client & models
│   ├── helpers/          # Response & error helpers
│   ├── middlewares/      # Auth, RBAC, rate limiting, validation
│   ├── modules/          # Business modules (auth, user, ledger)
│   │   ├── auth/
│   │   ├── user/
│   │   └── ledger/
│   ├── queue/            # BullMQ queues & job processors
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utilities (crypto, redis, validation)
│   ├── app.ts            # Fastify app setup
│   └── server.ts         # Server entry point
├── prisma/
│   └── schema.prisma     # Prisma schema for MySQL
├── docker-compose.yml    # Docker services configuration
├── Dockerfile            # Multi-stage production build
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose (for containerized setup)

### Local Development

1. **Clone and install dependencies**:
```bash
cd munshi
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Generate Prisma client**:
```bash
npm run prisma:generate
```

4. **Run database migrations**:
```bash
npm run prisma:migrate
```

5. **Start development server**:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Docker Deployment

1. **Start all services**:
```bash
docker-compose up -d
```

2. **Run migrations inside container**:
```bash
docker-compose exec app npx prisma migrate deploy
```

3. **View logs**:
```bash
docker-compose logs -f app
```

4. **Stop services**:
```bash
docker-compose down
```

### With Admin UIs

To start with database admin interfaces:
```bash
docker-compose --profile admin up -d
```

- **Adminer** (MySQL): http://localhost:8080
- **Mongo Express**: http://localhost:8081 (admin/admin)

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |
| `DATABASE_URL` | MySQL connection string | - |
| `MONGODB_URI` | MongoDB connection string | - |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `JWT_ACCESS_SECRET` | JWT access token secret (min 32 chars) | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret (min 32 chars) | - |
| `JWT_ACCESS_EXPIRY` | Access token expiry | 15m |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | 7d |
| `CORS_ORIGIN` | Allowed CORS origins | http://localhost:3001 |

See `.env.example` for complete list.

## 🔐 Security Features

### Multi-Layer Security

1. **Authentication**:
   - JWT access tokens (15min expiry)
   - Refresh token rotation (7 day expiry)
   - Device fingerprinting for session tracking
   - Maximum 5 devices per user

2. **Password Security**:
   - Argon2id hashing (memory-hard, GPU-resistant)
   - Strong password requirements (8+ chars, mixed case, numbers, symbols)

3. **Rate Limiting**:
   - Global: 100 req/min
   - Auth endpoints: 5 req/15min
   - Redis-backed distributed rate limiting

4. **Input Validation & Sanitization**:
   - Zod schema validation
   - XSS protection via input sanitization
   - SQL injection protection (Prisma prepared statements)
   - NoSQL injection protection (Mongoose sanitization)

5. **Security Headers**:
   - Helmet.js for secure headers
   - HSTS, CSP, X-Frame-Options, etc.
   - CORS with strict origin control

6. **Monitoring**:
   - IP logging for all requests
   - Event logging in MongoDB
   - Audit logs for sensitive operations

## 📡 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Logout (invalidate refresh token) | No |
| POST | `/auth/logout-all` | Logout from all devices | Yes |

### Users

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/me` | Get current user profile | Yes |
| PATCH | `/users/me` | Update profile | Yes |
| GET | `/users` | List all users | Admin only |

### Ledger (Chart of Accounts)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/ledger` | Create ledger account | Yes |
| GET | `/ledger` | List all accounts | Yes |
| GET | `/ledger/:id` | Get account details | Yes |
| PATCH | `/ledger/:id` | Update account | Yes |
| DELETE | `/ledger/:id` | Delete account (soft) | Yes |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health status |

## 🗄️ Database Schemas

### MySQL (Prisma)

- **User**: User accounts with roles and MFA support
- **RefreshToken**: JWT refresh tokens
- **DeviceFingerprint**: Device tracking for sessions
- **Ledger**: Chart of accounts (hierarchical)
- **Transaction**: Double-entry bookkeeping
- **Invoice**: Invoice management with items
- **GSTRecord**: GST/tax records
- **AuditLog**: Audit trail for compliance

### MongoDB (Mongoose)

- **UploadedFile**: File metadata
- **OCRResult**: OCR processing results
- **AITask**: AI task queue and results
- **EventLog**: Application events (90-day TTL)
- **BankSyncLog**: Bank synchronization logs

## 🔄 Task Queues

### BullMQ Queues

1. **Email Queue**: Async email sending
2. **OCR Queue**: Document OCR processing

Workers are automatically started and process jobs with:
- Concurrency control
- Rate limiting
- Automatic retries
- Error handling

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
```

### Docker Commands

```bash
npm run docker:up      # Start Docker services
npm run docker:down    # Stop Docker services
npm run docker:build   # Rebuild and start services
npm run docker:logs    # View application logs
```

## 📊 Monitoring & Logging

### Structured Logging

- **Development**: Pretty-printed logs with colors
- **Production**: JSON logs for log aggregation
- **Levels**: fatal, error, warn, info, debug, trace

### Health Checks

- HTTP endpoint: `GET /health`
- Docker health checks every 30s
- Database connection monitoring

## 🔧 Extending the System

### Adding a New Module

1. Create module folder: `src/modules/your-module/`
2. Add files:
   - `your-module.validation.ts` - Zod schemas
   - `your-module.repository.ts` - Database operations
   - `your-module.service.ts` - Business logic
   - `your-module.controller.ts` - HTTP handlers
   - `your-module.routes.ts` - Route definitions
3. Register routes in `src/app.ts`

### Adding a New Queue

1. Create job processor: `src/queue/jobs/yourJob.ts`
2. Add queue to `src/queue/client.ts`
3. Dispatch jobs from services

## 🚢 Production Deployment

### Pre-Deployment Checklist

- [ ] Update `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (min 32 chars)
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `CORS_ORIGIN`
- [ ] Set up SSL/TLS certificates
- [ ] Configure database backups
- [ ] Set up log aggregation
- [ ] Configure monitoring/alerting
- [ ] Review rate limits
- [ ] Enable firewall rules

### Scaling Considerations

- **Horizontal Scaling**: Stateless design allows multiple instances
- **Session Management**: Redis-backed sessions
- **Database**: Connection pooling configured
- **Caching**: Redis for frequently accessed data
- **Load Balancing**: Use nginx or cloud load balancer

## 🛡️ Security Best Practices

1. **Never commit `.env` files**
2. **Rotate secrets regularly**
3. **Keep dependencies updated**
4. **Monitor security advisories**
5. **Use HTTPS in production**
6. **Implement rate limiting**
7. **Regular security audits**
8. **Database backups**

## 📄 License

MIT

## 👥 Contributing

This is a production-ready template. Customize for your specific needs.

---

**Built with ❤️ using modern Node.js best practices**
