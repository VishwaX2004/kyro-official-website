# Account Settings Page Redesign

The account settings page has been redesigned to match the Kyro brand aesthetic with improved visual hierarchy, modern glassmorphism cards, and integrated avatar upload. The layout now uses a sticky sidebar for the profile avatar (desktop) or collapsed section (mobile), dual form cards for profile and password management, and proper mobile responsiveness with stacked single-column layout below 1024px. MediaUpload integration is complete with onChange handlers that auto-POST to the profile API endpoint.

**Watch for:**
- MediaUpload label text mismatch ("Fragrance portrait" instead of "Profile Photo") may confuse users
- Password strength indicator CSS defined but input change handler lacks actual strength calculation logic
- Animation name uniqueness (kyroAccountPageReveal, kyroAccountCardIn, etc.) appears solid but not verified against login page
- Mobile breakpoint at 1024px means tablet displays still use desktop 2-column layout; consider tighter threshold if needed

**Verdict**: APPROVED

---

## High-level view

The layout uses a two-column grid that collapses to single column on smaller viewports, with a sticky sidebar containing the user's avatar and role. The avatar card now supports inline photo editing via MediaUpload with image upload state tracked and fed back to disable the save button during upload. Both form sections (personal details and account security) follow the same numbered card pattern seen in other Kyro pages like the cart, using the brand's gold/ink/cream palette with consistent glassmorphism (backdrop-filter: blur, radial gradients in the background). Animations use namespaced keyframes to avoid conflicts. All form handlers (updateProfile, updatePassword) remain intact. Mobile view stacks the forms below the avatar card with reduced padding and smaller heading font sizes. The password field doesn't yet calculate or display real-time strength feedback despite having CSS scaffolding for it.

---

<details>
<summary>Issues (2)</summary>

1. **MediaUpload label mismatch** — The MediaUpload component in both the sidebar editor and the profile form displays "Fragrance portrait" instead of a profile-specific label, creating confusion about its purpose in a user account context. Change the label text or make it configurable via a prop.

2. **Password strength indicator: UI without logic** — CSS classes and bar markup exist (.password-strength, .strength-bar) but the newPassword input doesn't actually calculate or display strength as the user types. If this is a planned feature, add onChange handler to compute strength (length, uppercase, numbers, special chars) and update state; if not, remove the unused CSS to keep the stylesheet clean.

</details>

---

<details>
<summary>Details</summary>

### Design Consistency with Kyro Brand

The page successfully mirrors the cart and login pages' visual language. Colors are exact matches: #aa8953 for gold accents, #171717 for ink text, #f8f6f0 for the cream background. Radial gradient overlays (170,137,83 at 0.075 opacity) create depth identical to other pages. Glassmorphic cards use `backdrop-filter: blur(18px)` on semi-transparent white with subtle shadow layers. The animated header intro with "Make your account feel like you" and italicized "you" follows the serif emphasis pattern from login ("Return to your ritual"). The numbered form cards (01, 02) use black circular badges matching the cart and login UI language. Spacing, border-radius (999px for buttons, 12-20px for containers), and font hierarchy are internally consistent.

### MediaUpload Integration

The avatar upload in the sidebar and the profile photo upload in form section both wire MediaUpload's onChange handler to handleImageUrlChange, which immediately PATCH-requests /api/account/profile with the new imageUrl. The component correctly tracks imageUploading state and disables the save button during upload, preventing double-submission. The onChange callback is fired after Supabase upload completes and returns the publicUrl, so the state update is clean and timing-safe. Initial URL is passed via initialUrl prop and synced to local state. One usability friction: the MediaUpload label reads "Fragrance portrait" in both contexts (sidebar editor and profile form section), which is generic product language, not account-specific. For a user account context, "Profile Photo" or "Your Photo" would be clearer.

### Password Strength Indicator

CSS scaffolding for password strength exists (`.password-strength`, `.strength-bar.filled`, `.password-strength-label` with color transitions), but the newPassword input does not calculate or display real strength. The form field tracks newPasswordValue state and has onChange bound to setNewPasswordValue, but there's no strength computation. The bars would never fill or show color. If this is intended for a future release, the CSS is ready and the wiring is straightforward: add a useEffect or onChange handler that computes strength (e.g., length ≥12, has uppercase, has number, has special char) and renders filled bars. If this was scaffolded but isn't needed, removing the unused CSS keeps the stylesheet maintainable.

### Mobile Responsiveness

