# Design Document

## Overview

This design focuses on simplifying the Profile screen by removing notification and biometric authentication settings while significantly enhancing the currency selector with a modern, full-screen interface. The design maintains the existing glass morphism aesthetic and gradient themes while improving usability and visual hierarchy.

## Architecture

### Component Structure
```
Profile.js
├── ProfileHeader (existing - unchanged)
│   ├── ProfileImage
│   ├── NameEditor
│   └── EmailDisplay
├── SettingsSection (modified)
│   ├── CurrencySelector (enhanced)
│   └── [Removed: NotificationToggle, BiometricToggle]
├── CurrencyPickerModal (new full-screen component)
│   ├── Header (back button + title)
│   ├── SearchBar
│   └── CurrencyList
└── LogoutButton (existing - unchanged)
```

### State Management
- Remove notification and biometric related state variables
- Enhance currency picker state with search functionality
- Maintain existing currency persistence (AsyncStorage + Firestore)

## Components and Interfaces

### 1. Enhanced Currency Selector

**Current Implementation Issues:**
- Limited visual feedback
- Poor search experience
- Cramped display in dropdown format

**New Design:**
- Full-screen modal interface
- Prominent search functionality
- Rich currency display with symbols, codes, and names
- Smooth animations and transitions

### 2. Currency Picker Modal

**Interface:**
```javascript
interface CurrencyPickerProps {
  visible: boolean;
  selectedCurrency: string;
  onCurrencySelect: (currency: string) => void;
  onClose: () => void;
}
```

**Features:**
- Full-screen overlay with gradient background
- Header with back button and title
- Real-time search filtering
- Scrollable currency list with visual selection indicators
- Smooth open/close animations

### 3. Currency List Item

**Design Elements:**
- Currency symbol (large, prominent)
- Currency code (bold, primary text)
- Currency name (secondary text)
- Selection indicator (checkmark or highlight)
- Touch feedback with glass morphism effect

## Data Models

### Currency Data Structure (existing)
```javascript
{
  code: string,    // "USD"
  symbol: string,  // "$"
  name: string     // "US Dollar"
}
```

### Settings Data Structure (simplified)
```javascript
// Remove from user settings:
// - notifications: boolean
// - biometric: boolean

// Keep only:
{
  currency: string  // "USD"
}
```

## User Interface Design

### 1. Profile Screen Layout

**Header Section (unchanged):**
- Gradient background with profile image
- Editable name field
- Email display

**Settings Section (simplified):**
```
┌─────────────────────────────────┐
│ Settings                        │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 💰 Currency                 │ │
│ │    Set your preferred...    │ │
│ │                    $ USD  > │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🚪 Logout                   │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### 2. Currency Picker Modal

**Full-Screen Layout:**
```
┌─────────────────────────────────┐
│ ← Back    Select Currency       │
├─────────────────────────────────┤
│ 🔍 Search currency...           │
├─────────────────────────────────┤
│ $ USD - US Dollar            ✓  │
│ € EUR - Euro                    │
│ £ GBP - British Pound           │
│ ¥ JPY - Japanese Yen            │
│ A$ AUD - Australian Dollar      │
│ ...                             │
└─────────────────────────────────┘
```

### 3. Visual Design System

**Colors:**
- Background: `THEME_COLORS.primary.main` (#1A1A2E)
- Cards: Glass morphism with `rgba(255,255,255,0.05)`
- Selected items: `THEME_COLORS.secondary.main` (#16CAC9)
- Text primary: `THEME_COLORS.text.primary` (#FFFFFF)
- Text secondary: `THEME_COLORS.text.secondary` (#A0AEC0)

**Typography:**
- Section titles: `TYPOGRAPHY.h3` (Poppins Medium, responsive)
- Setting titles: `TYPOGRAPHY.subtitle1` (Poppins Medium)
- Setting descriptions: `TYPOGRAPHY.body2` (Poppins Regular)
- Currency codes: `TYPOGRAPHY.subtitle1` (Poppins Semibold)
- Currency names: `TYPOGRAPHY.body2` (Poppins Regular)

**Spacing:**
- Card padding: `width * 0.04`
- Section margins: `width * 0.05`
- Item spacing: `width * 0.03`

## Error Handling

### Currency Selection Errors
- Network failures during save operations
- Invalid currency codes
- AsyncStorage write failures
- Firestore update failures

**Error Recovery:**
- Show user-friendly error messages
- Retry mechanisms for network operations
- Fallback to previous currency selection
- Local storage as backup

### Code Removal Safety
- Gradual removal of notification/biometric code
- Ensure no orphaned references
- Maintain backward compatibility with existing user data
- Clean up unused imports and dependencies

## Testing Strategy

### Unit Tests
- Currency selection functionality
- Search filtering logic
- Settings persistence (AsyncStorage + Firestore)
- Error handling scenarios

### Integration Tests
- Profile screen rendering without removed components
- Currency picker modal interactions
- Navigation between profile and currency picker
- Data synchronization between local and remote storage

### Visual Regression Tests
- Profile screen layout consistency
- Currency picker modal appearance
- Responsive design across different screen sizes
- Theme consistency with app design system

### User Acceptance Tests
- Currency selection workflow
- Search functionality performance
- Settings persistence across app restarts
- Smooth transitions and animations

## Performance Considerations

### Optimization Strategies
- Lazy loading of currency picker modal
- Debounced search input to reduce filtering operations
- Memoization of filtered currency lists
- Efficient re-rendering with React.memo where appropriate

### Memory Management
- Proper cleanup of removed notification/biometric listeners
- Efficient handling of large currency lists
- Optimized image loading for currency symbols (if added later)

## Migration Strategy

### Code Removal Process
1. Remove notification-related state and functions
2. Remove biometric authentication state and functions
3. Clean up unused imports (LocalAuthentication, notification libraries)
4. Remove related UI components and styling
5. Update settings data structure

### Data Migration
- Existing user settings will continue to work
- Unused settings fields will be ignored
- No breaking changes to currency functionality

### Rollback Plan
- Keep removed code in version control
- Maintain database schema compatibility
- Ability to restore features if needed