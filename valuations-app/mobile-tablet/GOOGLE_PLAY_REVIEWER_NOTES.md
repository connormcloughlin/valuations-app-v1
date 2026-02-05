# Notes for Google Play Reviewer

Use the text below in **Play Console → Your app → Release → Production (or Testing) → Release details → Notes for reviewer** when submitting the app.

---

## Sign-in instructions for review

The app requires sign-in. To access the app with full functionality using **demo data** (no corporate login required), please use the following credentials:

1. On the login screen, enter:
   - **Username / email:** `google-reviewer@gmail.com`
   - **Password:** `Reviewer2024!`

2. Tap **Sign In** (the first button).

You will be signed in as a review user and see sample appointments and dashboard data. All data is mock data; no backend or corporate systems are used.

To sign in with a real corporate account instead, tap **Sign In with Azure AD** and use your organization’s Microsoft/Azure AD credentials (if applicable).

---

*Keep the username and password in this file in sync with `core/reviewMode/constants.ts` (MOCK_REVIEWER_EMAIL and MOCK_REVIEWER_PASSWORD).*
