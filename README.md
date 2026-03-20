# Invoice SaaS with CRM + WhatsApp Automation

A production-ready SaaS application for managing invoices, tracking payments, and automating follow-ups via WhatsApp.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Lucide Icons, React Router
- **Backend**: Node.js, Express.js, MongoDB (Mongoose)
- **Utilities**: `pdfkit` (PDF Generation), `whatsapp-web.js` (WhatsApp Automation), `node-cron` (Automated Reminders)

## Features
- **Smart Invoicing**: Create GST/Non-GST invoices in seconds.
- **CRM Integration**: Automatic customer profile creation and history tracking.
- **WhatsApp Automation**: Send PDFs directly to customers and set up automated payment reminders.
- **Dashboard**: Real-time business analytics and revenue tracking.

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or on Atlas)

### Setup
1. **Backend**:
   ```bash
   cd backend
   npm install
   # Configure .env with your MongoDB URI and JWT Secret
   npm start
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **WhatsApp**:
   - Go to Settings in the web app.
   - Click "Connect WhatsApp".
   - Scan the QR code that appears in the backend terminal logs.

## Project Structure
- `/backend`: Express server, Mongoose models, and WhatsApp/PDF utilities.
- `/frontend`: React application with Tailwind CSS and modular page components.
