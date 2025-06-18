# Layout Components

This directory contains reusable layout components that provide consistent header and navigation across your app.

## Components

### AppHeader
A reusable header component with logout functionality.

**Props:**
- `title?: string` - Header title (default: "Qantam")
- `showLogout?: boolean` - Show/hide logout button (default: true)
- `onLogout?: () => void` - Custom logout handler

### BottomNavigation  
A reusable bottom navigation with animated tab buttons.

**Props:**
- `tabs: TabConfig[]` - Array of tab configurations
- `customActiveCheck?: (tabPath: string, currentPath: string) => boolean` - Custom active tab logic

### AppLayout
A complete layout wrapper that combines header, content, and bottom navigation.

**Props:**
- `children: React.ReactNode` - Page content
- `title?: string` - Header title (default: "Qantam")
- `showHeader?: boolean` - Show/hide header (default: true)
- `showBottomNav?: boolean` - Show/hide bottom navigation (default: true)
- `showLogout?: boolean` - Show/hide logout button (default: true)
- `tabs?: TabConfig[]` - Tab configurations (default: [])
- `customActiveCheck?: (tabPath: string, currentPath: string) => boolean` - Custom active tab logic
- `onLogout?: () => void` - Custom logout handler

## Usage Examples

### Basic Layout with Default Tabs
```tsx
import { AppLayout, TabConfig } from '../components/layout';

const tabs: TabConfig[] = [
  {
    name: 'dashboard',
    title: 'Dashboard', 
    icon: 'view-dashboard',
    path: '/(tabs)'
  },
  // ... more tabs
];

export default function MyPage() {
  return (
    <AppLayout tabs={tabs}>
      <YourContent />
    </AppLayout>
  );
}
```

### Header Only (No Navigation)
```tsx
import { AppLayout } from '../components/layout';

export default function MyPage() {
  return (
    <AppLayout showBottomNav={false}>
      <YourContent />
    </AppLayout>
  );
}
```

### Minimal Layout (No Header or Navigation)
```tsx
import { AppLayout } from '../components/layout';

export default function MyPage() {
  return (
    <AppLayout showHeader={false} showBottomNav={false}>
      <YourContent />
    </AppLayout>
  );
}
```

### Using Individual Components
```tsx
import { AppHeader, BottomNavigation } from '../components/layout';

export default function CustomLayout() {
  return (
    <View style={{ flex: 1 }}>
      <AppHeader title="Custom Title" />
      <View style={{ flex: 1 }}>
        <YourContent />
      </View>
      <BottomNavigation tabs={myTabs} />
    </View>
  );
}
```

## Available Icons
The following icons are supported for tabs:
- `view-dashboard`
- `clipboard-list` 
- `note-text`
- `account`
- `calendar-clock`
- `plus-circle`

## Migration from (tabs) Structure

Before:
```
app/
  (tabs)/
    your-page.tsx  // Had header and nav automatically
```

After:
```
app/
  your-page.tsx  // Use AppLayout for header and nav
```

This allows you to use the same header and navigation styling anywhere in your app without being constrained to the `(tabs)` directory structure. 