# 🛍️ NeuraShop — Full-Stack AI-Powered E-Commerce Platform

A production-grade, end-to-end full-stack e-commerce web application featuring role-based access control (RBAC), real-time inventory management, atomic checkout, an admin business intelligence dashboard, and an integrated conversational AI shopping advisor.

---

## 🌐 Live Deployments & Links

- **Live Storefront & Admin Portal:** [https://neurashop-global.vercel.app](https://neurashop-global.vercel.app)
- **Interactive OpenAPI/Swagger Documentation:** [https://neurashop-backend.onrender.com/docs](https://neurashop-backend.onrender.com/docs)
- **Backend API Base URL:** [https://neurashop-backend.onrender.com](https://neurashop-backend.onrender.com)
- **GitHub Repository:** [https://github.com/nishajbabu/ecommerce-platform](https://github.com/nishajbabu/ecommerce-platform)

---

## 🏗️ System Architecture

```text
                       ┌───────────────────────────────┐
                       │   Client (Customer / Admin)   │
                       └───────────────┬───────────────┘
                                       │ HTTPS
                                       ▼
                       ┌───────────────────────────────┐
                       │   Next.js 16 (App Router)     │
                       │   Tailwind CSS / React 19     │
                       │   (Hosted on Vercel Edge)     │
                       └───────────────┬───────────────┘
                                       │ REST APIs / JWT (Bearer)
                                       ▼
                       ┌───────────────────────────────┐
                       │      FastAPI Python API       │
                       │   Pydantic V2 / SQLAlchemy    │
                       │   (Hosted on Render Cloud)    │
                       └───────┬───────────────┬───────┘
                               │               │
                     SQL Query │               │ Context Injection
                               ▼               ▼
      ┌─────────────────────────────────┐   ┌───────────────────────────────┐
      │   Neon Serverless PostgreSQL    │   │   Groq LPU Inference Engine   │
      │   (AWS Asia Pacific / Relational)│  │   (Llama-3 Shopping Advisor)  │
      └─────────────────────────────────┘   └───────────────────────────────┘
```

---

## 🚀 Key Features

### 1. 🛒 Customer Storefront

- **Dynamic Catalog:** Browse products categorized into real-time taxonomy filters.
- **Instant Search:** Keyword search querying product titles and descriptions.
- **Product Details:** Dedicated dynamic pages (`/products/[id]`) with live stock counters, high-resolution imagery, and warranty information.
- **Shopping Cart Engine:** Add, update quantity, and remove items with dynamic subtotal calculations.
- **Atomic Checkout:** Stock validation and inventory deduction executed in isolated database transactions to prevent overselling.
- **Shipment Tracking:** Dedicated customer `/orders` dashboard with visual status trackers (`Pending`, `Processing`, `Shipped`, `Delivered`).

### 2. 📊 Admin Operations Center

- **Business Intelligence Analytics:** Live calculation of Total Revenue (SQL `SUM`), Total Orders, Active Catalog, and Registered Customers.
- **Low-Stock Alert System:** Automated alerts when warehouse inventory falls below 5 units.
- **Inventory Management:** Full CRUD interface to create, categorize, price, and soft-delete products.
- **Category Control:** Create and manage product taxonomies dynamically.
- **Fulfillment Pipeline:** Process customer orders and update statuses across the lifecycle.
- **Customer Directory:** View registered customers and account creation dates.

### 3. 🤖 AI Conversational Shopping Advisor

- **Warehouse-Aware In-Context RAG:** Directly queries live database inventory and injects context into Meta's Llama-3 model running on Groq LPUs.
- **Sub-400ms Latency:** High-speed conversational recommendations.
- **Strict Anti-Hallucination Boundaries:** Recommends only in-stock items with exact pricing and enforces user privacy boundaries.

---

## 🗄️ Relational Database Schema

The database is built on **PostgreSQL** using **SQLAlchemy 2.0 ORM**:

```text
 users (id, full_name, email, hashed_password, role, is_active, created_at)
   ├── 1:M ──► orders (id, user_id, total_amount, status, shipping_address, created_at)
   │             └── 1:M ──► order_items (id, order_id, product_id, quantity, price_at_purchase)
   └── 1:M ──► cart_items (id, user_id, product_id, quantity)

 categories (id, name, description)
   └── 1:M ──► products (id, category_id, title, description, price, stock_quantity, image_url, is_active, created_at)
```

---

## 🔐 Security & Role-Based Access Control (RBAC)

- **Password Encryption:** Passwords hashed with salted `bcrypt`.
- **Stateless Tokens:** Signed JWT access tokens with 24-hour expiration (`HS256`).
- **Dependency Bouncers:** Reusable FastAPI dependencies (`get_current_user` and `get_current_admin`) guard sensitive routes at the framework level.
- **Session Auto-Interceptor:** Client-side fetch wrapper detects expired 401 sessions and redirects securely without UI freezes.

---

## 🧪 Testing & Verification

Comprehensive automated test suite using `pytest` and `httpx`:

- Authentication lifecycle (Register, Login, Token generation).
- Product search, filtering, and pagination.
- Cart additions, price calculations, and stock deductions.
- Admin analytics aggregation validation.

```bash
cd backend
pytest
# Result: 8 passed in 2.15s (100% success rate, 0 warnings)
```

Frontend production compiler verification:

```bash
cd frontend
npm run build
# Result: All 9 dynamic/static routes compiled cleanly via Next.js Turbopack
```

---

## 🛠️ Tech Stack Breakdown

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS, Lucide Icons
- **Backend:** Python 3, FastAPI, Pydantic V2, SQLAlchemy 2.0, Uvicorn
- **Database:** PostgreSQL (Neon Serverless)
- **AI/LLM:** Groq LPU API (`llama-3.1-8b-instant` / `allam-2-7b`)
- **Authentication:** JWT (JSON Web Tokens) + Bcrypt
- **Deployment:** Vercel (Frontend Edge) + Render (Backend Web Service)
