# Drizzle ORM Migration Commands

Laravel-style migration commands for the Munshi backend.

## 🚀 Quick Start

```bash
# 1. Generate migration from schema changes
npm run db:generate

# 2. Apply migrations to database
npm run db:push

# 3. Open database GUI
npm run db:studio
```

## 📋 Available Commands

| Command | Laravel Equivalent | Description |
|---------|-------------------|-------------|
| `npm run db:generate` | `php artisan make:migration` | Generate SQL migration from schema |
| `npm run db:push` | `php artisan migrate` | Push schema directly to database (dev) |
| `npm run db:migrate` | `php artisan migrate` | Apply pending migrations |
| `npm run db:pull` | - | Pull schema from database |
| `npm run db:studio` | `php artisan db:seed` | Open Drizzle Studio (database GUI) |
| `npm run db:check` | `php artisan migrate:status` | Check migration status |
| `npm run db:up` | - | Apply specific migration |

## 🔄 Migration Workflow

### Development Workflow

1. **Modify schema** in `src/db/schema/*.ts`
   ```typescript
   export const users = mysqlTable('users', {
     id: bigint('id', { mode: 'number' }).primaryKey(),
     email: varchar('email', { length: 255 }),
   });
   ```

2. **Generate migration**
   ```bash
   npm run db:generate
   ```
   This creates SQL files in `drizzle/` folder

3. **Review generated SQL**
   Check `drizzle/0000_*.sql` to verify changes

4. **Apply migration**
   ```bash
   npm run db:push
   ```

### Production Workflow

```bash
# Generate migration
npm run db:generate

# Review SQL files
cat drizzle/0000_*.sql

# Apply to production
npm run db:migrate
```

## 📁 Project Structure

```
munshi-backend/
├── drizzle/                    # Generated migrations
│   ├── 0000_initial.sql
│   ├── 0001_add_users.sql
│   └── meta/
├── drizzle.config.ts           # Drizzle configuration
├── src/
│   └── db/
│       ├── schema/             # TypeScript schema definitions
│       │   ├── core.ts         # Users, orgs, roles
│       │   ├── accounting.ts   # Ledger, journal entries
│       │   └── index.ts        # Export all schemas
│       └── mysql/
│           └── client.ts       # Drizzle database client
```

## 🎯 Schema Files

### Core Tables (`src/db/schema/core.ts`)
- ✅ `users` - Global user accounts
- ✅ `organizations` - Tenant organizations
- ✅ `roles` - RBAC roles
- ✅ `memberships` - User-org relationships

### TODO: Additional Tables
- [ ] Accounting tables (chart_of_accounts, accounts, journal_entries)
- [ ] Invoice tables (invoices, invoice_items)
- [ ] Inventory tables (products, stock_movements)
- [ ] Banking tables (bank_accounts, bank_transactions)
- [ ] GST tables (tax_rates, gst_returns)

## 🔧 Configuration

Edit `drizzle.config.ts` to change settings:

```typescript
export default {
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'munshi',
  },
} satisfies Config;
```

## 📝 Environment Variables

Required in `.env`:

```env
DATABASE_URL="mysql://root@localhost:3306/munshi"

# Or separate variables:
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=munshi
```

## 🎨 Example: Adding a New Table

1. Create schema in `src/db/schema/accounting.ts`:
   ```typescript
   export const accounts = mysqlTable('accounts', {
     id: bigint('id', { mode: 'number' }).primaryKey(),
     orgId: bigint('org_id', { mode: 'number' }).notNull(),
     name: varchar('name', { length: 255 }).notNull(),
   });
   ```

2. Export in `src/db/schema/index.ts`:
   ```typescript
   export * from './accounting.js';
   ```

3. Generate migration:
   ```bash
   npm run db:generate
   ```

4. Apply migration:
   ```bash
   npm run db:push
   ```

## 🚨 Troubleshooting

### Error: "Cannot find module 'drizzle-orm'"
```bash
npm install drizzle-orm mysql2
npm install -D drizzle-kit
```

### Error: "Database connection failed"
Check your `.env` file has correct DATABASE_URL

### Migration conflicts
```bash
# Check status
npm run db:check

# Pull current schema
npm run db:pull
```

## 📚 Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Drizzle Kit Docs](https://orm.drizzle.team/kit-docs/overview)
- [MySQL Schema Reference](https://orm.drizzle.team/docs/column-types/mysql)
