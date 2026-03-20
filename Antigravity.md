# 🚀 Antigravity Prompt: Advanced Invoice SaaS with CRM + WhatsApp Automation

Act as a Senior SaaS Architect and Full Stack Engineer.

Build a HIGH-VALUE, PRODUCTION-READY, MULTI-ROLE INVOICE SaaS application with CRM, analytics, and WhatsApp automation.

This product must NOT be a basic invoice tool.
It must act as a **business assistant for shop owners**.

---

## 🎯 CORE GOAL

* Create GST invoices in <10 seconds
* Track payments (Paid/Unpaid)
* Automatically follow up via WhatsApp
* Manage customers (CRM)
* Provide business insights (dashboard)

---

## 🧱 TECH STACK (STRICT)

* Frontend: React.js + Tailwind CSS
* Backend: Node.js + Express.js
* Database: MongoDB (Mongoose)
* Auth: JWT-based authentication
* PDF: pdfkit (dynamic generation only)
* WhatsApp: whatsapp-web.js
* Payment: Razorpay

---

## 👥 USER ROLES

### 1. Super Admin

* View all users
* Activate / Deactivate users
* View usage stats
* Block users

---

### 2. Shop Owner (User)

* Create invoices
* Manage customers
* Track payments
* Send invoices via WhatsApp
* Configure message templates

---

## 🔐 AUTHENTICATION

* JWT-based login/register
* Role-based access:

  * "admin"
  * "user"

---

## 🗄️ DATABASE DESIGN (EXTENDED)

### Users

* name
* email
* password (hashed)
* role
* plan ("free" | "paid")
* isActive
* whatsappSession
* createdAt

---

### Customers (NEW - CRM)

* userId
* name
* phone
* totalInvoices
* totalPendingAmount
* lastTransactionDate
* createdAt

---

### Invoices

* userId
* customerId
* customerName
* customerPhone
* items [{ name, qty, price }]
* type ("gst" | "non-gst" | "estimate")
* subtotal
* gst
* finalAmount
* status ("paid" | "unpaid")
* sentOnWhatsapp
* createdAt

---

### MessageTemplates

* userId
* templateText
* createdAt

---

## 🔥 CORE FEATURES

---

### 1. Invoice Creation (Enhanced)

* Business Name
* GST Number
* Customer Name + Phone
* Invoice Type:

  * GST
  * Non-GST
  * Estimate
* Items (dynamic)

---

### 2. Auto Calculation

* Subtotal
* GST (18% if GST invoice)
* Final total

---

### 3. Payment Tracking (IMPORTANT)

* Mark invoice as:

  * Paid
  * Unpaid
* Store payment status
* Show pending amount per customer

---

### 4. Customer Management (CRM)

* Auto-create customer on invoice creation
* Maintain:

  * Total invoices
  * Total pending amount
  * Last transaction
* View customer history

---

### 5. WhatsApp Send (Core Feature)

* Checkbox: "Send via WhatsApp"
* Send invoice PDF + message

---

### 6. WhatsApp Auto Reminder System (VERY IMPORTANT)

* If invoice is unpaid:

  * Send reminder after X days (configurable)
* Use cron job / scheduler

Example:
"Reminder: Your invoice of ₹{{amount}} is still pending"

---

### 7. Message Template System

* First-time setup:
  Ask user to configure message
* Save template
* Allow editing anytime

Dynamic variables:

* {{customerName}}
* {{amount}}
* {{businessName}}

---

### 8. PDF Handling (IMPORTANT RULE)

* DO NOT store PDFs
* Store only invoice data
* Generate PDF dynamically:

  * On download
  * On WhatsApp send

---

### 9. Dashboard Analytics

Show:

* Total invoices
* Paid vs unpaid
* Total revenue
* Pending amount
* Top customers

---

## 📲 WHATSAPP MODULE

* QR-based login
* Persistent session per user
* Send PDF + message
* Auto reconnect

---

## ⚙️ BACKEND APIs

### Auth

* POST /api/auth/register
* POST /api/auth/login

### Admin

* GET /api/admin/users
* PATCH /api/admin/user/:id/toggle-active

### Invoice

* POST /api/invoice/create
* GET /api/invoice/list
* GET /api/invoice/pdf/:id
* PATCH /api/invoice/status

### Customer

* GET /api/customer/list
* GET /api/customer/:id

### WhatsApp

* GET /api/whatsapp/qr
* POST /api/whatsapp/send-invoice

### Template

* POST /api/template/save
* PUT /api/template/update

---

## 📱 FRONTEND PAGES

### Admin Panel

* User list
* Activate/Deactivate

---

### Dashboard

* Analytics cards
* Pending amount

---

### Create Invoice

* Form
* WhatsApp checkbox

---

### Invoice List

* Show:

  * Paid/Unpaid
  * Sent/Not sent

---

### Customer Page

* Customer list
* Pending amounts

---

### Template Settings

* Edit WhatsApp message

---

## 💳 PRICING LOGIC

Free:

* 5 invoices/day
* No WhatsApp
* No reminders

Paid:

* Unlimited invoices
* WhatsApp send
* Auto reminders
* CRM features

---

## ⚡ PERFORMANCE

* Fast APIs
* Async WhatsApp sending
* Background job for reminders

---

## 🚀 DEPLOYMENT

* Backend must support persistent sessions
* Use env variables:

  * Mongo URI
  * JWT Secret
  * Razorpay keys

---

## 🧠 PRODUCT POSITIONING

This is NOT an invoice tool.

This is:
👉 “Smart Billing + CRM + WhatsApp Automation SaaS”

---

## 🎯 FINAL OUTPUT

Generate:

* Full-stack working SaaS
* CRM system
* Reminder system
* WhatsApp integration
* Admin panel
* Clean UI
* Ready to deploy

Focus on:

* Real-world usability
* Business value
* Simplicity

DO NOT over-engineer.
