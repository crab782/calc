# Tasks

- [x] Task 1: Move type definitions to `src/types/`
  - [x] SubTask 1.1: Create `src/types/record.ts` with ExpenseRecord, Category, DataSchema interfaces
  - [x] SubTask 1.2: Add category constants (INCOME_CATEGORIES, EXPENSE_CATEGORIES) to `src/types/record.ts`
  - [x] SubTask 1.3: Delete `src/model/ExpenseRecord.ts`

- [x] Task 2: Create storage utilities in `src/lib/`
  - [x] SubTask 2.1: Create `src/lib/storage.ts` with localStorage operations and data schema management
  - [x] SubTask 2.2: Include CRUD operations, import/export, version migration in storage.ts
  - [x] SubTask 2.3: Create `src/lib/record.ts` with business logic (statistics, formatting, monthly data)
  - [x] SubTask 2.4: Delete `src/dao/RecordDAO.ts` and `src/service/RecordService.ts`

- [x] Task 3: Update all import paths
  - [x] SubTask 3.1: Update `src/pages/Dashboard.tsx` imports
  - [x] SubTask 3.2: Update `src/pages/AddRecord.tsx` imports
  - [x] SubTask 3.3: Update `src/pages/Settings.tsx` imports
  - [x] SubTask 3.4: Update `src/components/MonthlyChart.tsx` imports

- [x] Task 4: Clean up old directories
  - [x] SubTask 4.1: Remove `src/model/` directory
  - [x] SubTask 4.2: Remove `src/dao/` directory
  - [x] SubTask 4.3: Remove `src/service/` directory

- [x] Task 5: Verify build and functionality
  - [x] SubTask 5.1: Run `npm run build` to verify TypeScript compilation
  - [x] SubTask 5.2: Test all pages work correctly with new imports

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1, Task 2]
- [Task 4] depends on [Task 3]
- [Task 5] depends on [Task 4]

# Target Directory Structure
```
src/
├── components/       # Reusable UI components
│   ├── Sidebar.tsx
│   └── MonthlyChart.tsx
├── pages/            # Page-level components
│   ├── Dashboard.tsx
│   ├── AddRecord.tsx
│   └── Settings.tsx
├── lib/              # Utilities and business logic
│   ├── storage.ts    # localStorage operations
│   └── record.ts     # Record-related utilities
├── types/            # Type definitions
│   ├── index.ts      # PageType and common types
│   └── record.ts     # ExpenseRecord, Category, DataSchema
├── App.tsx
└── main.tsx
```