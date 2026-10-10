# Account Settings Page Redesign Plan

## Overview
Redesign the user account settings page at `app/(store)/account/page.tsx` to match Kyro's modern, elegant brand aesthetic with full mobile responsiveness, MediaUpload integration for avatar management, and improved UI/UX while maintaining desktop view integrity.

---

## Design Language Reference (from exploration)

### Color Palette
From `globals.css` and design system:
- **Primary text**: `#171717` (--ink)
- **Muted text**: `#4a3530` (--muted)
- **Gold accent**: `#9a7540` (--gold), darker variant `#8d7144`, light variant `#a58551`, `#96733d`
- **Background**: `#f8f6f0` (light cream), `#f3eee5`, `#fbfaf7`
- **Surface**: `#fffefa`, white with 0.8+ opacity
- **Borders**: `rgba(23, 23, 23, 0.10)`, `rgba(176, 141, 80, 0.2-0.35)`
- **Line elements**: `#b08d50` (gold rule), `#d4c4b8` (line token)

### Typography Patterns (from contact/login pages)
- Headings: `font-serif` with `italic` for emphasis, `tracking-[-0.045em]` for tightness
- Accents: Use `<em>` with `font-serif not-italic` for gold color callouts
- Labels: `text-[11px] font-semibold uppercase tracking-[0.14em]` (Lucide icons optional)
- Body text: `text-sm leading-6 text-black/60` or `text-[15px] leading-7`
- Small hints: `text-[11px] leading-5 text-black/35`

### Layout Patterns
- **Desktop**: Two-column grid: `lg:grid-cols-[0.72fr_1.28fr]` (profile sidebar + main content)
- **Mobile**: Single column stack, full-width
- **Spacing**: `px-4 sm:px-6 lg:px-10`, `py-8 sm:py-12 lg:py-16`
- **Cards**: `rounded-[26px] border border-black/[0.07] bg-white/90 shadow-[0_18px_60px_rgba(0,0,0,0.045)] backdrop-blur-xl`

### Animation & Motion
From login page `<style>` block:
- `kyroFadeUp`: `from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); }` — 800ms cubic-bezier(0.2, 0.8, 0.2, 1)
- `kyroFadeIn`: `from { opacity: 0; } to { opacity: 1; }` — 700ms ease-out
- `kyroSlideUp`: 0.75s cubic-bezier(0.2, 0.8, 0.2, 1)
- New keyframes needed: `kyroAccountPageReveal` (similar to cart `kyroPageReveal`), `kyroFieldReveal` for form sections
- Hover transform: `hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.2)]`

### Component Patterns
From cart page inline `<style>`:
- Use `dangerouslySetInnerHTML` pattern with inline `<style>` tag for CSS
- Define CSS variables at top: `--kyro-bg`, `--kyro-surface`, `--kyro-paper`, `--kyro-ink`, `--kyro-gold`, `--kyro-line`, etc.
- Background: radial-gradient + linear-gradient overlay for depth
- Cards: transparent background + backdrop-filter blur + border + shadow
- Eyebrow section: gold text with `::before` line element
- Page reveal: staggered animations on load

---

## State Management (TypeScript)

### New State Variables (in addition to existing)
```typescript
// Existing: user, loading, notice, error, savingProfile, changingPassword

// NEW: Profile image upload state
const [profileImageUrl, setProfileImageUrl] = useState<string>(user?.imageUrl ?? "");
const [imageUploading, setImageUploading] = useState<boolean>(false);
```

### MediaUpload Integration
- Pass `onChange` callback: `(url: string) => { setProfileImageUrl(url); }`
- Pass `onUploadStateChange` callback: `(uploading: boolean) => { setImageUploading(uploading); }`
- Update hidden input name: `name="imageUrl"` with value from MediaUpload onChange
- Disable profile save button when image is uploading: `disabled={savingProfile || imageUploading}`

---

## JSX Structure (High-Level)

