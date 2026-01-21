# React Best Practices - Improvements Document

**Date**: 2025-11-28  
**Assessment Score**: 7.5/10  
**Status**: Review recommended improvements

## Executive Summary

The codebase demonstrates solid React knowledge with modern patterns including hooks, Context API, and React Query. The TypeScript integration is strong with proper type definitions throughout. However, there are opportunities for improvement in dependency management, error handling, and consistency.

## 📋 Files Requiring Changes

### Critical Priority
- `office-add-in/src/taskpane/components/App.tsx` (line 43)
- `office-add-in/src/taskpane/components/OfficeForm.tsx` (lines 108-137)
- `office-add-in/src/provider/MsalAuthProvider.tsx` (lines 26-27)

### High Priority
- `office-add-in/src/taskpane/components/OfficeForm.tsx` (multiple useEffect hooks)
- New file needed: `office-add-in/src/components/ErrorBoundary.tsx`

### Medium Priority
- `office-add-in/src/taskpane/components/ZaakSearch.tsx` (line 156)
- `office-add-in/src/taskpane/components/OutlookForm/steps/SelectItems.tsx` (lines 19-24, 31-36)
- `office-add-in/src/taskpane/components/OutlookForm/steps/MetadataStep.tsx` (line 83)
- `office-add-in/src/taskpane/components/OutlookForm/steps/DocumentIndicator.tsx` (line 29)
- `office-add-in/src/hooks/useGetZaak.ts` (line 25)
- `office-add-in/src/taskpane/components/OutlookForm/hooks/useOutlookForm.ts` (lines 49-163, 165-191)
- New file needed: `office-add-in/src/constants/queryKeys.ts`

### Low Priority
- `office-add-in/src/taskpane/components/ZaakSearch.tsx` (lines 152-188)
- `office-add-in/src/taskpane/components/DocumentMetadataFields.tsx` (lines 41-92)
- New file needed: `office-add-in/src/taskpane/components/Main.tsx`
- New file needed: `office-add-in/src/schemas/commonFields.ts`

## ✅ Current Strengths

- **Well-structured Context providers** for auth, toast, and state management
- **Excellent custom hooks** with clear separation of concerns (`useHttp`, `useGetZaak`, `useOffice`, `useLogger`)
- **Proper React Query integration** for server state management
- **Strong form management** using react-hook-form with Zod validation
- **Comprehensive TypeScript usage** with proper type definitions
- **Good component structure** with logical separation

---

## 🔴 Critical Issues

### 1. QueryClient Created Outside Component
**File**: `office-add-in/src/taskpane/components/App.tsx:43`
**Exact Location**: Line 43

**Current**:
```typescript
const queryClient = new QueryClient();

export function App() {
  // ...
  <QueryClientProvider client={queryClient}>
```

**Issue**: Creates a new instance on every module reload, causing issues with Hot Module Replacement (HMR) and potential state loss.

**Solution**:
```typescript
export function App() {
  const [queryClient] = useState(() => new QueryClient());
  
  return (
    <QueryClientProvider client={queryClient}>
      {/* ... */}
    </QueryClientProvider>
  );
}
```

### 2. Unhandled Promise in useEffect
**File**: `office-add-in/src/taskpane/components/OfficeForm.tsx:132-137`
**Exact Location**: Lines 132-137

**Current**:
```typescript
useEffect(() => {
  getSignedInUser().then((user) => {
    if (!user) return;
    form.setValue("auteur", user);
  });
}, [getSignedInUser, form.setValue]);
```

**Issue**: No error handling for the promise. If `getSignedInUser()` rejects, it will be an unhandled rejection.

**Solution**:
```typescript
useEffect(() => {
  getSignedInUser()
    .then((user) => {
      if (!user) return;
      form.setValue("auteur", user);
    })
    .catch((error) => {
      console.error("Failed to get signed in user:", error);
      // Optionally show toast notification
    });
}, [getSignedInUser, form.setValue]);
```

### 3. Problematic MSAL Initialization Pattern
**File**: `office-add-in/src/provider/MsalAuthProvider.tsx:26-27`
**Exact Location**: Lines 26-27

