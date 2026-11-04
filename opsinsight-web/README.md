# OpsInsight Web

The OpsInsight frontend is a React and TypeScript application that provides the user interface for the OpsInsight operations and incident management platform.

It communicates with the ASP.NET Core API to retrieve and manage application data.

## Technology

- React 19
- TypeScript
- Vite
- CSS

## Prerequisites

- Node.js
- npm
- A running instance of the OpsInsight API

## Installation

From the `opsinsight-web` directory, install the project dependencies:

```bash
npm install
```

## Environment Configuration

The frontend uses an environment variable to identify the API address.

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

On Windows PowerShell, you can use:

```powershell
Copy-Item .env.example .env.local
```

Open `.env.local` and configure the API URL:

```env
VITE_API_URL=http://localhost:5092/api
```

Replace the address with the actual API address displayed when the backend starts.

Do not commit `.env.local` or any private environment configuration.

## Running the Application

Start the development server:

```bash
npm run dev
```

Vite will display the local development address in the terminal. The default frontend address is:

```text
http://localhost:5173
```

Make sure the backend API is running before using the application.

## Available Commands

| Command | Description |
|---|---|
| `npm install` | Installs project dependencies |
| `npm run dev` | Starts the development server |
| `npm run build` | Runs TypeScript checks and builds the frontend |
| `npm run lint` | Runs ESLint |
| `npm run preview` | Previews the production build |

## Application Sections

- **Overview:** Centralised operations dashboard.
- **Services:** Service health and performance information.
- **Incidents:** Incident tracking and status management.
- **Assignments:** Incident ownership and assignment history.
- **Permissions:** User management and access permissions.