```
<main class="kyro-account-page">
  <style dangerouslySetInnerHTML={{ __html: `...` }} />
  
  <section class="kyro-account-container">
    {/* Desktop: relative positioned pseudo-backdrop blurs */}
    {/* Eyebrow + breadcrumb at top */}
    
    <div class="kyro-account-layout">
      {/* LEFT COLUMN: Profile Sidebar (sticky on desktop, full-width on mobile) */}
      <aside class="kyro-account-sidebar">
        {/* Avatar with initials or image */}
        {/* User name, email, role badge */}
        {/* Info icons + feature highlights */}
        {/* Quote card */}
      </aside>
      
      {/* RIGHT COLUMN: Main Forms */}
      <div class="kyro-account-forms">
        {/* Page header: eyebrow, title, description */}
        {/* Alert banners: success, error */}
        
        {/* FORM 1: Personal Details */}
        <form class="kyro-account-form">
          {/* Header with icon + label + description */}
          {/* Name field + Email field (2-col on desktop, 1-col on mobile) */}
          {/* NEW: MediaUpload component for avatar */}
          {/* Save button */}
        </form>
        
        {/* FORM 2: Account Security */}
        <form class="kyro-account-form">
          {/* Header with icon + label + description */}
          {/* Current password + New password (2-col on desktop) */}
          {/* Security hint card */}
          {/* Update button */}
        </form>
        
        {/* Footer note */}
      </div>
    </div>
  </section>
</main>
```

---

## CSS Architecture (Inline `<style>` Tag)

### Design Decisions
1. **CSS Variables**: Define at root of `.kyro-account-page` for color/spacing consistency
2. **Responsive Layout**: Use CSS Grid with `auto-fit` or media queries (no Tailwind)
3. **Animations**: Keyframes defined in style block; staggered via inline `animation-delay`
4. **Blur Backgrounds**: Fixed pseudo-elements with `radial-gradient` + `blur-3xl`
5. **Form Styling**: Input borders on focus, hover states, icon overlays with `position: absolute + left: 3.5px`

### New Keyframe Names (must not conflict)
- `kyroAccountPageReveal`: similar to cart page reveal, 0.7s ease both
- `kyroFormSectionReveal`: 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) for each form
- `kyroAvatarUploadPulse`: subtle pulse on upload state (optional, 1.2s infinite)

