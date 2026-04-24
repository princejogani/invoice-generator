# Invoice SaaS — Complete Features & Step-by-Step Usage Guide

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Setup & Installation](#4-setup--installation)
5. [Authentication & User Management](#5-authentication--user-management)
6. [Dashboard](#6-dashboard)
7. [Invoice Management](#7-invoice-management)
8. [Customer CRM](#8-customer-crm)
9. [Product Catalog](#9-product-catalog)
10. [WhatsApp Automation](#10-whatsapp-automation)
11. [UPI Payment Integration](#11-upi-payment-integration)
12. [Customer Portal](#12-customer-portal)
13. [PDF Generation](#13-pdf-generation)
14. [AI Background Agents (StepFun)](#14-ai-background-agents-stepfun)
15. [Automated Payment Reminders (Cron)](#15-automated-payment-reminders-cron)
16. [Settings](#16-settings)
17. [Admin Panel](#17-admin-panel)
18. [Staff / Team Management](#18-staff--team-management)
19. [Plans & Limits](#19-plans--limits)
20. [API Reference](#20-api-reference)
21. [Environment Variables](#21-environment-variables)
22. [Deployment](#22-deployment)

---

## 1. Project Overview

A production-ready **Invoice SaaS** platform that lets businesses:
- Create GST / Non-GST invoices in seconds
- Auto-create and track customer profiles (CRM)
- Send invoices as PDF via WhatsApp
- Accept UPI payments with a shareable payment link
- Automate payment reminders
- Get AI-powered business insights

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS, Lucide Icons, React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| PDF | pdfkit |
| WhatsApp | whatsapp-web.js (separate microservice) |
| Scheduler | node-cron |
| AI | StepFun Step 3.5 Flash via OpenRouter |
| Auth | JWT (30-day tokens) |

---

## 3. Project Structure

```
invoice-generator/
├── backend/                  # Express API server
│   ├── agents/               # AI background agents
│   │   ├── stepfunAgent.js   # StepFun AI model wrapper
│   │   └── agentCron.js      # Scheduled AI tasks
│   ├── controllers/          # Route handlers
│   │   ├── authController.js
│   │   ├── invoiceController.js
│   │   ├── customerController.js
│   │   ├── productController.js
│   │   └── publicController.js
│   ├── middleware/
│   │   └── authMiddleware.js # JWT protect + role guard
│   ├── models/               # Mongoose schemas
│   │   ├── User.js
│   │   ├── Invoice.js
│   │   ├── Customer.js
│   │   ├── Product.js
│   │   └── MessageTemplate.js
│   ├── routes/               # Express routers
│   ├── utils/
│   │   ├── pdfUtils.js       # PDF generation
│   │   ├── whatsappUtils.js  # WhatsApp microservice client
│   │   ├── reminderCron.js   # Daily reminder scheduler
│   │   ├── upiUtils.js       # UPI payment token generator
│   │   ├── fileUpload.js     # Base64 image → file saver
│   │   └── db.js             # MongoDB connection
│   ├── uploads/logos/        # Uploaded business logos
│   └── server.js             # App entry point
├── frontend/                 # React SPA
│   └── src/
│       ├── pages/            # All page components
│       ├── components/       # Shared components (Navbar)
│       ├── context/          # AuthContext (global auth state)
│       └── api.js            # Axios instance with base URL
└── whatsapp-service/         # Standalone WhatsApp microservice
```

---

## 4. Setup & Installation

### Step 1 — Clone & Install Dependencies

```bash
# Root dependencies (concurrently)
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
cd ..
```

### Step 2 — Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/invoice-saas
JWT_SECRET=your_super_secret_key_here
PORT=5000
BASE_URL=http://localhost:5000

# WhatsApp microservice
WHATSAPP_SERVICE_URL=http://localhost:3001
SERVICE_SECRET=your_service_secret

# AI Agents (optional)
STEPFUN_API_KEY=your_openrouter_api_key
STEPFUN_BASE_URL=https://openrouter.ai/api/v1
STEPFUN_MODEL=stepfun/step-3.5-flash:free
ENABLE_BACKGROUND_AGENTS=true
```

### Step 3 — Configure Frontend Environment

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### Step 4 — Run Development Servers

```bash
# From root — runs both backend (port 5000) + frontend (port 5173)
npm run dev

# Or separately:
npm run dev:backend    # Backend only with nodemon
npm run dev:frontend   # Frontend only with Vite
```

### Step 5 — Production Build

```bash
npm run build    # Builds frontend
npm start        # Starts backend + frontend preview
```

---

## 5. Authentication & User Management

### How It Works

- Users **register** → account is set to `pending` status
- An **admin must approve** the account before the user can log in
- JWT tokens are valid for **30 days**
- Three roles: `admin`, `user` (business owner), `staff`

### Step-by-Step: Register a New Account

1. Go to `/register`
2. Fill in: Name, Email, Password, Business Name, GSTIN (optional), Address, Phone
3. Submit → you'll see: *"Registration successful! Your account is pending admin approval."*
4. Wait for admin to approve your account
5. Once approved, go to `/login` and sign in

### Step-by-Step: Login

1. Go to `/login`
2. Enter Email and Password
3. On success → redirected to `/dashboard`
4. Token is stored in `localStorage` and auto-attached to all API requests

### Account Statuses

| Status | Meaning |
|---|---|
| `pending` | Registered, awaiting admin approval |
| `active` | Approved, can log in |
| `suspended` | Blocked by admin |

---

## 6. Dashboard

**Route:** `/dashboard`

The dashboard shows real-time business analytics pulled from your invoices.

### What You See

| Card | Description |
|---|---|
| Total Invoices | Count of all non-draft invoices |
| Paid Amount | Sum of all paid invoices |
| Pending Amount | Sum of all unpaid invoices |
| Total Customers | Unique customer count |
| Monthly Revenue Chart | Bar chart — last 6 months revenue |
| Top Customers | Top 5 customers by total invoiced amount |
| Invoice Status Breakdown | Paid / Unpaid / Partial counts |

### Step-by-Step: Read the Dashboard

1. Log in → you land on `/dashboard` automatically
2. The stats cards update in real time from your invoice data
3. Scroll down to see the **Monthly Revenue** bar chart
4. Check **Top Customers** to see who owes the most or buys the most

---

## 7. Invoice Management

**Route:** `/invoices`

### Create an Invoice — Step by Step

1. Click **"New Invoice"** button (top right of invoice list)
2. You land on `/create-invoice`
3. **Select or type customer name** — if the customer exists, their phone auto-fills
4. **Enter customer phone** (used for WhatsApp)
5. **Choose invoice type:** GST or Non-GST
6. **Add line items:**
   - Click "Add Item"
   - Type product name (or pick from product catalog)
   - Enter quantity and unit price
   - Tax rate auto-fills if picked from catalog
7. **GST:** If GST invoice, enter GST % (e.g. 18) — GST amount auto-calculates
8. **Adjustments:** Add discounts or extra charges (fixed ₹ or %)
   - Click "Add Adjustment"
   - Label it (e.g. "Discount", "Delivery")
   - Choose Add or Subtract
   - Enter value and type (fixed/percent)
9. **Final Amount** auto-calculates
10. Choose **Save as Draft** or **Create Invoice**
11. After creation, you can:
    - **Send on WhatsApp** (sends PDF + message)
    - **Download PDF**
    - **Mark as Paid**

### Invoice Statuses

| Status | Meaning |
|---|---|
| `unpaid` | Default on creation |
| `partial` | Some payment recorded |
| `paid` | Fully paid |
| Draft | Not finalized, not counted in stats |

### Update Invoice Status — Step by Step

1. Go to `/invoices`
2. Find the invoice in the list
3. Click the status badge or the **"Mark Paid"** button
4. Status updates instantly; customer's pending amount updates automatically

### Record a Partial Payment — Step by Step

1. Open an invoice
2. Click **"Record Payment"**
3. Enter amount paid and payment method (Cash, UPI, Bank Transfer, etc.)
4. Click Save
5. Invoice status auto-changes to `partial` or `paid` based on total paid

### Convert Draft to Final Invoice — Step by Step

1. Go to `/invoices` → filter by **Drafts**
2. Click on a draft invoice
3. Click **"Finalize Invoice"**
4. Optionally check **"Send on WhatsApp"**
5. Click Confirm → invoice is now live and counted in stats

### Export Invoices as CSV — Step by Step

1. Go to `/invoices`
2. Click **"Export CSV"** button
3. Optionally set a date range
4. A `.csv` file downloads with columns: Date, InvoiceNo, Customer, Phone, Type, Subtotal, GST, Adjustment, FinalAmount, Status

---

## 8. Customer CRM

**Route:** `/customers`

Customers are **auto-created** when you create an invoice with a new phone number. No manual entry needed.

### What's Tracked Per Customer

- Name & Phone
- Total invoices count
- Total pending amount
- Last transaction date
- Portal token (for customer self-service portal)

### Step-by-Step: View a Customer

1. Go to `/customers`
2. Search by name or phone
3. Click on a customer row
4. See their full invoice history, total spent, and pending amount

### Step-by-Step: Edit a Customer

1. Go to `/customers`
2. Click the edit icon on a customer row
3. Update Name or Phone
4. Click Save
   - Note: Phone must be unique per business account

### Step-by-Step: Send Customer Portal Link

1. Go to `/customers`
2. Click the **"Portal Link"** icon on a customer
3. Copy the generated link
4. Send it to the customer via WhatsApp or SMS
5. Customer can view all their invoices at that link without logging in

---

## 9. Product Catalog

**Route:** `/products`

Save your frequently used products/services so you can add them to invoices with one click.

### Step-by-Step: Add a Product

1. Go to `/products`
2. Click **"Add Product"**
3. Fill in:
   - **Name** (required)
   - **Price** (required)
   - Description
   - Unit (pcs, kg, hrs, etc.)
   - Tax Rate % (auto-applies when added to invoice)
   - SKU (optional)
   - Category (optional)
4. Click **Save**

### Step-by-Step: Use a Product in an Invoice

1. Go to **Create Invoice**
2. In the line items section, click the product search/dropdown
3. Select a product → Name, Price, and Tax Rate auto-fill
4. Adjust quantity as needed

### Step-by-Step: Edit or Delete a Product

1. Go to `/products`
2. Click the edit (pencil) icon → update fields → Save
3. Click the delete (trash) icon → confirm deletion

---

## 10. WhatsApp Automation

**Route:** Settings → WhatsApp tab

WhatsApp is powered by a **separate microservice** (`whatsapp-service/`) using `whatsapp-web.js`.

### Step-by-Step: Connect WhatsApp

1. Go to **Settings** → **WhatsApp** tab
2. Click **"Connect WhatsApp"**
3. A QR code appears in the backend terminal logs
4. Open WhatsApp on your phone → **Linked Devices** → **Link a Device**
5. Scan the QR code
6. Status changes to **"Connected"**
7. Your WhatsApp is now linked and can send messages

### Step-by-Step: Send Invoice via WhatsApp

1. Create or open an invoice
2. Click **"Send on WhatsApp"**
3. The system:
   - Generates a PDF of the invoice
   - Sends the PDF + a text message to the customer's phone
   - Marks the invoice as `sentOnWhatsapp: true`

### Step-by-Step: Customize WhatsApp Message Template

1. Go to **Settings** → **WhatsApp** tab
2. Edit the message template using these placeholders:
   - `{{customerName}}` — customer's name
   - `{{amount}}` — invoice total
   - `{{businessName}}` — your business name
   - `{{invoiceNo}}` — invoice number
   - `{{paymentLink}}` — your UPI ID
3. Click **Save Template**

**Example template:**
```
Hello {{customerName}}, your invoice {{invoiceNo}} for {{amount}} from {{businessName}} is ready.
Pay via UPI: {{paymentLink}}
```

---

## 11. UPI Payment Integration

Every invoice gets a **unique UPI payment token** on creation. This enables a shareable payment page.

### Step-by-Step: Set Up UPI

1. Go to **Settings** → **Profile** tab
2. Enter your **UPI ID** (e.g. `yourname@upi`)
3. Click Save
4. UPI ID now appears in all invoice PDFs and WhatsApp messages

### Step-by-Step: Customer Pays via UPI Link

1. Customer receives WhatsApp message with invoice
2. Message includes UPI ID and invoice amount
3. Customer opens their UPI app (PhonePe / GPay / Paytm)
4. Pays the amount using the UPI ID
5. Customer clicks **"I Have Paid"** on the payment page (`/pay/:token`)
6. System flags the invoice as `upiClaimedAt` and notifies the business owner on WhatsApp

### Step-by-Step: Business Owner Verifies UPI Payment

1. Receive WhatsApp notification: *"Customer X has claimed UPI payment of ₹Y"*
2. Check your UPI app / bank statement to confirm
3. Go to the invoice in the dashboard
4. Click **"Verify & Confirm Payment"**
5. Invoice status changes to `paid`
6. Customer receives a WhatsApp confirmation: *"Payment Received & Verified!"*

---

## 12. Customer Portal

**Public Route:** `/portal/:token`

A public, no-login page where customers can view all their invoices with your business.

### What Customers See

- Business name, logo, address, phone
- All their invoices (date, amount, status)
- Payment status for each invoice
- "I Have Paid" button for UPI payment claims

### Step-by-Step: Share Portal with Customer

1. Go to `/customers`
2. Find the customer
3. Click the **"Share Portal"** button
4. Copy the link (format: `https://yourdomain.com/portal/TOKEN`)
5. Send to customer via WhatsApp, SMS, or email

---

## 13. PDF Generation

Invoices are generated as professional PDFs using `pdfkit`.

### What's Included in the PDF

- Business logo, name, tagline, address, phone
- GSTIN (if applicable)
- Invoice number, date
- Customer name and phone
- Line items table (name, qty, rate, amount)
- Subtotal, GST breakdown, adjustments
- Final amount
- Bank details (bank name, account number, IFSC)
- UPI ID
- Invoice status (PAID / UNPAID stamp)

### Step-by-Step: Download Invoice PDF

1. Go to `/invoices`
2. Click on any invoice
3. Click **"Download PDF"**
4. PDF downloads to your device

### Step-by-Step: Customize Invoice Appearance

1. Go to **Settings** → **Invoice** tab
2. Customize:
   - Primary / Secondary / Accent colors
   - Font size
   - Logo size and position (left / center / right)
   - Layout style
3. Click **Save**
4. All future PDFs use the new design

---

## 14. AI Background Agents (StepFun)

Powered by **StepFun Step 3.5 Flash** model via OpenRouter API.

### Available AI Features

| Agent Task | Schedule | What It Does |
|---|---|---|
| Invoice Pattern Analysis | Daily at 2 AM | Analyzes invoice patterns per customer, flags risky accounts |
| Payment Probability Prediction | Every 6 hours | Predicts likelihood of payment for unpaid invoices |
| Personalized Reminder Generation | Daily at 10 AM | Generates custom WhatsApp reminder messages |
| Weekly Business Insights | Monday at 3 AM | Summarizes weekly revenue, top customers, recommendations |

### Step-by-Step: Enable AI Agents

1. Get a free API key from [OpenRouter](https://openrouter.ai/)
2. Add to `backend/.env`:
   ```env
   STEPFUN_API_KEY=sk-or-v1-your-key-here
   STEPFUN_BASE_URL=https://openrouter.ai/api/v1
   STEPFUN_MODEL=stepfun/step-3.5-flash:free
   ENABLE_BACKGROUND_AGENTS=true
   ```
3. Restart the backend server
4. Agents run automatically on their schedules

### Step-by-Step: Trigger AI Analysis Manually (via API)

```bash
# Analyze invoice patterns
GET /api/agents/analyze

# Get payment predictions
GET /api/agents/predict

# Generate reminder messages
GET /api/agents/reminders

# Get weekly insights
GET /api/agents/insights
```

> If `STEPFUN_API_KEY` is not set, agents run in **mock mode** and return sample responses.

---

## 15. Automated Payment Reminders (Cron)

**File:** `backend/utils/reminderCron.js`

### How It Works

- Runs **every day at 10:00 AM**
- Finds all `unpaid` invoices
- For each invoice belonging to a **paid plan** user:
  - Sends a WhatsApp reminder to the customer
  - Message: *"Reminder: Your invoice of INR [amount] is still pending."*

### Step-by-Step: Enable Reminders

1. Connect WhatsApp (see Section 10)
2. Upgrade to **paid plan** (reminders only run for paid plan users)
3. Reminders run automatically — no action needed

---

## 16. Settings

**Route:** `/settings`

Settings has 4 tabs:

### Profile Tab
- Update: Name, Email, Password
- Business: Business Name, Tagline, GSTIN, Address, Phone
- Banking: Bank Name, Account Number, IFSC Code, UPI ID
- Logo: Upload business logo (shown on PDFs and portal)

### Invoice Tab
- Customize invoice PDF appearance:
  - Colors (primary, secondary, accent, background, border)
  - Font sizes
  - Logo size and position
  - Layout style

### WhatsApp Tab
- Connect / disconnect WhatsApp
- View connection status
- Edit message template with placeholders

### Team Tab
- Create staff accounts
- View all staff members
- Delete staff accounts

---

## 17. Admin Panel

**Routes:** `/admin/users`, `/admin/users/create`, `/admin/users/:id/edit`

Only accessible to users with `role: admin`.

### Admin Capabilities

| Action | How |
|---|---|
| View all users | `/admin/users` — paginated list with search |
| Approve pending user | Click "Approve" on a pending user |
| Suspend / Unsuspend user | Click "Suspend" toggle |
| Toggle plan (free ↔ paid) | Click "Toggle Plan" |
| Create user directly | `/admin/users/create` — user is immediately active |
| Edit any user | `/admin/users/:id/edit` — update all fields including logo |
| Impersonate user | Click "Login As" — get a token for that user |
| View invoice count | Shown in user list |

### Step-by-Step: Approve a New User

1. Log in as admin
2. Go to `/admin/users`
3. Filter by **Status: Pending**
4. Click **"Approve"** next to the user
5. User can now log in

### Step-by-Step: Create a User as Admin

1. Go to `/admin/users/create`
2. Fill in all business details
3. Click **Create User**
4. User is created with `status: active` — no approval needed

---

## 18. Staff / Team Management

**Route:** Settings → Team tab

Business owners can create staff accounts that share the same business data.

### Step-by-Step: Add a Staff Member

1. Go to **Settings** → **Team** tab
2. Click **"Add Staff Member"**
3. Enter: Name, Email, Password
4. Click Create
5. Staff member can now log in and create invoices under your business

### Staff Permissions

- Staff can create and manage invoices
- Staff **cannot** change business settings, logo, or bank details
- Staff accounts are linked to the owner via `parentUserId`

### Step-by-Step: Remove a Staff Member

1. Go to **Settings** → **Team** tab
2. Find the staff member
3. Click the **Delete** (trash) icon
4. Confirm deletion

---

## 19. Plans & Limits

| Feature | Free Plan | Paid Plan |
|---|---|---|
| Invoices per day | 5 | Unlimited |
| Draft invoices | Unlimited | Unlimited |
| WhatsApp sending | Manual only | Manual + Auto reminders |
| Automated reminders | ❌ | ✅ |
| AI agents | ✅ (mock) | ✅ (real) |
| Customer portal | ✅ | ✅ |
| PDF download | ✅ | ✅ |
| CSV export | ✅ | ✅ |

### Step-by-Step: Upgrade to Paid Plan

1. Contact admin or use the admin panel
2. Admin goes to `/admin/users`
3. Finds your account
4. Clicks **"Toggle Plan"** → switches from `free` to `paid`

---

## 20. API Reference

All API routes are prefixed with `/api`.

### Auth Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login, get JWT token |
| GET | `/profile` | Private | Get current user profile |
| PUT | `/profile` | Private | Update profile & business info |
| POST | `/staff` | Private (User) | Create staff account |
| GET | `/staff` | Private (User) | List staff members |
| DELETE | `/staff/:id` | Private (User) | Delete staff member |
| GET | `/users` | Private (Admin) | List all users |
| POST | `/create-user` | Private (Admin) | Admin create user |
| GET | `/user/:id` | Private (Admin) | Get user by ID |
| PUT | `/user/:id` | Private (Admin) | Update any user |
| PATCH | `/user/:id/approve` | Private (Admin) | Approve pending user |
| PATCH | `/user/:id/suspend` | Private (Admin) | Toggle suspend |
| PATCH | `/user/:id/plan` | Private (Admin) | Toggle free/paid plan |
| GET | `/impersonate/:id` | Private (Admin) | Get token for user |

### Invoice Routes (`/api/invoice`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/create` | Private | Create invoice |
| GET | `/list` | Private | List invoices (paginated) |
| PATCH | `/status` | Private | Update invoice status |
| PUT | `/update` | Private | Edit invoice details |
| PATCH | `/convert-draft` | Private | Convert draft to final |
| POST | `/payment` | Private | Record a payment |
| POST | `/verify-upi-payment` | Private | Verify UPI payment claim |
| GET | `/:id/payments` | Private | Get payment history |
| GET | `/stats` | Private | Dashboard statistics |
| GET | `/export` | Private | Export CSV |

### Customer Routes (`/api/customer`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/list` | Private | List customers (paginated) |
| GET | `/:id` | Private | Get customer by ID |
| PUT | `/:id` | Private | Update customer |

### Product Routes (`/api/product`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/list` | Private | List products (paginated) |
| GET | `/dropdown` | Private | Products for invoice dropdown |
| GET | `/:id` | Private | Get product by ID |
| POST | `/create` | Private | Create product |
| PUT | `/:id` | Private | Update product |
| DELETE | `/:id` | Private | Delete product |

### WhatsApp Routes (`/api/whatsapp`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/init` | Private | Initialize WhatsApp session |
| GET | `/status` | Private | Get connection status |
| POST | `/send` | Private | Send message + PDF |

### Public Routes (`/api/public`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/portal/:token` | Public | Customer portal data |
| GET | `/payment/:token` | Public | UPI payment page data |
| POST | `/payment/:token/confirm` | Public | Customer claims payment |

---

## 21. Environment Variables

### Backend (`backend/.env`)

```env
# Database
MONGO_URI=mongodb://localhost:27017/invoice-saas

# Auth
JWT_SECRET=your_jwt_secret_min_32_chars

# Server
PORT=5000
BASE_URL=https://yourdomain.com        # No trailing slash, no port on production

# WhatsApp Microservice
WHATSAPP_SERVICE_URL=http://localhost:3001
SERVICE_SECRET=shared_secret_between_backend_and_wa_service

# AI Agents (optional)
STEPFUN_API_KEY=sk-or-v1-your-openrouter-key
STEPFUN_BASE_URL=https://openrouter.ai/api/v1
STEPFUN_MODEL=stepfun/step-3.5-flash:free
ENABLE_BACKGROUND_AGENTS=true
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=https://yourdomain.com/api
```

> **Production note:** `BASE_URL` must NOT include the Node.js port (e.g. `:5000` or `:10000`). Set it to your domain only: `https://api.yourdomain.com`

---

## 22. Deployment

### Backend (Node.js)

```bash
cd backend
npm install --production
node server.js
# Or with PM2:
pm2 start server.js --name invoice-backend
```

### Frontend (Static)

```bash
cd frontend
npm run build
# Serve the dist/ folder with Nginx or any static host
```

### WhatsApp Microservice

```bash
cd whatsapp-service
npm install
node server.js
# Or with PM2:
pm2 start server.js --name whatsapp-service
```

### Nginx Reverse Proxy (Example)

```nginx
# API
location /api {
    proxy_pass http://localhost:5000;
}

# Uploaded files (logos)
location /uploads {
    proxy_pass http://localhost:5000;
}

# Frontend
location / {
    root /var/www/invoice-frontend/dist;
    try_files $uri /index.html;
}
```

> With Nginx as reverse proxy, your `BASE_URL` in `.env` should be `https://api.yourdomain.com` — **without** the `:5000` port.

---

*Generated from source code analysis of the Invoice SaaS project.*
