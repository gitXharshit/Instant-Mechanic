# 🚗 Instant Mechanic — Live Operations Dashboard

A real-time, full-stack vehicle service operations dashboard built for the Instant Mechanic internship assignment.

---

## 🌐 Live Links

| | URL |
|---|---|
| **Frontend (Vercel)** | _Deploy to Vercel — see Deployment section_ |
| **Backend (AWS)** | _Deploy to AWS EC2 — see Deployment section_ |
| **API Docs (Swagger)** | `http://<backend-url>/api/docs` |

---

## 📋 Project Overview

An operations team dashboard used daily to monitor:
- **Bookings** — Create, view, filter, sort, paginate, and update 500+ bookings
- **Mechanics** — Real-time status of 25 mechanics (Available / Busy / Off Duty)
- **Customers** — 60+ registered customers with spend history
- **Analytics** — Revenue trends, service breakdowns, booking patterns
- **Live updates** — WebSocket (Socket.io) broadcasts status changes instantly across all connected clients

---

## 🛠 Tech Stack

### Frontend
| Tech | Purpose |
|---|---|
| Next.js 14 (App Router) | React framework with SSR/SSG |
| TypeScript | Type safety throughout |
| Tailwind CSS | Utility-first styling |
| shadcn/ui (custom) | Accessible component primitives (Radix UI) |
| Recharts | Charts (Area, Bar, Pie, Line) |
| Socket.io-client | Real-time WebSocket connection |
| next-themes | Dark mode |

### Backend
| Tech | Purpose |
|---|---|
| Node.js + Express | HTTP server |
| TypeScript | Type safety |
| Prisma ORM | Database access layer |
| Socket.io | WebSocket server |
| Zod | Request validation |
| Swagger/OpenAPI | Auto-generated API docs |
| Helmet + rate-limit | Security |

### Database
| Tech | Purpose |
|---|---|
| PostgreSQL | Primary relational database |
| Prisma Migrate | Schema migrations |

### Infrastructure
| | |
|---|---|
| Frontend | Vercel |
| Backend | AWS EC2 (Free Tier) |
| Database | AWS RDS PostgreSQL (Free Tier) or Supabase |

---

## 🏗 Architecture

```
Browser (Next.js on Vercel)
    │
    ├── HTTP requests → REST API
    │                       │
    └── WebSocket ──────── Express + Socket.io (AWS EC2)
                                    │
                               Prisma ORM
                                    │
                           PostgreSQL (RDS / Supabase)
```

**Data flow for a live status update:**
1. Operations user changes booking status in the UI
2. Frontend sends `PATCH /api/bookings/:id/status`
3. Backend updates the database via Prisma
4. Backend emits `booking:updated` event via Socket.io to the `dashboard` room
5. All connected dashboards receive the event and update their UI without a page reload

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally (or use a cloud DB)

### 1. Clone & install

```bash
git clone https://github.com/yourusername/instant-mechanic-dashboard.git
cd instant-mechanic-dashboard
```

### 2. Backend

```powershell
cd backend
npm install

# Copy environment file and fill in your DB URL
Copy-Item .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/instant_mechanic?schema=public"
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

```powershell
# Push schema to DB (run each separately in PowerShell)
npm run db:push
npm run db:seed
npm run dev
```

> ⚠️ **PowerShell note:** Use `;` to chain commands, not `&&`:
> ```powershell
> npm run db:push ; npm run db:seed ; npm run dev
> ```

Backend runs on: `http://localhost:5000`  
API docs at: `http://localhost:5000/api/docs`

### 3. Frontend

```bash
cd frontend
npm install

# .env.local is already configured for local development
# NEXT_PUBLIC_API_URL=http://localhost:5000

npm run dev
```

Frontend runs on: `http://localhost:3000`

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL | `http://localhost:5000` |

---

## 📡 API Documentation

Full interactive docs available at `/api/docs` (Swagger UI).

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check + uptime |
| `GET` | `/api/dashboard` | Overview KPIs + chart data |
| `GET` | `/api/bookings` | Paginated bookings (search, filter, sort) |
| `GET` | `/api/bookings/:id` | Single booking detail |
| `PATCH` | `/api/bookings/:id/status` | Update status → triggers WebSocket event |
| `POST` | `/api/bookings` | Create new booking |
| `GET` | `/api/bookings/export/csv` | Download bookings as CSV |
| `GET` | `/api/mechanics` | Paginated mechanics list |
| `GET` | `/api/mechanics/:id` | Mechanic detail + booking history |
| `PATCH` | `/api/mechanics/:id/status` | Update mechanic availability |
| `GET` | `/api/customers` | Paginated customers with spend stats |
| `GET` | `/api/customers/:id` | Customer detail + bookings |

### Query Parameters (bookings)

```
GET /api/bookings?page=1&limit=20&search=toyota&status=PENDING&service=OIL_CHANGE&startDate=2026-01-01&endDate=2026-09-01&sortBy=scheduledAt&sortOrder=desc
```

---

## 🔄 Real-Time WebSocket Events

The backend uses Socket.io. Clients join the `dashboard` room and receive:

| Event | Payload | When |
|---|---|---|
| `booking:updated` | Updated booking object | Booking status changes |
| `booking:new` | New booking object | New booking created |
| `mechanic:updated` | Updated mechanic object | Mechanic status changes |
| `dashboard:refresh` | (empty) | Any significant data change |