**Current**:
```typescript
const msalInstance = useMemo(() => new PublicClientApplication(config), [config]);
const initialized = useMemo(() => msalInstance.initialize(), [msalInstance]);
```

**Issue**: `initialize()` returns a Promise stored in useMemo without proper handling. This can cause race conditions and initialization issues.

**Solution**:
```typescript
const msalInstance = useMemo(() => new PublicClientApplication(config), [config]);

useEffect(() => {
  let isMounted = true;
  
  msalInstance.initialize().then(() => {
    if (isMounted) {
      // Handle initialization complete
    }
  });
  
  return () => {
    isMounted = false;
  };
}, [msalInstance]);

const getAccessToken = async (scopes: string[]): Promise<string> => {
  await msalInstance.initialize();
  // ... rest of logic
};
```

---

## ⚠️ High Priority Issues

### 4. Unstable Dependencies in useEffect
**Files**: Multiple locations including `OfficeForm.tsx`

**Current**:
```typescript
useEffect(() => {
  if (!data?.identificatie) return;
  form.setValue("zaakidentificatie", data.identificatie);
}, [data?.identificatie, form.setValue]);
```

**Issue**: `form.setValue` is included in deps but react-hook-form guarantees stability. Including it is unnecessary and could cause confusion.

**Solution**:
```typescript
// Option 1: Trust react-hook-form's stability guarantee
useEffect(() => {
  if (!data?.identificatie) return;
  form.setValue("zaakidentificatie", data.identificatie);
}, [data?.identificatie]);

// Option 2: Use the entire form object
useEffect(() => {
  if (!data?.identificatie) return;
  form.setValue("zaakidentificatie", data.identificatie);
}, [data?.identificatie, form]);
```

**Apply to**:
- `office-add-in/src/taskpane/components/OfficeForm.tsx:108-111`
- `office-add-in/src/taskpane/components/OfficeForm.tsx:113-124`
- `office-add-in/src/taskpane/components/OfficeForm.tsx:126-130`
- `office-add-in/src/taskpane/components/OfficeForm.tsx:132-137`

### 5. Missing Error Boundaries
**Recommendation**: Add error boundaries at key points in the component tree.

**Create**: `office-add-in/src/components/ErrorBoundary.tsx`
```typescript
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div>
          <h2>Er is iets misgegaan</h2>
          <details>
            <summary>Foutdetails</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage in App.tsx**:
```typescript
<FluentProvider theme={isDarkMode ? webDarkTheme : webLightTheme}>
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ZaakProvider>
        <ToastProvider>
          <Main />
        </ToastProvider>
      </ZaakProvider>
    </QueryClientProvider>
  </ErrorBoundary>
</FluentProvider>
```

---

## 📝 Medium Priority Issues

### 6. Inline Styles Mixed with makeStyles
**Files with inline styles**:
- `office-add-in/src/taskpane/components/ZaakSearch.tsx:156`
- `office-add-in/src/taskpane/components/OutlookForm/steps/SelectItems.tsx:19-24, 31-36`
- `office-add-in/src/taskpane/components/OutlookForm/steps/MetadataStep.tsx:83`
- `office-add-in/src/taskpane/components/OutlookForm/steps/DocumentIndicator.tsx:29`

**Current**:
```typescript
<section style={{ marginTop: tokens.spacingVerticalL }}>
  <Body1Strong>Gevonden zaak</Body1Strong>
```

**Issue**: Inconsistent styling approach - mixing inline styles with makeStyles.

**Solution**:
```typescript
const styles = makeStyles({
  // ... existing styles
  zaakSection: {
    marginTop: tokens.spacingVerticalL,
  },
});

// Usage
<section className={styles.zaakSection}>
  <Body1Strong>Gevonden zaak</Body1Strong>
```

### 7. Magic Strings Throughout Codebase

**Files with magic strings**:
- `office-add-in/src/hooks/useGetZaak.ts:25` - `queryKey: ["zaak", zaaknummer]`
- `office-add-in/src/taskpane/components/OfficeForm.tsx:62` - `toastId: "adding-document"`

**Current Examples**:
```typescript
queryKey: ["zaak", zaaknummer]
toastId: "adding-document"
```

**Recommendation**: Create a constants file.

**Create**: `office-add-in/src/constants/queryKeys.ts`
```typescript
export const QUERY_KEYS = {
  zaak: (zaaknummer: string) => ["zaak", zaaknummer] as const,
} as const;

