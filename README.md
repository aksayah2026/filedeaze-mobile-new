# FieldEaze Mobile

A production-ready React Native Expo architecture built with TypeScript, structured for a multi-tenant SaaS field service application.

---

## 🚀 Quick Start

Follow these steps to run the application locally:

1. **Install dependencies**:
   ```bash
   npm install
   ```
   *Note: This automatically triggers `node generate-assets.js` via the `postinstall` lifecycle hook to generate the required build-friendly asset files (`icon.png`, `splash.png`, etc.).*

2. **Start the development server**:
   ```bash
   npx expo start
   ```

3. **Check TypeScript compilation (Optional)**:
   ```bash
   npm run ts:check
   ```

---

## 🛠️ Architecture & Tech Stack

This project implements a clean, enterprise-grade architecture:

* **Expo SDK 51** (React Native 0.74.1 & React 18.2.0)
* **TypeScript** for compile-time safety and self-documenting code
* **React Navigation v6** for multi-role router stacks (Auth, Customer, and Technician)
* **TanStack React Query v5** for server state caching, mutations, and cache invalidation
* **Zustand** for lightweight, persistent global client state (Auth, User Profiles, Active Tenant)
* **React Hook Form & Zod** for schema-driven form validation and input controllers
* **Axios Client** with request/response interceptors to automatically append JWT tokens and multi-tenant code headers (`X-Tenant-Code`)

---

## 📂 Project Structure

```
filedeaze-mobile-new/
├── src/
│   ├── api/             # Axios client instance and API endpoint configurations
│   ├── assets/          # Project images, icons, and splash screens (auto-generated)
│   ├── components/      # Reusable atomic UI components (Buttons, Inputs, Cards, etc.)
│   ├── config/          # Application-level settings and Tenant branding configs
│   ├── constants/       # Global constants, storage keys, regex definitions
│   ├── hooks/           # Custom React Query hooks and custom component logic
│   ├── mock/            # Simulated database data for multi-tenant simulation
│   ├── navigation/      # Navigation Containers, Root, Auth, and Portal stacks
│   ├── screens/         # User Interface Screens (Auth, Customer, Technician)
│   ├── services/        # Service layer handling data queries with Promise delays
│   ├── store/           # Zustand global state management
│   ├── theme/           # Design System tokens & dynamic tenant theme merger hook
│   ├── types/           # Global type declarations and navigation param lists
│   ├── utils/           # Helper utility functions for formatting and string parsers
│   └── validation/      # Form schemas and validation rules (Zod)
├── App.tsx              # Main entry point importing routing and providers
├── app.json             # Expo project configuration
├── babel.config.js      # Babel presets and configurations
├── generate-assets.js   # Asset initializer script
├── package.json         # Dependencies and lifecycle scripts
└── tsconfig.json        # TypeScript configuration
```

---

## 🎨 Dynamic Multi-Tenant Theme System

Multi-tenancy styling is controlled dynamically using React hooks combined with the global state:

1. **Branding Catalog (`src/config/app.config.ts`)**: Defines tenant specifications like `tenantCode`, `appName`, `logo` URL, and `primaryColor`.
2. **Global Auth Store (`src/store/auth.store.ts`)**: Tracks the active `tenantCode` workspace identifier.
3. **Dynamic Theme Hook (`src/theme/index.ts`)**: The custom `useTheme()` hook reads the active tenant from the state, fetches the branding properties, and overrides the primary color dynamically.

*To see this in action: In the Login Screen, select the different workspace tabs (Default, Acme, Apex). You will observe all buttons, inputs, borders, and header logos instantly adapt to the brand guidelines of the selected tenant before logging in.*

---

## 🛡️ Authentication & Portal Routes

* **Unauthenticated (Auth Stack)**: Leads to the `LoginScreen`. You can select the workspace and choose whether to sign in as a **Technician** or a **Customer** (use any email and a 6-character password).
* **Technician Portal (`src/navigation/TechnicianNavigator.tsx`)**:
  * **Technician Home**: Displays list of jobs dispatched to the user under the selected tenant.
  * **Job Details**: Features check-in action (changes status to `IN_PROGRESS`), complete action (changes status to `COMPLETED`), dialer/map links, and a form to submit work notes.
* **Customer Portal (`src/navigation/CustomerNavigator.tsx`)**:
  * **Customer Home**: Displays service tickets requested by the customer.
  * **Job Details**: Shows status logs, assigned technician profiles, and notes.