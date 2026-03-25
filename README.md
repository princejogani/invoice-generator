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
- **AI-Powered Background Agents**: StepFun Step 3.5 Flash model for intelligent automation:
  - Invoice pattern analysis and insights
  - Payment probability prediction
  - Personalized reminder message generation
  - Weekly business insights and recommendations

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or on Atlas)

### Setup
1. **Install Dependencies**:
   ```bash
   # Install root dependencies (concurrently)
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   cd ..
   ```

2. **Configure Environment**:
   - Backend: Copy `.env.example` to `.env` in `/backend` and configure with your MongoDB URI and JWT Secret.

3. **Configure StepFun AI Agents (Optional)**:
   - Get a free API key from [OpenRouter](https://openrouter.ai/) for StepFun Step 3.5 Flash model
   - Add the following to your `.env` file:
     ```
     STEPFUN_API_KEY=your_openrouter_api_key_here
     STEPFUN_BASE_URL=https://openrouter.ai/api/v1
     STEPFUN_MODEL=stepfun/step-3.5-flash:free
     ENABLE_BACKGROUND_AGENTS=true
     ```
   - Background agents will automatically run:
     - Daily invoice analysis (2 AM)
     - Payment prediction updates (every 6 hours)
     - Customer communication optimization (10 AM daily)
     - Weekly business insights (Monday 3 AM)

4. **Run Development Servers**:
   You can run both backend and frontend simultaneously using:
   ```bash
   npm run dev
   ```
   This uses `concurrently` to start:
   - Backend with `nodemon` on port 5000 (auto-restart on changes)
   - Frontend with `vite` on port 5173

   Alternatively, run them separately:
   ```bash
   # Backend only (with nodemon)
   npm run dev:backend
   
   # Frontend only
   npm run dev:frontend
   ```

4. **Production Build**:
   ```bash
   npm run build        # Build frontend
   npm start           # Start both servers (backend + frontend preview)
   ```

5. **WhatsApp**:
   - Go to Settings in the web app.
   - Click "Connect WhatsApp".
   - Scan the QR code that appears in the backend terminal logs.

## Project Structure
- `/backend`: Express server, Mongoose models, WhatsApp/PDF utilities, and AI agents.
  - `/agents`: StepFun AI background agents for invoice analysis, payment prediction, and customer communication.
- `/frontend`: React application with Tailwind CSS and modular page components.
