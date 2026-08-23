# Lessons Learned
# A File for Agents to write their mistakes so that next runs can prevent doing the same thing (Automatic Improvement)

## [2026-08-23] Undefined Function Reference in Resource Modal Handler
- **Problem**: Runtime `ReferenceError: handleSubmitResource is not defined` occurred in `<ResourcesContent>` component when rendering `ResourceModal`.
- **Root Cause**: During refactoring of `ResourcesContent.jsx` to the new service layer (`resourceService.js`), the handler was renamed to `handleFormSubmit`, but the JSX prop `<ResourceModal onSubmit={handleSubmitResource} />` was not updated to match the new handler name.
- **Prevention**: Always perform a complete reference cross-check across all JSX props, callbacks, and handler bindings within the component after renaming functions or refactoring API submission methods.