# Admin Panel

Independent admin panel for Typing Master App - completely isolated from the main application.

## Overview

The admin panel is now extracted as a standalone folder (`/admin`) with its own configuration and dependencies. This allows for independent development, deployment, and management of admin functionality.

## Project Structure

```
admin/
├── src/
│   ├── components/
│   │   └── AdminPage.tsx
│   ├── lib/
│   │   └── api.ts
│   ├── admin-main.tsx
│   ├── AdminApp.tsx
│   └── index.css
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── package.json
└── README.md
```

## Setup & Installation

### 1. Install Dependencies

```bash
cd admin
npm install
```

### 2. Environment Configuration

Create a `.env` file in the admin folder:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Development

Start the dev server:

```bash
npm run dev
```

The admin panel will be available at `http://localhost:5173` (or your configured port)

### 4. Build for Production

```bash
npm run build
```

Output will be in the `admin/dist` folder

### 5. Preview Build

```bash
npm run preview
```

## Features

- **Independent Authentication**: Admin panel has its own login/signup system
- **Admin Verification**: Only users with admin role can access the panel
- **API Integration**: Connected to the main backend API at `/api`
- **Responsive UI**: Built with React, TailwindCSS, and Shadcn/UI components
- **Isolated**: Completely separate from the main app - can be deployed independently

## Usage

1. Navigate to the admin panel in your browser
2. Create an admin account or login with admin credentials
3. Access the admin dashboard for system management

**Note**: After signup, you need to manually set the user's role to 'admin' in the database.

## Tech Stack

- React 19
- TypeScript
- Vite
- TailwindCSS
- Shadcn/UI Components
- Lucide Icons
- Radix UI Primitives

## API Endpoints

The admin panel communicates with the backend API at:
- Base URL: `http://localhost:5000/api` (configurable via `VITE_API_URL`)
- Uses Bearer token authentication

## Deployment Options

Since this is an independent app, you can:

1. **Deploy Separately**: Host ad on its own domain or subdomain
2. **Same Server**: Serve alongside the main app from the same server
3. **CDN**: Deploy the static build files to a CDN
4. **Docker**: Containerize with your preferred deployment tool

## Notes

- The admin panel shares dependencies with the main app but has its own build configuration
- All imports use the `@/` alias pointing to `./src`
- The panel is completely isolated and does not depend on the main app