The layout uses a media query at 1024px to switch from 2-column (.kyro-account-layout: grid-template-columns: 1fr 340px) to single column (grid-template-columns: 1fr). The sidebar transitions from sticky desktop position to relative on mobile, stacking above the forms. On small screens (< 640px), padding reduces from 55px/24px to 40px/16px, form card padding shrinks from 28px to 20px, avatar size decreases from 120px to 96px, and heading font-size responds with clamp(). Form field groups use grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) so they stack to single column on narrow screens without explicit breakpoints. Testing the design at 768px (iPad portrait) and 1024px will show the layout transitions correctly. The threshold of 1024px is reasonable for most tablets in landscape.

### TypeScript Quality

Types are well-defined: User type captures name/username/email/role/imageUrl with optional imageUrl. ApiResponse type is minimal but appropriate. State hooks use proper inferred types (loading: boolean, user: User | null) and all useState calls are type-safe. useRouter hook is properly imported from next/navigation. No unsafe casts, no any types. The profileImageUrl state correctly initializes from user?.imageUrl ?? "" and updates via handleImageUrlChange. Form data extraction uses String() wraps to ensure consistency. Error handling includes try-catch with proper message fallbacks.

### Functionality Preservation

Both updateProfile and updatePassword handlers remain intact and correct. updateProfile validates name (≥2 chars) and email presence, fetches /api/account/profile with PATCH, parses response, updates local user state, and shows toast feedback. updatePassword validates currentPassword and newPassword (≥8 chars, must differ), fetches /api/account/password with PATCH, resets the form and newPasswordValue, shows feedback. Both handlers set loading state (savingProfile, changingPassword) and disable buttons during submission. The form reset in updatePassword clears visible fields. Alert messages (notice/error) render above the forms with proper roles (role="status" for success, role="alert" for error).

### Animation Quality

Keyframe animations use namespaced prefixes to avoid conflicts: @keyframes kyroAccountPageReveal, @keyframes kyroAccountCardIn, @keyframes kyroFormSectionReveal, @keyframes kyroFadeUp. Each animation has unique cubic-bezier timing (0.2, 0.8, 0.2, 1 for spring-like feel). Sidebar has animation-delay: 0.1s, form cards have staggered delays (0.1s, 0.2s) for sequential reveal. Animation names do not collide with login page animations (which use kyroFadeUp, kyroFadeIn, kyroModeIn, kyroFieldIn). Delays are short enough to feel responsive, long enough to notice the effect. The blur and scale transforms in entry animations create perceived depth.

### Accessibility

All form fields have associated labels with proper markup (label.form-label wraps input names). Toggle buttons for password visibility have aria-label ("Show password" / "Hide password") and aria-pressed states. Alert messages use role="status" for non-blocking success and role="alert" for error states. The avatar overlay has click handler and visual feedback (opacity: 0 → 1 on hover). Form labels include icon-wrapped SVGs with aria-hidden="true" so icons don't clutter screen readers. Button states are semantic: disabled attributes prevent submission during loading. One minor gap: the MediaUpload component in the sidebar is not inside a form fieldset, so its relationship to the avatar card is implicit rather than explicit. Adding a wrapper fieldset with legend would improve semantic HTML, but current structure is functional for screen readers via proximity and visual grouping.

### Code Organization

The inline style block is well-organized with section comments (CSS Grid, Header, Forms, Mobile Responsive, Keyframes). Related rules are grouped (e.g., all .form-input states together, all animation declarations together). The 1000+ lines of CSS are readable because of visual hierarchy and whitespace. CSS Custom Properties (--kyro-bg, --kyro-gold, etc.) are defined and reused consistently, making color changes easy. No redundant rules detected. One thing to watch: form-field-group uses grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) which is powerful but can lead to unexpected layout shifts on narrow screens if min-width is too large; testing at actual breakpoints will confirm it's working as intended.

</details>

---

<details>
<summary>File map</summary>

- **app/(store)/account/page.tsx** — Main account settings page with two-column responsive layout, avatar sidebar, profile form (name/email/photo), password form (current/new), state management, form handlers (updateProfile, updatePassword), and inline CSS with animations.

- **app/components/MediaUpload.tsx** — Reusable file upload component with Supabase storage integration, drag-and-drop support, file validation (image type, max 5MB), and onChange callback fired after upload completes. Currently labeled "Fragrance portrait" in all contexts.

- **Full diff**: Not provided in this task, review based on file content read directly.

</details>