**Client-side connection:**
```ts
const socket = io('http://localhost:5000');
socket.emit('join:dashboard');
socket.on('booking:updated', (booking) => { /* update UI */ });
```

---

## 🚀 Deployment

### Frontend → Vercel

```bash
# Install Vercel CLI
npm i -g vercel

cd frontend
vercel

# Set environment variable in Vercel dashboard:
# NEXT_PUBLIC_API_URL = https://your-ec2-domain.amazonaws.com
```

### Backend → AWS EC2

1. Launch an EC2 t2.micro (Free Tier) with Ubuntu 22.04
2. Open ports 22 (SSH), 5000 (API), 80, 443 on the Security Group
3. SSH into the instance and set up:

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm i -g pm2

# Clone repo
git clone https://github.com/yourusername/instant-mechanic-dashboard.git
cd instant-mechanic-dashboard/backend
npm install

# Set up .env with production DATABASE_URL
nano .env

# Run migrations and seed
npm run db:push
npm run db:seed

# Start with PM2
npm run build
pm2 start dist/index.js --name instant-mechanic-api
pm2 startup
pm2 save
```

4. (Optional) Set up Nginx as reverse proxy + SSL with Certbot for HTTPS

### Database → AWS RDS or Supabase

**Supabase (easiest free option):**
1. Create a project at [supabase.com](https://supabase.com)
2. Copy the connection string from Settings → Database
3. Set `DATABASE_URL` in your `.env`

---

## 🤖 AI Usage

This project was built using **Kiro AI** (an AI-powered development environment).

### What was AI-generated:
- Initial scaffold for Express/Prisma backend structure
- Recharts chart component code
- Seed data generation logic
- TypeScript type definitions
- Tailwind CSS class combinations for status badges/cards

### What was personally designed and verified:
- Overall architecture decisions (WebSocket pattern, API design, data model)
- Database schema design (relationships between bookings/mechanics/customers)
- Real-time event design (which events to emit, when, and what payload)
- UI/UX design decisions (sidebar layout, status color system, filter UX)
- Security choices (rate limiting, CORS, Helmet, Zod validation)
- Performance optimisations (Promise.all parallelisation in dashboard endpoint, SQL GROUP BY)
- All TypeScript errors fixed and types verified

---

## ⭐ Bonus Features Implemented

- ✅ WebSocket real-time updates (status changes broadcast live)
- ✅ Dark mode toggle
- ✅ CSV export for bookings
- ✅ Swagger/OpenAPI documentation
- ✅ API rate limiting
- ✅ Booking detail modal with inline status update
- ✅ Advanced filtering (search, status, service, date range)
- ✅ Pagination with page numbers
- ✅ Responsive sidebar (collapsible)
- ✅ Loading skeletons on all data tables/cards
- ✅ Error states
- ✅ Empty states
- ✅ Analytics page with 4 chart types

---

## 📁 Project Structure

```
instant-mechanic-dashboard/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # DB schema (Customer, Mechanic, Booking)
│   ├── src/
│   │   ├── index.ts               # Express + Socket.io server entry
│   │   ├── lib/
│   │   │   ├── prisma.ts          # Prisma client singleton
│   │   │   └── socket.ts          # Socket.io init + emit helpers
│   │   ├── middleware/
│   │   │   └── errorHandler.ts    # Global error handling
│   │   ├── routes/
│   │   │   ├── dashboard.ts       # GET /api/dashboard
│   │   │   ├── bookings.ts        # Bookings CRUD + export
│   │   │   ├── mechanics.ts       # Mechanics management
│   │   │   └── customers.ts       # Customer management
│   │   ├── swagger.ts             # OpenAPI spec config
│   │   └── seed.ts                # Realistic seed data (520+ records)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx         # Root layout (Sidebar + ThemeProvider)
│   │   │   ├── page.tsx           # Overview dashboard
│   │   │   ├── bookings/page.tsx  # Bookings table
│   │   │   ├── mechanics/page.tsx # Mechanics grid
│   │   │   ├── customers/page.tsx # Customers table
│   │   │   └── analytics/page.tsx # Analytics charts
│   │   ├── components/
│   │   │   ├── layout/            # Sidebar, Header
│   │   │   ├── dashboard/         # StatCard, StatusBadge
│   │   │   ├── bookings/          # BookingDetailModal
│   │   │   └── ui/                # shadcn/ui primitives
│   │   ├── hooks/
│   │   │   ├── useSocket.ts       # Socket.io hook
│   │   │   └── useDashboard.ts    # Dashboard data + polling
│   │   ├── lib/
│   │   │   ├── api.ts             # Typed API client
│   │   │   └── utils.ts           # Formatters, status configs
│   │   └── types/index.ts         # Shared TypeScript types
│   └── package.json
│
└── README.md
```

---

## 💡 What I'm Most Proud Of

The **real-time architecture**. When a booking status changes (Pending → Assigned → On The Way → Completed), every connected dashboard client reflects the change immediately via WebSocket — no polling, no page reload. The mechanic's status is also automatically updated in the same transaction. This mirrors how a real operations team would use the dashboard, with live visibility across multiple browser windows or devices.
