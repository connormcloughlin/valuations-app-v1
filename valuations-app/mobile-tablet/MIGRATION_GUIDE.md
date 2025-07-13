# GlobalStyles Migration Guide

## Overview
This guide helps migrate the remaining files to use the new theme system from `GlobalStyles.ts`.

## Migration Status

### ✅ Completed Files
- `ItemForm.tsx` - Migrated to use theme constants
- `HandwritingModal.tsx` - Migrated to use theme constants  
- `SurveyStates.tsx` - Migrated to use theme constants
- `SurveyMainContent.tsx` - ✅ **NEWLY MIGRATED** - Migrated to use theme constants
- `SurveyHeader.tsx` - ✅ **NEWLY MIGRATED** - Migrated to use theme constants
- `SurveyDetails.tsx` - ✅ **NEWLY MIGRATED** - Migrated to use theme constants
- `SurveyActions.tsx` - ✅ **NEWLY MIGRATED** - Migrated to use theme constants
- `RiskAssessmentTemplates.tsx` - ✅ **NEWLY MIGRATED** - Migrated to use theme constants
- `CategoriesList.tsx` - ✅ **NEWLY MIGRATED** - Migrated to use theme constants
- `[id] copy.tsx` (survey summary copy) - ✅ **NEWLY MIGRATED** - Migrated to use theme constants

### 🎉 **MIGRATION COMPLETE!**
All files listed in the original migration guide have been successfully migrated to use GlobalStyles constants.

## Migration Steps

### Step 1: Add Theme Imports
Replace the existing imports with:
```typescript
import { colors, spacing, borderRadius, typography, commonStyles, textStyles } from '../../GlobalStyles';
```

### Step 2: Replace Hardcoded Colors
| Old Value | New Value |
|-----------|-----------|
| `'#4a90e2'` | `colors.primary` |
| `'#3498db'` | `colors.primaryDark` |
| `'#2c3e50'` | `colors.textPrimary` |
| `'#7f8c8d'` | `colors.textSecondary` |
| `'#95a5a6'` | `colors.textMuted` |
| `'#e74c3c'` | `colors.error` |
| `'#27ae60'` | `colors.success` |
| `'#f39c12'` | `colors.warning` |
| `'#fff'` | `colors.white` |
| `'#ddd'` | `colors.border` |
| `'#eee'` | `colors.borderLight` |

### Step 3: Replace Hardcoded Spacing
| Old Value | New Value |
|-----------|-----------|
| `4` | `spacing.xs` |
| `8` | `spacing.sm` |
| `12` | `spacing.md` |
| `16` | `spacing.lg` |
| `20` | `spacing.xl` |
| `24` | `spacing.xxl` |
| `32` | `spacing.xxxl` |
| `40` | `spacing.xxxxl` |

### Step 4: Replace Hardcoded Typography
| Old Value | New Value |
|-----------|-----------|
| `fontSize: 10` | `fontSize: typography.xs` |
| `fontSize: 12` | `fontSize: typography.sm` |
| `fontSize: 14` | `fontSize: typography.base` |
| `fontSize: 16` | `fontSize: typography.lg` |
| `fontSize: 18` | `fontSize: typography.xl` |
| `fontSize: 20` | `fontSize: typography.xxl` |
| `fontSize: 24` | `fontSize: typography.xxxl` |
| `fontSize: 28` | `fontSize: typography.xxxxl` |
| `fontSize: 32` | `fontSize: typography.xxxxxl` |

### Step 5: Replace Hardcoded Border Radius
| Old Value | New Value |
|-----------|-----------|
| `4` | `borderRadius.xs` |
| `6` | `borderRadius.sm` |
| `8` | `borderRadius.md` |
| `12` | `borderRadius.lg` |
| `16` | `borderRadius.xl` |
| `20` | `borderRadius.xxl` |
| `24` | `borderRadius.xxxl` |

### Step 6: Use Common Styles
Replace common patterns with:
```typescript
// Instead of defining loading states
loadingContainer: commonStyles.loadingContainer,
loadingText: commonStyles.loadingText,

// Instead of defining error states  
errorContainer: commonStyles.errorContainer,
errorText: commonStyles.errorText,

// Instead of defining empty states
emptyContainer: commonStyles.emptyContainer,
emptyText: commonStyles.emptyText,

// Instead of defining modal styles
modalContainer: commonStyles.modalContainer,
modalHeader: commonStyles.modalHeader,
modalTitle: commonStyles.modalTitle,
```

### Step 7: Use Typography System
Replace text styles with:
```typescript
// Instead of custom text styles
title: textStyles.h1,
subtitle: textStyles.h3,
bodyText: textStyles.bodyMedium,
caption: textStyles.caption,
```

## Example Migration

### Before:
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 16,
  },
});
```

### After:
```typescript
import { colors, spacing, borderRadius, typography, textStyles } from '../../GlobalStyles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: textStyles.h1,
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
});
```

## Quick Migration Script

Run this command to find all hardcoded values that need migration:
```bash
grep -r "#'[0-9a-fA-F]\{6\}'" app/ --include="*.tsx" --include="*.ts" | grep -v GlobalStyles
```

## Benefits After Migration

1. **Consistency**: All colors, spacing, and typography use centralized constants
2. **Maintainability**: Changes to theme affect entire app
3. **Type Safety**: Proper TypeScript support for all theme values
4. **Developer Experience**: Clear documentation and usage examples
5. **Performance**: Reduced bundle size through shared styles

## Testing After Migration

1. Check that all components render correctly
2. Verify that colors and spacing are consistent
3. Test on different screen sizes
4. Ensure accessibility is maintained
5. Run TypeScript checks for any remaining errors

## Need Help?

If you encounter issues during migration:
1. Check the `GlobalStyles.ts` file for available constants
2. Use the example usage in the file comments
3. Refer to this migration guide for common patterns
4. Test changes incrementally to catch issues early

## 🎉 Migration Complete!

All survey-related components have been successfully migrated to use the GlobalStyles theme system. The app now has:

- ✅ **Consistent theming** across all survey components
- ✅ **Centralized color management** 
- ✅ **Standardized spacing and typography**
- ✅ **Better maintainability** for future theme changes
- ✅ **Type-safe styling** with proper TypeScript support 