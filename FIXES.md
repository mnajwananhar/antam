# PRODUCTION BUILD FIXES

## RINGKASAN MASALAH

Total 29 TypeScript errors yang mencegah production build:

- 24 errors: `any` types yang harus diganti dengan proper types
- 5 errors: unused variables dan missing dependencies

## STRATEGI PERBAIKAN

### 1. API Routes - Type Safety Critical

- `src/app/api/approvals/route.ts` ✅ FIXED
- `src/app/api/critical-issue/route.ts` ✅ FIXED
- `src/app/api/energy-consumption/route.ts` ✅ PARTIALLY FIXED (need more)
- `src/app/api/energy-ikes/route.ts` - Need interface definitions
- `src/app/api/kta-tta/export/route.ts` - Need proper types
- `src/app/api/maintenance-routine/route.ts` - Need Prisma types
- `src/app/api/operational-report/[id]/route.ts` - Need JSON types
- `src/app/api/safety-incident/route.ts` - Need validation schemas

### 2. Components - React Hook Dependencies

- `src/components/data-review/kta-tta-review.tsx` - Add useCallback
- `src/components/department/tabs/maintenance-routine-tab.tsx` - Fix dependencies
- `src/components/ui/custom-calendar.tsx` - Add value dependency
- `src/components/ui/date-picker.tsx` - Remove unused variables
- `src/components/ui/label.tsx` - Fix empty interface

### 3. Utils & Types - Core Infrastructure

- `src/lib/utils/api-response.util.ts` ✅ NEED FIX - Replace all `any` with generics
- `src/lib/utils/authorization.util.ts` - Need proper typing
- `src/types/notification-order.types.ts` - Replace `any` with interfaces

### 4. Pages - Unused Imports

- `src/app/input/[department]/page.tsx` - Remove unused UI components

## IMPLEMENTASI PRIORITAS

### CRITICAL (Blocking Production)

1. API Routes (`any` types)
2. Utils (api-response.util.ts)
3. Types (notification-order.types.ts)

### HIGH (Performance & Maintainability)

1. React Hook dependencies
2. Empty interfaces
3. Unused variables

### MEDIUM (Code Quality)

1. Unused imports
2. Console warnings

## NEXT STEPS

1. Fix remaining energy-ikes API
2. Create proper interfaces for all API data
3. Replace all `any` with typed interfaces
4. Add proper error handling with unknown types
5. Test production build after each fix

## ESTIMASI WAKTU

- Critical fixes: 2-3 jam
- High priority: 1-2 jam
- Medium priority: 30 menit

Total: 4-6 jam untuk production-ready codebase
