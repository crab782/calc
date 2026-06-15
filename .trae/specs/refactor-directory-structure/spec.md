# Refactor Directory Structure - Spec

## Why
The previously implemented MVC-inspired architecture with separate `dao/`, `model/`, and `service/` directories deviates from mainstream TypeScript frontend conventions. This creates confusion for developers familiar with modern frontend workflows and adds unnecessary complexity. A simpler, convention-based structure will improve maintainability and align with industry best practices.

## What Changes
- **BREAKING**: Remove `src/model/` directory - move type definitions to `src/types/`
- **BREAKING**: Remove `src/dao/` directory - merge storage operations into `src/lib/storage.ts`
- **BREAKING**: Remove `src/service/` directory - merge business logic into `src/lib/` utilities
- Consolidate all data-related operations into `src/lib/` following standard patterns
- Update all import paths in components and pages

## Impact
- Affected specs: mvc-architecture (superseded by this spec)
- Affected code: 
  - `src/model/ExpenseRecord.ts` → `src/types/record.ts`
  - `src/dao/RecordDAO.ts` → `src/lib/storage.ts`
  - `src/service/RecordService.ts` → `src/lib/record.ts`
  - All components importing from these directories

## ADDED Requirements

### Requirement: Standard TypeScript Frontend Directory Structure
The project SHALL follow mainstream TypeScript frontend conventions:
- `src/types/` - Type definitions and interfaces
- `src/lib/` - Utility functions, storage operations, business logic
- `src/components/` - Reusable UI components
- `src/pages/` - Page-level components
- `src/hooks/` - Custom React hooks (if needed)

#### Scenario: Developer navigates project structure
- **WHEN** a developer opens the project
- **THEN** they see a familiar, convention-based directory structure
- **AND** can quickly locate types, utilities, and components

### Requirement: Single Storage Module
All localStorage operations SHALL be encapsulated in a single `src/lib/storage.ts` file, providing clear entry point for data persistence.

#### Scenario: Data operations centralized
- **WHEN** a component needs to read or write data
- **THEN** it imports from `src/lib/storage.ts` or `src/lib/record.ts`
- **AND** all storage logic is traceable in one location

### Requirement: Type Definitions in Standard Location
All TypeScript interfaces and types SHALL be defined in `src/types/` directory, following the pattern used by most TypeScript projects.

#### Scenario: Type discovery
- **WHEN** a developer needs to understand data structures
- **THEN** they look in `src/types/` directory
- **AND** find all interfaces organized by domain

## MODIFIED Requirements

### Requirement: Import Paths Updated
All existing imports from `model/`, `dao/`, `service/` SHALL be updated to use new paths:
- `../model/ExpenseRecord` → `../types/record`
- `../dao/RecordDAO` → `../lib/storage`
- `../service/RecordService` → `../lib/record`

## REMOVED Requirements

### Requirement: MVC Layered Architecture
**Reason**: Non-standard for frontend projects, creates confusion
**Migration**: Flatten into conventional `lib/` and `types/` structure