export const TOAST_IDS = {
  addingDocument: "adding-document",
  documentAdded: "document-added",
} as const;
```

**Usage**:
```typescript
import { QUERY_KEYS, TOAST_IDS } from "../../constants/queryKeys";

// In useGetZaak.ts
return useQuery({
  queryKey: QUERY_KEYS.zaak(zaaknummer),
  // ...
});

// In OfficeForm.tsx
dispatchToast(/* ... */, { intent: "info", toastId: TOAST_IDS.addingDocument });
```

### 8. Complex Hook Logic
**File**: `office-add-in/src/taskpane/components/OutlookForm/hooks/useOutlookForm.ts:1-201`
**Focus on**: Lines 49-163 (handleSubmit function)

**Issue**: 201 lines with complex submission logic. The `handleSubmit` function (lines 49-163) is 114 lines long and could be split into smaller, testable functions.

**Recommendation**:
```typescript
// Extract submission logic
async function uploadDocumentsToZaak(
  selectedDocuments: DocumentSchema[],
  currentEmail: Office.MessageCompose,
  graphService: GraphService,
  logger: ReturnType<typeof useLogger>
): Promise<SubmitResult> {
  // ... upload logic
}

// In useOutlookForm
const handleSubmit = async (data: Schema): Promise<SubmitResult> => {
  const selectedDocuments = data.documents.filter(({ selected }) => selected);
  
  if (selectedDocuments.length === 0) {
    WARN("⚠️ No documents selected for upload");
    return { error: null };
  }

  const currentEmail = Office.context.mailbox?.item;
  if (!currentEmail) {
    return { error: new Error("No email context found") };
  }

  return uploadDocumentsToZaak(selectedDocuments, currentEmail, graphService, { DEBUG, WARN, ERROR });
};
```

### 9. Overly Broad Dependencies
**File**: `office-add-in/src/taskpane/components/OutlookForm/hooks/useOutlookForm.ts:165-191`
**Exact Location**: Lines 165-191

**Current**:
```typescript
React.useEffect(() => {
  if (!files.length) return;
  // ... initialization logic
}, [files, form, zaak.data?.identificatie]);
```

**Issue**: Depending on entire `form` object may cause unnecessary re-runs.

**Solution**:
```typescript
const resetForm = form.reset;
const getValues = form.getValues;
const trigger = form.trigger;

React.useEffect(() => {
  if (!files.length) return;
  // ... use resetForm, getValues, trigger
}, [files, resetForm, getValues, trigger, zaak.data?.identificatie]);
```

---

## 💡 Low Priority Improvements

### 10. Component Composition
**File**: `office-add-in/src/taskpane/components/App.tsx:97-136`
**Exact Location**: Lines 97-136 (Main component definition)

**Recommendation**: The `Main` component is defined at module level but only used in `App`. Consider moving it to a separate file for clarity.

**Create**: `office-add-in/src/taskpane/components/Main.tsx`
```typescript
export function Main() {
  // ... existing Main logic
}
```

### 11. Consider React.memo for Expensive Components
**Candidates for React.memo**:
- `office-add-in/src/taskpane/components/ZaakSearch.tsx:152-188` (ZaakDetails component)
- `office-add-in/src/taskpane/components/DocumentMetadataFields.tsx:41-92`
- `office-add-in/src/taskpane/components/OutlookForm/steps/DocumentIndicator.tsx:17-34`

**Recommendation**: Profile the app and add `React.memo` to components that re-render frequently without prop changes.

**Example**:
```typescript
export const ZaakDetails = React.memo(function ZaakDetails(props: { zaak: Zaak }) {
  const styles = zaakdetails();
  // ... rest of component
});
```

### 12. Extract Shared Form Field Validation
**Observation**: Form schemas are defined inline. Consider extracting common field validations.

**Create**: `office-add-in/src/schemas/commonFields.ts`
```typescript
import { z } from "zod";

export const zaaknummerField = z.string().startsWith("ZAAK-", {
  message: "Zaaknummer moet beginnen met 'ZAAK-'",
});

