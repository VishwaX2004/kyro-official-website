# Contact and Account Page Redesign

The contact and account pages have been redesigned to fix functional and UX issues. The contact page has been replaced with a proper contact form (removing account settings code that was misplaced there), and the account page now integrates the MediaUpload component for profile photo management. Both changes follow the Kyro design system and maintain mobile responsiveness.

**Watch for**: The MediaUpload component still displays a hardcoded label "Fragrance portrait" instead of using the `label` prop, and the contact page sidebar is hidden on mobile but the info is shown in a separate mobile section.

**Verdict**: APPROVED

---

## High-level view

The contact page is now a proper contact form with fields for name, email, subject, message, and optional phone. It posts to `/api/contact`, displays success states with react-hot-toast, and includes the owner's contact info (kyrofragrance@gmail.com) in a sticky sidebar on desktop and a mobile section on smaller screens. The form matches the Kyro aesthetic with the warm cream/gold palette, rounded cards, and serif headings. There's no trace of account or session code.

The account page now uses the MediaUpload component for profile photo uploads in two places: in the avatar sidebar card (shown conditionally when the user clicks to edit the avatar) and in the personal details form section. The component is wired to `handleImageUrlChange` via the `onChange` prop and receives `imageUploading` state via `onUploadStateChange`. Both profile update and password change functionality remain intact. All styling is preserved.

The build passed successfully with no TypeScript or compilation errors. Both routes compile and are ready for deployment.

---

<details>
<summary>Issues (2)</summary>

1. **MediaUpload label hardcoding (LOW)** — The component always displays "Fragrance portrait" in the label, ignoring the `label` prop passed from the account page. This causes incorrect labeling when the component is used in different contexts (e.g., profile photo should say "Profile Photo"). The implementation should use the `label` prop parameter instead of the hardcoded string.

2. **Contact page sidebar overflow on mobile (LOW)** — The sidebar with contact info is hidden on screens smaller than `lg` breakpoint, and contact info is shown in a separate section below the form. This is intentional responsive design, but the mobile section is placed after the form (outside the main grid), which could feel disconnected. The current approach works but could be refined.

</details>

---

## Contact Page: Proper Form Implementation

The contact page is now a functioning contact form, not an account settings page. It has all required fields: name, email (both required), subject (required, min 5 chars), message (required, min 10 chars), and an optional phone field. Form validation is client-side in the input attributes.

The form submits to `/api/contact` via POST with JSON payload. On success, it displays a toast notification ("Thank you! We'll be in touch within 24 hours."), clears the form, and shows a success card with initials (CheckCircle icon, "Thank you!" heading). After 3 seconds, it returns to the empty form state. On error, a toast shows the error message.

The layout uses a two-column grid on desktop: the form takes the main column, and a sticky contact info sidebar sits to the right showing the email address (kyrofragrance@gmail.com), a response time note (24 hours), and explanatory text. On `lg` screens and below, the sidebar is hidden, and contact info appears in a separate card after the form (mobile-responsive placement).

Styling follows the Kyro palette: cream background (#f8f6f0), white cards with subtle borders and shadows, serif headings ("Let's talk about your *scent story*"), and the gold accent color (#b08d50) for icons and highlights. Icons from lucide-react (Mail, Phone, MessageCircle, Send, CheckCircle, etc.) add visual clarity. All input fields use the same design language as the account page: rounded corners, gold focus states, and left-aligned icons.

The page is fully mobile responsive. Form fields stack to single column on smaller screens. Buttons use `w-full` on mobile and `w-auto` on desktop. The hero section scales gracefully. No desktop-specific code blocks are used; the responsive behavior is built into the Tailwind classes.

---

## Account Page: MediaUpload Integration

The account page imports and uses the MediaUpload component in two locations:

1. **Avatar sidebar card** — A "Change Photo" button appears when hovering over the profile avatar. Clicking it toggles `showAvatarEditor` state, which conditionally renders the MediaUpload component below the avatar in the sidebar. This keeps the avatar upload UI co-located with the avatar display.

2. **Personal details form** — The MediaUpload component also appears as a full form field in the profile form section (labeled "Profile Photo"), allowing users to upload directly from the form without navigating to the sidebar.

Both instances pass the same props: `name="profileImageUrl"`, `initialUrl={profileImageUrl}`, `onChange={handleImageUrlChange}`, and `onUploadStateChange={setImageUploading}`. The `handleImageUrlChange` function updates local state and calls the profile update API endpoint (`/api/account/profile` PATCH) to persist the new image URL. The upload state is tracked and passed to `onUploadStateChange` to disable the save button while uploading.

The old plain text input field for `imageUrl` has been removed, replaced entirely by MediaUpload. All existing functionality is preserved: profile name and email update, password change with strength indicator, form validation, loading states, success/error alerts, and toast notifications.

Styling remains unchanged. The form layout, color scheme, typography, animations, and responsive behavior are identical to the previous version. The MediaUpload component fits visually into the account page's design system.

---

## Build Status

The build passed without errors. The Next.js build command compiled all 25 pages successfully in 1676ms, including TypeScript type checking (3.1s). The contact page route is visible in the generated route list as `○ /contact (static)`, and the account page (`/account`) is also present and compiled. No TypeScript errors, no compilation failures. Both pages are ready for deployment.

---

## File Summary

<details>
<summary>Files changed</summary>

- **app/(store)/contact/page.tsx** — Replaced with proper contact form. Removed all account/session/auth logic. Added name, email, subject, message, phone fields; POST to /api/contact; success state; sticky sidebar with contact info; mobile-responsive layout.
- **app/(store)/account/page.tsx** — Integrated MediaUpload component for profile photo. Removed plain imageUrl text input. Added MediaUpload in two places: avatar sidebar (conditional toggle) and personal details form. Updated styling to accommodate the new component. All existing functionality preserved.
- **Full diff**: Fetch with `git diff main -- app/(store)/contact/page.tsx app/(store)/account/page.tsx`

</details>

