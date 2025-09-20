# Norwegian Sermon Browser

## Overview

A Norwegian sermon browsing application that allows users to search, filter, and listen to sermons online. The application features a clean, content-focused interface with comprehensive search capabilities, advanced filtering options, and an integrated audio player. Built with modern web technologies, it provides a seamless experience for discovering and consuming sermon content in Norwegian.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a **React-based Single Page Application (SPA)** architecture with TypeScript for type safety. The component structure follows a modular design pattern with reusable UI components built on shadcn/ui and Radix UI primitives.

**Key Frontend Decisions:**
- **React Router Alternative**: Uses Wouter for lightweight client-side routing
- **State Management**: React hooks for local state, TanStack Query for server state management
- **Styling**: Tailwind CSS with custom design system based on Norwegian design guidelines
- **Component Library**: shadcn/ui components with Radix UI primitives for accessibility
- **Theme System**: Built-in light/dark mode support with CSS custom properties

### Backend Architecture
The application uses an **Express.js REST API** architecture with TypeScript support. The backend follows a layered architecture pattern with clear separation between routes, business logic, and data access.

**Key Backend Decisions:**
- **Runtime**: Node.js with ES modules
- **Framework**: Express.js for HTTP server and API routes
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Storage Interface**: Abstracted storage layer supporting both in-memory and database implementations
- **Development**: Vite integration for hot module replacement in development

### Data Storage Solutions
The application uses **PostgreSQL** as the primary database with Drizzle ORM for type-safe database operations and migrations.

**Key Data Decisions:**
- **Database**: PostgreSQL for production with Neon serverless support
- **ORM**: Drizzle ORM for schema definition and type-safe queries
- **Migrations**: Drizzle Kit for database schema migrations
- **Fallback**: In-memory storage for development and testing

### Authentication and Authorization
Currently implements a **basic user system** with username/password authentication. The schema supports user management but authentication middleware is not yet implemented.

**Key Auth Decisions:**
- **User Schema**: Simple username/password model with UUID primary keys
- **Session Management**: Prepared for Express sessions with PostgreSQL store
- **Security**: Ready for bcrypt password hashing and session-based auth

### Component Design System
The application follows **Norwegian design guidelines** with a content-focused approach inspired by media platforms like Spotify and YouTube.

**Key Design Decisions:**
- **Typography**: Inter for body text, Georgia for sermon titles
- **Color System**: Neutral-based palette with distinct light/dark themes
- **Layout**: Card-based design with responsive grid layouts
- **Audio Player**: Sticky bottom player with standard media controls
- **Search & Filter**: Prominent search with comprehensive filtering options

## External Dependencies

### Core Framework Dependencies
- **React 18**: Frontend framework with hooks and functional components
- **Express.js**: Backend web framework for REST API
- **TypeScript**: Type safety across frontend and backend
- **Vite**: Build tool and development server with HMR

### Database and ORM
- **Drizzle ORM**: Type-safe database ORM with schema validation
- **@neondatabase/serverless**: PostgreSQL serverless driver for Neon
- **Drizzle Zod**: Schema validation integration

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessibility-focused component primitives
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library for consistent iconography

### State Management and Data Fetching
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management with validation
- **Wouter**: Lightweight client-side routing

### Development and Build Tools
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind integration
- **tsx**: TypeScript execution for development server

### Audio and Media
- **HTML5 Audio API**: Native browser audio playback capabilities
- **Embla Carousel**: Touch-friendly carousel component

### Norwegian Language Support
- **Date-fns**: Date formatting with Norwegian locale support
- **Inter + Georgia Fonts**: Typography optimized for Norwegian text readability