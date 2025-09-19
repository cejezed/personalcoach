# Coach App - Time Tracking & Health Dashboard

## Overview

This is a comprehensive Node.js monorepo application designed for personal coaching and business management. The application combines time tracking capabilities with health monitoring features, providing a unified dashboard for professionals to manage their work and wellness. It includes project management, time tracking, billing, health metrics tracking, and AI-powered coaching suggestions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The application follows a monorepo pattern using pnpm workspaces with clear separation of concerns:
- **Client Application**: React-based frontend with modern UI components
- **Server Application**: Express.js backend with RESTful API endpoints
- **Shared Packages**: Common types and utilities shared between client and server

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management
- **Forms**: React Hook Form with Zod validation for robust form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the stack
- **API Design**: RESTful endpoints with consistent error handling
- **Development**: Hot reloading with tsx for rapid development

### Database Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Supabase)
- **Migrations**: Drizzle Kit for schema management
- **Schema**: Comprehensive data model covering business and personal metrics

### Data Model Design
The application manages complex relationships between:
- **Business Data**: Projects, phases, tasks, time entries, invoices
- **Personal Data**: Health metrics, workouts, meals, sleep tracking
- **Billing Models**: Support for hourly, fixed, and capped billing structures
- **User Management**: Row-level security and user isolation

### Authentication & Authorization
- **Provider**: Supabase Auth for user management
- **Security**: Row-level security (RLS) policies for data isolation
- **Session Management**: Supabase handles session persistence and refresh

### UI/UX Architecture
- **Design System**: shadcn/ui components for consistent interface
- **Responsive Design**: Mobile-first approach with desktop sidebar navigation
- **Accessibility**: Built-in accessibility features from Radix UI primitives
- **Theme Support**: CSS custom properties for light/dark mode compatibility

## External Dependencies

### Core Infrastructure
- **Supabase**: Primary backend-as-a-service providing PostgreSQL database, authentication, and real-time capabilities
- **Replit**: Development and hosting platform with integrated environment

### Database & ORM
- **PostgreSQL**: Relational database for structured data storage
- **Drizzle ORM**: Type-safe database toolkit for schema management and queries
- **Supabase Client**: Official JavaScript client for Supabase integration

### Frontend Libraries
- **React Query**: Server state management and caching
- **Radix UI**: Accessible, unstyled UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Modern icon library
- **Wouter**: Minimalist routing library

### Development Tools
- **TypeScript**: Static type checking across the entire stack
- **Vite**: Fast build tool with hot module replacement
- **ESBuild**: Fast JavaScript bundler for production builds
- **TSX**: TypeScript execution engine for development

### Validation & Forms
- **Zod**: Runtime type validation and schema definition
- **React Hook Form**: Performant form library with minimal re-renders