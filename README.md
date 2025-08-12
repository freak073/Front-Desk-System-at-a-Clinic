# Front Desk System

A comprehensive web-based application for managing clinic operations including patient queues, doctor appointments, and staff management.

## Project Structure

```
front-desk-system/
├── backend/          # NestJS API server
├── frontend/         # Next.js web application
└── README.md
```

## Technology Stack

### Backend
- **NestJS** - Node.js framework for building scalable server-side applications
- **TypeScript** - Type-safe JavaScript
- **TypeORM** - Object-Relational Mapping for database operations
- **MySQL** - Relational database
- **JWT** - JSON Web Tokens for authentication
- **Jest** - Testing framework

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Server state management
- **Axios** - HTTP client for API communication
- **Jest & React Testing Library** - Testing frameworks

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- MySQL (v8.0 or higher)

## Setup Instructions

### 1. Database Setup

1. Install MySQL and create a database:
```sql
CREATE DATABASE front_desk_system;
```

2. Create a MySQL user (optional but recommended):
```sql
CREATE USER 'front_desk_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON front_desk_system.* TO 'front_desk_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file and configure it:
```bash
cp .env.example .env
```

4. Update the `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=front_desk_system
JWT_SECRET=your-super-secret-jwt-key
```

5. Start the development server:
```bash
npm run start:dev
```

The backend API will be available at `http://localhost:3001`

### 3. Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file:
```bash
cp .env.example .env.local
```

4. Start the development server:
```bash
npm run dev
```

The frontend application will be available at `http://localhost:3000`

## Development Commands

### Backend Commands
```bash
# Development
npm run start:dev      # Start with hot reload
npm run start:debug    # Start in debug mode

# Building
npm run build          # Build the application
npm run start:prod     # Start production build

# Testing
npm run test           # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage
npm run test:e2e       # Run end-to-end tests

# Code Quality
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
```

### Frontend Commands
```bash
# Development
npm run dev            # Start development server
npm run build          # Build for production
npm run start          # Start production server

# Testing
npm run test           # Run tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage

# Code Quality
npm run lint           # Run Next.js linter
```

## API Documentation

The backend API provides the following endpoints:

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get user profile

### Doctors
- `GET /doctors` - Get all doctors
- `POST /doctors` - Create new doctor
- `PUT /doctors/:id` - Update doctor
- `DELETE /doctors/:id` - Delete doctor

### Patients
- `GET /patients` - Get all patients
- `POST /patients` - Create new patient
- `PUT /patients/:id` - Update patient
- `DELETE /patients/:id` - Delete patient

### Queue Management
- `GET /queue` - Get current queue
- `POST /queue` - Add patient to queue
- `PUT /queue/:id/status` - Update queue status
- `DELETE /queue/:id` - Remove from queue

### Appointments
- `GET /appointments` - Get all appointments
- `POST /appointments` - Create new appointment
- `PUT /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Cancel appointment

## Testing

Both backend and frontend include comprehensive test suites:

- **Unit Tests** - Test individual components and services
- **Integration Tests** - Test API endpoints and database operations
- **End-to-End Tests** - Test complete user workflows

Run tests using the commands mentioned in the Development Commands section.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.
\n## Deployment (Docker)\n\nRun the full stack with Docker Compose:\n\n```bash\ndocker compose build\ndocker compose up -d\n```\n\nServices:\n- Frontend: http://localhost:3000\n- Backend API: http://localhost:3001\n- MySQL: localhost:3307 (mapped)\n\nEnvironment variables live in `docker-compose.yml` and `backend/.env.example`. Replace defaults (especially JWT_SECRET) before production.\n\n### Production Hardening Checklist\n- Set strong, rotated `JWT_SECRET`.\n- Use dedicated DB credentials / least privilege.\n- Enforce HTTPS & HSTS at the reverse proxy.\n- Tighten CORS to explicit domains (no wildcards).\n- Re-enable strict CSP in `main.ts` (remove dev relaxation).\n- Monitor rate limit metrics & tune thresholds.\n- Add structured logging & centralized aggregation.\n\n### Future Enhancements\n- Health & readiness endpoints.\n- Prometheus metrics export.\n- Audit log persistence for critical actions.\n- Automated database migrations in entrypoint.\n\n## Security Reference
See `backend/SECURITY.md` for details on helmet, throttling, cache and logging controls.

## Database Environment Flow

Central DB name resolution lives in `backend/src/database/db-config.ts`.

Resolution rules:
- `NODE_ENV === test` -> `clinic_test`
- Else -> `DB_NAME` env var or fallback `front_desk_system`

Startup guards:
- Production must use DB name `front_desk_system` (abort otherwise)
- Test DB `clinic_test` rejected outside test env

Seeding safety (idempotent by default):
- `SEED_LOCK` file prevents accidental destructive reseed
- Normal `npm run seed` only inserts missing baseline + sample data
- Full reset only when BOTH `ALLOW_DB_RESET=true` and `IGNORE_SEED_LOCK=true` (or lock removed)

Flags:
- `ALLOW_DB_RESET` enables truncation path (never set in production)
- `IGNORE_SEED_LOCK` bypasses the lock (use with caution)

Key scripts:
- `npm run migrate` / `migrate:revert` / `migrate:generate`
- `npm run seed` (safe / top-up)
- `npm run db:count` (table counts for quick diagnostics)

Typical flows:
1. Fresh local: migrate -> seed -> start
2. Add sample data again: seed (idempotent)
3. Full dev reset: delete `SEED_LOCK` + set both flags -> seed
4. CI: `NODE_ENV=test`, migrate (or sync), run tests (isolated DB)
5. Prod initial: set production env vars, migrate once, seed once (lock created)

Observability:
- Boot log `[BOOT]` prints sanitized DB config snapshot
- `/monitoring/ready` exposes table counts to detect empty/drift

Rationale:
- Centralization avoids drift between runtime, migrations & seed scripts
- Lock + flags protect against unintended data loss
- Guards fail fast before harmful operations