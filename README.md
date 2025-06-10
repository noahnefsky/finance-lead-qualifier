# Finance Lead Qualifier

## Overview
Finance Lead Qualifier is an innovative solution designed to streamline the sales qualification process for financial products. This application helps sales professionals efficiently qualify leads by automating the initial screening process, scoring leads based on various criteria, and providing detailed insights to prioritize follow-ups.

### Key Features
- Automated lead qualification calling
- AI-powered call analysis and scoring
- Detailed lead insights and summaries

## Technology Stack

### Frontend
- React with TypeScript
- Material-UI (MUI) for modern, responsive UI components
- Vite for fast development and building

### Backend
- Node.js with TypeScript
- RESTful API architecture
- Mock data services for development run locally

### External Services
- Bland AI for call handling
- OpenAI (gpt-4o-mini) for:
  - Call scoring
  - Transcript summarization
  - Transcript cleaning

## Project Structure

### Frontend Pages
1. **Batches Page**
   - Overview of all lead batches
   - Batch status and metrics
   - Quick actions for batch management

2. **Leads Page**
   - Comprehensive list of all leads
   - Lead status and scoring
   - Filtering and sorting capabilities

3. **Batch Detail Page**
   - Detailed view of individual batches
   - Lead list within the batch
   - Batch-specific metrics and actions

### Backend API Endpoints

#### Lead Management
- `GET /api/leads` - Retrieve all leads
- `GET /api/leads/:id` - Get specific lead details
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead information

#### Batch Operations
- `GET /api/batches` - List all batches
- `GET /api/batches/:id` - Get batch details
- `POST /api/batches` - Create new batch
- `PUT /api/batches/:id` - Update batch information

#### Call Processing
- `POST /api/calls/start` - Initiate new call
- `GET /api/calls/:id` - Get call details
- `POST /api/calls/:id/analyze` - Analyze call with AI


## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key
- Bland AI API credentials

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd finance-lead-qualifier
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
```

4. Set up environment variables:
Create `.env` files in both root and backend directories with necessary API keys and configuration.

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```