export const auteurField = z.string().min(1, "Auteur is verplicht");
```

### 13. Accessibility Improvements
**Recommendation**: 
- Add ARIA labels to form controls where needed
- Ensure proper focus management in multi-step forms (OutlookForm)
- Add keyboard navigation hints

---

## 🎯 Implementation Priority

### Phase 1 (Critical - Immediate)
1. Fix QueryClient instantiation in App.tsx
2. Add error handling to all async operations in useEffect
3. Fix MSAL initialization pattern

### Phase 2 (High Priority - This Sprint)
4. Standardize useEffect dependencies
5. Add Error Boundaries
6. Remove inline styles, use makeStyles consistently

### Phase 3 (Medium Priority - Next Sprint)
7. Extract magic strings to constants
8. Refactor complex hook logic
9. Optimize dependencies in useEffect

### Phase 4 (Low Priority - Backlog)
10. Improve component composition
11. Add React.memo where beneficial
12. Extract shared validation schemas
13. Accessibility audit and improvements

---

## 📊 Metrics to Track

- **Re-render frequency**: Use React DevTools Profiler
- **Bundle size**: Monitor after extracting components
- **Error rate**: Track unhandled promise rejections
- **User experience**: Focus on form submission flows

---

## 🧪 Testing Strategy

For each improvement made, we should add corresponding tests to prevent regressions. Your project already has a great testing setup with Vitest, React Testing Library, and happy-dom.

### Testing Patterns to Use

#### 1. Testing Components
```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};
```

#### 2. Testing Hooks
```typescript
import { renderHook, waitFor } from "@testing-library/react";

const { result } = renderHook(() => useMyHook(), {
  wrapper: createWrapper,
});
```

#### 3. Mocking Dependencies
```typescript
import { vi } from "vitest";

