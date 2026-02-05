/**
 * Mock reviewer credentials for Google Play review mode.
 * When the user enters these on the login screen and taps Sign in,
 * the app bypasses Azure AD and uses mock data for all API calls.
 *
 * Document these in Play Console "Notes for reviewer" so reviewers can sign in.
 */
export const MOCK_REVIEWER_EMAIL = 'google-reviewer@gmail.com';
export const MOCK_REVIEWER_PASSWORD = 'Reviewer2024!';

export const REVIEW_MODE_STORAGE_KEY = 'reviewMode';