### CSS Class Structure
```
.kyro-account-page {
  --kyro-bg: #f8f6f0;
  --kyro-surface: #fffefa;
  --kyro-paper: #fbfaf7;
  --kyro-ink: #171717;
  --kyro-gold: #9a7540;
  --kyro-gold-dark: #8d7144;
  --kyro-gold-light: #a58551;
  --kyro-muted: #4a3530;
  --kyro-line: rgba(23, 23, 23, 0.10);
  --kyro-line-gold: rgba(176, 141, 80, 0.20);
}

.kyro-account-container {
  min-height: 100vh;
  padding: 55px 24px 100px;
  background: radial-gradient(...) + linear-gradient(...);
}

.kyro-account-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;  /* RIGHT SIDEBAR ON DESKTOP */
  gap: 22px;
  max-width: 1180px;
  margin: 0 auto;
  align-items: start;
}

/* MOBILE: single column */
@media (max-width: 1024px) {
  .kyro-account-layout {
    grid-template-columns: 1fr;
  }
}

.kyro-account-sidebar {
  position: sticky;
  top: 95px;
  /* card styling */
}

.kyro-account-forms {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.kyro-account-form {
  border: 1px solid var(--kyro-line);
  border-radius: 20px;
  background: rgba(255, 254, 250, 0.9);
  padding: 28px;
  animation: kyroFormSectionReveal 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.kyro-account-form:nth-child(n+3) {
  animation-delay: 0.1s;
}

.kyro-account-form:nth-child(n+4) {
  animation-delay: 0.2s;
}

/* Form header */
.account-form-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--kyro-line);
}

.account-form-number {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: var(--kyro-ink);
  color: white;
  font-weight: 700;
  font-size: 16px;
}

.account-form-title {
  flex: 1;
}

.account-form-title h3 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 650;
  color: var(--kyro-ink);
}

.account-form-title p {
  margin: 0;
  font-size: 13px;
  color: var(--kyro-muted);
  line-height: 1.6;
}

/* Form fields */
.form-field-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 18px;
  margin-bottom: 18px;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: var(--kyro-ink);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.form-label small {
  font-weight: 400;
  color: var(--kyro-muted);
  letter-spacing: normal;
  text-transform: none;
  font-size: 10px;
}

.form-input-wrapper {
  position: relative;
  display: block;
}

.form-input {
  width: 100%;
  min-height: 44px;
  padding: 11px 16px 11px 44px;  /* left space for icon */
  border: 1px solid var(--kyro-line);
  border-radius: 12px;
  background: rgba(255, 254, 250, 0.95);
  color: var(--kyro-ink);
  font-size: 13px;
  line-height: 1.5;
  outline: none;
  transition: all 0.3s ease;
}

.form-input::placeholder {
  color: var(--kyro-muted);
  opacity: 0.6;
}

.form-input:hover {
  border-color: rgba(176, 141, 80, 0.3);
  background: white;
}

.form-input:focus {
  border-color: var(--kyro-gold);
  background: white;
  box-shadow: 0 0 0 3px rgba(176, 141, 80, 0.15);
}

.form-input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--kyro-gold-dark);
  font-size: 16px;
  pointer-events: none;
}

/* Password strength indicator (optional, future-proofing) */
.password-strength {
  margin-top: 8px;
  display: flex;
  gap: 4px;
}

.strength-bar {
  flex: 1;
  height: 2px;
  border-radius: 1px;
  background: var(--kyro-line);
  transition: background 0.3s ease;
}

.strength-bar.weak {
  background: #c85d5d;
}

.strength-bar.fair {
  background: #d4a574;
}

.strength-bar.good {
  background: #7f9b70;
}

/* Buttons */
.account-save {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 24px;
  border: none;
  border-radius: 999px;
  background: var(--kyro-ink);
  color: white;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.account-save::before {
  content: '';
  position: absolute;
  left: -100%;
  top: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: skewX(-20deg);
  transition: left 0.6s ease;
}

.account-save:hover::before {
  left: 135%;
}

.account-save:hover {
  transform: translateY(-2px);
  background: #2b2b2b;
  box-shadow: 0 10px 28px rgba(23, 23, 23, 0.15);
}

.account-save:active {
  transform: translateY(0);
}

.account-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.account-save.secondary {
  background: transparent;
  border: 1px solid rgba(176, 141, 80, 0.4);
  color: var(--kyro-gold-dark);
}

.account-save.secondary:hover {
  border-color: rgba(176, 141, 80, 0.7);
  background: rgba(176, 141, 80, 0.08);
  color: var(--kyro-gold-dark);
}

/* Spinner animation */
.button-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Alerts */
.account-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid;
  border-radius: 14px;
  margin-bottom: 16px;
  font-size: 12px;
  animation: kyroFadeUp 0.5s ease-out;
}

.account-alert.success {
  border-color: rgba(34, 197, 94, 0.2);
  background: rgba(34, 197, 94, 0.05);
  color: #15803d;
}

.account-alert.error {
  border-color: rgba(220, 38, 38, 0.2);
  background: rgba(220, 38, 38, 0.05);
  color: #991b1b;
}

.account-alert span {
  flex: 0 0 auto;
  font-weight: 700;
}

/* Profile sidebar */
.account-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid var(--kyro-gold);
  background: radial-gradient(circle at 50% 45%, #ffffff 0%, #f3eee5 58%, #e7e1d5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--kyro-gold-dark);
  font-weight: 700;
  font-size: 28px;
  margin-bottom: 16px;
  overflow: hidden;
}

.account-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Loading state */
.account-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--kyro-bg);
}

.account-loading-content {
  text-align: center;
}

.account-spinner {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  border: 3px solid var(--kyro-line);
  border-top-color: var(--kyro-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* MediaUpload integration */
.media-upload {
  margin-bottom: 18px;
}

.media-upload-label {
  display: block;
  margin-bottom: 8px;
  color: var(--kyro-ink);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.media-dropzone {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  padding: 20px;
  border: 2px dashed var(--kyro-line);
  border-radius: 16px;
  background: rgba(255, 254, 250, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.media-dropzone:hover {
  border-color: rgba(176, 141, 80, 0.4);
  background: rgba(176, 141, 80, 0.02);
}

.media-dropzone.drag-active {
  border-color: var(--kyro-gold);
  background: rgba(176, 141, 80, 0.08);
}

.media-dropzone.has-image {
  border-style: solid;
  border-width: 1px;
  background: rgba(255, 254, 250, 0.9);
  min-height: auto;
}

.media-preview {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  border-radius: 14px;
  opacity: 0.3;
}

.media-placeholder {
  font-size: 32px;
  color: var(--kyro-gold);
  margin-right: 12px;
}

.media-copy {
  display: flex;
  flex-direction: column;
  text-align: center;
  pointer-events: none;
}

.media-copy strong {
  display: block;
  margin-bottom: 4px;
  color: var(--kyro-ink);
  font-size: 13px;
  font-weight: 600;
}

.media-copy small {
  display: block;
  color: var(--kyro-muted);
  font-size: 11px;
  line-height: 1.5;
}

.media-error {
  display: block;
  margin-top: 8px;
  color: #991b1b;
  font-size: 11px;
}

/* Misc */
.account-role {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(176, 141, 80, 0.1);
  color: var(--kyro-gold-dark);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.account-email {
  margin: 0;
  color: var(--kyro-muted);
  font-size: 13px;
}

.admin-kicker {
  display: block;
  margin-bottom: 8px;
  color: var(--kyro-gold-dark);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.store-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--kyro-gold-dark);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.store-eyebrow::before {
  content: '';
  width: 20px;
  height: 1px;
  background: var(--kyro-gold);
}

/* Keyframes */
@keyframes kyroAccountPageReveal {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes kyroFormSectionReveal {
  0% {
    opacity: 0;
    transform: translateY(14px) scale(0.98);
    filter: blur(1px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

@keyframes kyroFadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes kyroFieldReveal {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Responsive tweaks */
@media (max-width: 1024px) {
  .kyro-account-page {
    padding: 45px 20px 80px;
  }
  
  .kyro-account-layout {
    grid-template-columns: 1fr;
  }
  
  .kyro-account-sidebar {
    position: relative;
    top: auto;
  }
  
  .form-field-group {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .kyro-account-page {
    padding: 40px 16px 60px;
  }
  
  .kyro-account-form {
    padding: 20px 16px;
  }
  
  .account-form-header {
    flex-direction: column;
  }
  
  .form-label {
    font-size: 10px;
  }
}
`,
        }}
      />
    </main>
  );
}
```

---

## Implementation Checklist

### Step 1: Restructure JSX
- [ ] Replace the entire `<main>` element with new `.kyro-account-page` structure
- [ ] Add eyebrow section at top with "THE PRIVATE EDIT" label and updated heading
- [ ] Reorganize sidebar and forms into proper desktop/mobile grid layout
- [ ] Add profile avatar, user details, role badge to sidebar
- [ ] Ensure all form field structure matches pattern (label → input wrapper → icon overlay)

### Step 2: Integrate MediaUpload Component
- [ ] Import `MediaUpload` component
- [ ] Replace the current image URL text input with `<MediaUpload name="imageUrl" initialUrl={user.imageUrl} onChange={handleImageUrlChange} onUploadStateChange={setImageUploading} />`
- [ ] Add new state: `profileImageUrl` and `imageUploading`
- [ ] Update form submission to use `profileImageUrl` if changed
- [ ] Disable save button when image uploading: `disabled={savingProfile || imageUploading}`

### Step 3: Apply Inline CSS with `<style dangerouslySetInnerHTML>`
- [ ] Add complete `<style>` block with all CSS variables and classes above
- [ ] Define all keyframes: `kyroAccountPageReveal`, `kyroFormSectionReveal`, `kyroFadeUp`, `kyroFieldReveal`
- [ ] Apply animations to sections with staggered delays
- [ ] Test responsiveness at breakpoints: 1024px, 640px

### Step 4: Password Strength Indicator (Optional)
- [ ] Add visual password strength indicator in new password field (optional enhancement)
- [ ] Use `.password-strength` bars with classes: `weak`, `fair`, `good`
- [ ] Calculate strength on input change (min 8 chars = base, check for variety, etc.)

### Step 5: Mobile Responsiveness Verification
- [ ] Desktop (>1024px): two-column layout, sidebar sticky
- [ ] Tablet (768px-1024px): single column, forms full-width
- [ ] Mobile (<640px): single column, adjusted padding, form fields stack
- [ ] Test form field groups collapse to single column on mobile

### Step 6: Accessibility & Polish
- [ ] Ensure form labels are properly associated with inputs
- [ ] Add `aria-label` to icon-only buttons (password toggle)
- [ ] Test keyboard navigation: Tab through all inputs, buttons, links
- [ ] Verify color contrast on focus states and disabled states
- [ ] Test animation performance on lower-end devices (reduce motion if needed)

### Step 7: Testing & Verification
- [ ] Load account page and verify no TypeScript errors
- [ ] Test form submission with profile updates
- [ ] Test MediaUpload: drag-drop, click to browse, image preview
- [ ] Test password change form
- [ ] Verify success/error alerts display correctly
- [ ] Test loading state spinner
- [ ] Desktop: verify sidebar sticky on scroll, layout correct
- [ ] Mobile: verify full-width, single column, form fields stack
- [ ] Verify animations play on page load and form transitions

---

## File Changes Summary

- **File to modify**: `app/(store)/account/page.tsx`
- **Components to import**: `MediaUpload` (already exists at `app/components/MediaUpload.tsx`)
- **Styling approach**: Inline `<style dangerouslySetInnerHTML>` (consistent with cart/login pages)
- **No new files needed**: All existing utilities and components available
- **Build/test command**: `npm run dev` for development, `npm run build` for production check

---

## Design Rationale

### Layout Decision: Two-Column Desktop / Single-Column Mobile
- **Desktop**: Profile sidebar on right (sticky, 72% content + 28% sidebar) matches common SaaS patterns and gives user's info persistent visibility
- **Mobile**: Single-column stack ensures form fields have full width for touch interaction
- **Rationale**: Contact page uses the same pattern successfully; responsive grid with media queries handles the transition

### CSS Approach: Inline `<style>` over Tailwind
- **Rationale**: Cart and login pages use inline `<style>` for complex animations, gradients, and reusable CSS variables. Consistent with codebase pattern. Allows centralized keyframe definitions and CSS variable theming.

### MediaUpload Integration: onChange Callback
- **Rationale**: MediaUpload already supports `onChange` callback, so no need for a separate upload endpoint. Auto-saves image to Supabase on drop/select, then returns public URL via callback.
- **User experience**: No extra "upload" button needed; image is ready immediately after drag-drop, improving perceived performance.

### Password Strength Indicator: Optional
- **Rationale**: Security best practice; helps users understand password quality in real-time. Implementation is self-contained in CSS with optional JS logic (can be added later if needed).

### Avatar with Initials Fallback
- **Rationale**: Consistent with contact page and current account page design. Uses user's name to generate initials if no image provided.

### Color & Typography: Match Contact Page
- **Rationale**: Contact page represents the latest Kyro design system. Using same colors, font sizes, spacing ensures design coherence across store pages.

---

## Future Enhancements (Out of Scope)
1. Two-factor authentication section
2. Login history / active sessions management
3. Notification preferences
4. Export account data
5. Account deletion with confirmation flow
6. Social media account linking