vi.mock("../../hooks/useHttp", () => ({
  useHttp: vi.fn(),
}));
```

### Tests Needed for Each Issue

#### Critical Issue #1 (QueryClient)
- **Test**: Verify QueryClient persists between re-renders
- **File**: `office-add-in/src/taskpane/components/App.test.tsx` (new)

#### Critical Issue #2 (Unhandled Promise)
- **Test**: Verify error handling when getSignedInUser fails
- **File**: `office-add-in/src/taskpane/components/OfficeForm.test.tsx` (new)

#### High Priority Issue #5 (Error Boundaries)
- **Test**: Verify error boundary catches errors and displays fallback
- **File**: `office-add-in/src/components/ErrorBoundary.test.tsx` (new)

#### Medium Priority Issues
- **ZaakSearch**: Test form validation and submission
  - File: `office-add-in/src/taskpane/components/ZaakSearch.test.tsx` (new)
- **Form Components**: Test Input, Select, Checkbox behavior
  - Files: `office-add-in/src/taskpane/components/form/*.test.tsx` (new)

### Recommended Test Coverage Goals
- **Components**: 80% coverage
- **Hooks**: 90% coverage (already have good coverage ✅)
- **Utilities**: 90% coverage
- **Providers**: 75% coverage

## 🔗 Helpful Resources

- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
- [React Hook Form Performance](https://react-hook-form.com/advanced-usage#FormProviderPerformance)
- [React useEffect Complete Guide](https://overreacted.io/a-complete-guide-to-useeffect/)
- [FluentUI React Best Practices](https://react.fluentui.dev/?path=/docs/concepts-developer-best-practices--page)
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

## 🛠️ Testing Commands

Your project has a complete testing setup. Use these commands:

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with UI (opens browser interface)
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run tests for specific file
npm test -- ZaakSearch.test.tsx

# Run tests matching pattern
npm test -- --grep="Form Validation"
```

### Test-Driven Development (TDD) Workflow

For each improvement:

1. **Write failing test first**
   ```bash
   npm run test:watch
   ```

2. **Make minimal code change to pass test**
   - Fix the issue
   - Run test to verify it passes

3. **Refactor if needed**
   - Improve code quality
   - Ensure tests still pass

4. **Check coverage**
   ```bash
   npm run test:coverage
   ```
   - Aim for >80% coverage on modified files

## Next Steps

1. Review this document with the team
2. Prioritize issues based on current sprint goals
3. Create JIRA tickets for Phase 1 and Phase 2 items
4. Schedule time for refactoring work
5. Set up code review checklist based on these patterns
6. **Run existing tests to establish baseline**: `npm run test:coverage`
7. **Create tests for critical issues before fixing them** (TDD approach)

---

## 📋 Quick Reference Checklist

### Critical Issues (Do First)
- [ ] **App.tsx:43** - Move `queryClient` creation inside component with useState
  - [ ] Add test: `App.test.tsx` - Verify QueryClient persists between re-renders
- [ ] **OfficeForm.tsx:132-137** - Add error handling to getSignedInUser promise
  - [ ] Add test: `OfficeForm.test.tsx` - Test error handling for getSignedInUser
- [ ] **MsalAuthProvider.tsx:26-27** - Fix MSAL initialization in useEffect
  - [ ] Add test: `MsalAuthProvider.test.tsx` - Test initialization flow

### High Priority Issues
- [ ] **OfficeForm.tsx:108-111** - Fix useEffect dependencies (remove form.setValue or use form)
- [ ] **OfficeForm.tsx:113-124** - Fix useEffect dependencies (remove form.setValue or use form)
- [ ] **OfficeForm.tsx:126-130** - Fix useEffect dependencies (remove form.setValue or use form)
- [ ] **OfficeForm.tsx:132-137** - Fix useEffect dependencies (remove form.setValue or use form)
  - [ ] Add test: `OfficeForm.test.tsx` - Test all form field auto-population
- [ ] **Create ErrorBoundary.tsx** - Add error boundary component
  - [ ] Add test: `ErrorBoundary.test.tsx` - Test error catching and fallback UI
- [ ] **App.tsx** - Wrap app with ErrorBoundary

### Medium Priority Issues
- [ ] **ZaakSearch.tsx:156** - Move inline style to makeStyles
  - [ ] Add test: `ZaakSearch.test.tsx` - Test form validation and submission
- [ ] **SelectItems.tsx:19-24, 31-36** - Move inline styles to makeStyles
- [ ] **MetadataStep.tsx:83** - Move inline style to makeStyles
- [ ] **DocumentIndicator.tsx:29** - Move inline style to makeStyles
- [ ] **Create constants/queryKeys.ts** - Extract magic strings
- [ ] **useGetZaak.ts:25** - Use constant for query key
- [ ] **OfficeForm.tsx:62** - Use constant for toast ID
- [ ] **useOutlookForm.ts:49-163** - Extract handleSubmit logic to separate function
  - [ ] Add test: Update `useOutlookForm.test.ts` - Test extracted function
- [ ] **useOutlookForm.ts:165-191** - Optimize useEffect dependencies

### Low Priority Issues
- [ ] **Create Main.tsx** - Extract Main component from App.tsx
- [ ] **ZaakSearch.tsx:152-188** - Consider React.memo for ZaakDetails
- [ ] **DocumentMetadataFields.tsx:41-92** - Consider React.memo
- [ ] **DocumentIndicator.tsx:17-34** - Consider React.memo
- [ ] **Create schemas/commonFields.ts** - Extract shared validation schemas
- [ ] Conduct accessibility audit

### New Files to Create

**Production Files:**
1. `office-add-in/src/components/ErrorBoundary.tsx`
2. `office-add-in/src/constants/queryKeys.ts`
3. `office-add-in/src/taskpane/components/Main.tsx` (optional)
4. `office-add-in/src/schemas/commonFields.ts` (optional)

**Test Files:**
1. `office-add-in/src/taskpane/components/App.test.tsx`
2. `office-add-in/src/taskpane/components/OfficeForm.test.tsx`
3. `office-add-in/src/taskpane/components/ZaakSearch.test.tsx`
4. `office-add-in/src/components/ErrorBoundary.test.tsx`
5. `office-add-in/src/provider/MsalAuthProvider.test.tsx`
6. `office-add-in/src/taskpane/components/form/Input.test.tsx`
7. `office-add-in/src/taskpane/components/form/Select.test.tsx`
8. `office-add-in/src/taskpane/components/form/Checkbox.test.tsx`
