# Requirements Document

## Introduction

This feature focuses on simplifying the profile screen by removing unnecessary authentication options (notifications and biometric login) and enhancing the currency selector with improved UI/UX. The goal is to create a cleaner, more focused profile experience that prioritizes the core functionality users need most.

## Requirements

### Requirement 1

**User Story:** As a user, I want a simplified profile screen without notification and biometric settings, so that I can focus on essential profile management features.

#### Acceptance Criteria

1. WHEN the user navigates to the profile screen THEN the notifications toggle SHALL NOT be displayed
2. WHEN the user navigates to the profile screen THEN the biometric login option SHALL NOT be displayed
3. WHEN the user views the profile screen THEN only essential settings (currency, profile info) SHALL be visible
4. WHEN notification/biometric related code is removed THEN the app SHALL continue to function without errors

### Requirement 2

**User Story:** As a user, I want an enhanced currency selector interface, so that I can easily browse and select my preferred currency with better visual feedback.

#### Acceptance Criteria

1. WHEN the user taps on the currency setting THEN a full-screen currency picker SHALL be displayed
2. WHEN the currency picker is shown THEN it SHALL display a search bar at the top
3. WHEN the user types in the search bar THEN the currency list SHALL filter in real-time
4. WHEN currencies are displayed THEN each SHALL show the currency symbol, code, and full name
5. WHEN the user selects a currency THEN visual feedback SHALL indicate the selection
6. WHEN a currency is selected THEN the picker SHALL close and update the profile display
7. WHEN the user taps the back button THEN the currency picker SHALL close without changes

### Requirement 3

**User Story:** As a user, I want the currency selector to have improved visual design, so that it feels modern and consistent with the app's theme.

#### Acceptance Criteria

1. WHEN the currency picker is displayed THEN it SHALL use the app's gradient theme colors
2. WHEN currency options are shown THEN they SHALL have proper spacing and typography
3. WHEN a currency is selected THEN it SHALL have a distinct visual highlight
4. WHEN the search functionality is used THEN it SHALL have appropriate icons and styling
5. WHEN the picker header is displayed THEN it SHALL include a back button and title

### Requirement 4

**User Story:** As a user, I want the profile screen to maintain all existing functionality after changes, so that I can still manage my profile effectively.

#### Acceptance Criteria

1. WHEN changes are made THEN profile image upload SHALL continue to work
2. WHEN changes are made THEN name editing SHALL continue to work
3. WHEN changes are made THEN logout functionality SHALL continue to work
4. WHEN changes are made THEN currency selection SHALL save to both local storage and Firebase
5. WHEN the app restarts THEN the selected currency SHALL persist correctly