# ChrisAI - Production-Grade AI Assistant

## Overview

ChrisAI is a fully-featured, production-grade web AI assistant built with a modern full-stack architecture. The application provides an intelligent chat interface powered by multiple Groq API models, featuring voice interaction, file processing, thinking mode, and developer tools. The system is designed to be cleaner and more intuitive than existing solutions like ChatGPT.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Tailwind CSS with shadcn/ui components for consistent, modern design
- **State Management**: TanStack Query for server state and React hooks for local state
- **Animation**: Framer Motion for smooth, engaging user interactions
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL store

### Real-time Communication
- **WebSocket**: Native WebSocket implementation for real-time chat streaming
- **Server-Sent Events**: Used for AI response streaming and thinking mode updates

## Key Components

### AI Integration Layer
- **Primary Service**: Groq API integration with multiple model support
  - Chat models: llama-3.1-8b-instant, llama-3.3-70b-versatile, mistral-saba-24b, gemma2-9b-it
  - Thinking model: deepseek-r1-distill-llama-70b for reasoning display
  - Vision model: meta-llama/llama-4-scout-17b-16e-instruct for image understanding
  - Transcription: whisper-large-v3 for voice-to-text
  - TTS: playai-tts for text-to-speech output

### Core Features Implementation
1. **Chat Interface**: Real-time messaging with message editing, deletion, and regeneration
2. **Thinking Mode**: Separate reasoning display using specialized reasoning models
3. **Voice Interface**: Audio recording, transcription, and text-to-speech capabilities
4. **File Processing**: Multi-format support (PDF, images, documents, audio) with content extraction
5. **Developer Panel**: Code execution environment with syntax highlighting
6. **User Memory System**: Persistent user profiles and conversation context

### UI Components Structure
- **ChatArea**: Main conversation display with message bubbles and streaming support
- **ChatInput**: Multi-modal input with voice recording, file upload, and formatting tools
- **ChatSidebar**: Conversation history, model selection, and user preferences
- **MessageBubble**: Individual message rendering with edit/delete/regenerate actions
- **ThinkingDisplay**: Specialized component for AI reasoning visualization
- **DeveloperPanel**: Code analysis and execution environment

## Data Flow

### Message Processing Flow
1. User input → ChatInput component captures text/voice/files
2. Input processed → WebSocket sends message to server
3. Server processes → Groq API called with selected model
4. Response streams → Real-time updates via WebSocket
5. UI updates → Messages displayed with animations
6. Database persistence → Conversations and messages stored

### File Processing Pipeline
1. File upload → Multer handles multipart uploads
2. File validation → Type and size checking
3. Content extraction → Format-specific processing (PDF, images, audio)
4. Text extraction → OCR for images, transcription for audio
5. Database storage → File metadata and extracted content saved
6. Context integration → Extracted content available for AI context

### Authentication Flow
1. Replit Auth → OpenID Connect authentication
2. Session creation → PostgreSQL session storage
3. User profile → Database user record creation/retrieval
4. Preferences sync → User settings and memory persistence

## External Dependencies

### Core AI Services
- **Groq API**: Primary AI inference service for all model interactions
- **File Processing**: Server-side content extraction for various file formats

### Infrastructure Services
- **Neon PostgreSQL**: Serverless database for production scalability
- **Replit Auth**: Integrated authentication system
- **WebSocket**: Native implementation for real-time features

### Development Tools
- **Drizzle Kit**: Database migration and schema management
- **ESBuild**: Production bundling for server-side code
- **TypeScript**: Type safety across frontend and backend

### UI and Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling system
- **Framer Motion**: Animation library for smooth interactions

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds optimized client bundle to `dist/public`
2. **Backend Build**: ESBuild packages server code to `dist/index.js`
3. **Database Setup**: Drizzle migrations ensure schema is up-to-date

### Environment Configuration
- **Development**: Hot reload with Vite dev server and tsx for backend
- **Production**: Optimized builds with proper environment variable handling
- **Database**: Automatic provisioning with Neon serverless PostgreSQL

### Scalability Considerations
- **Stateless Server**: Session data in PostgreSQL allows horizontal scaling
- **Database Connection Pooling**: Neon serverless handles connection optimization
- **File Storage**: Local storage with potential for cloud storage integration
- **WebSocket Scaling**: Current implementation supports single-server deployment

### Security Implementation
- **Authentication**: Secure OpenID Connect flow with Replit
- **Session Security**: HttpOnly cookies with proper expiration
- **File Upload Security**: Type validation and size limits
- **API Security**: Request validation and error handling