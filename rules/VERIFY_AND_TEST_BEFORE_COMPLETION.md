# CLINIC — VERIFICATION & MANDATORY TESTING RULE

## 1. Absolute Rule: Always Test Before Declaring Completion
- **Never claim a task or bug fix is finished without performing concrete, verified testing first.**
- Simply writing code or making edits is NOT completion.
- You must actively validate:
  1. That the code compiles without TypeScript / Webpack errors.
  2. That the HTTP endpoints / pages respond with status code `200 OK`.
  3. That the interactive UI flows (modals, mobile viewports, forms, admin operations) render and perform as expected without runtime exceptions or console errors.
  4. If an admin or database action was performed (e.g. creating/updating products, suspending/banning doctors, deleting patient records), verify the database mutation succeeds and that access controls correctly enforce the new state.

---

## 2. Testing Checklist Performed on Every Feature
Before declaring done:
1. **Build / Type Integrity:**
   - Execute TypeScript typecheck or build verification.
2. **Runtime Verification:**
   - Run live curl / PowerShell `Invoke-WebRequest` to confirm HTTP `200` on affected routes.
   - For UI / responsiveness features, test directly in mobile and desktop viewports.
3. **Database & API Verification:**
   - Check API responses (e.g., Supabase queries / route handlers) to confirm expected schema, data persistence, and error handling.
4. **Edge Cases:**
   - Verify unauthenticated vs authenticated states, suspended/banned doctor rejection, and empty/error states.
