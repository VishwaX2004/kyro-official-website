# Implementation Plan: Contact & Account Pages

## Overview
Two key pages require fixes:
1. **Contact Page** (`app/(store)/contact/page.tsx`): Currently contains account settings code instead of contact form logic. Must be completely rewritten as a proper visitor contact form.
2. **Account Page** (`app/(store)/account/page.tsx`): Already has good structure and working account logic. Only needs MediaUpload component integrated to replace the plain text image URL input.

---

## Analysis Summary

### Current State
- **Contact page** has wrong code (copied account logic with session fetching, password management, etc.)
- **API endpoint** `/api/contact/route.ts` exists and works correctly: accepts `{name, email, subject, message}`, saves to MongoDB, returns success message
- **MediaUpload component** at `app/components/MediaUpload.tsx` is fully functional: takes `name`, `initialUrl`, `onChange`, `onUploadStateChange` props; calls onChange with Supabase URL after upload
- **Account page** already has:
  - Session loading and auth checks ✓
  - Profile update form with name/email ✓
  - Password change form ✓
  - Error/success handling with toast ✓
  - Kyro aesthetic styling ✓
  - Currently has a plain text `imageUrl` input that needs replacement

### Key Decisions
1. **Contact page**: New simple form with 5 fields (Name, Email, Subject, Message, optional Phone), no session/auth needed, POST to `/api/contact`, show owner email `kyrofragrance@gmail.com`, use existing Kyro design system
2. **Account page**: Keep all existing logic, swap the plain `imageUrl` input field for MediaUpload component, wire MediaUpload's `onChange` callback to existing `handleImageUrlChange` function
3. **Styling**: Both pages use the same warm gold/cream Kyro palette (`#b08d50` gold, `#f8f6f0` cream bg, Georgia serif for headings), rounded cards, soft shadows

---

## Implementation Plan

- [ ] 1. Rewrite Contact Page — complete replacement with proper contact form.
      Remove all account/session logic. Create form with Name, Email, Subject, Message, optional Phone.
      Submit to `/api/contact` endpoint. Show success toast on submit. Display owner contact info `kyrofragrance@gmail.com`.
      Match Kyro aesthetic: use same color tokens, serif headings, rounded cards, soft shadows.
      Add mobile-responsive grid layout using Tailwind.
      Files: `app/(store)/contact/page.tsx`
      Verify: `npm run build` completes without errors. No TypeScript errors in contact page.

- [ ] 2. Integrate MediaUpload into Account Page — replace plain text `imageUrl` input with MediaUpload component.
      Remove the text input with `name="imageUrl"` from the profile form.
      Import MediaUpload component at top of file.
      Add MediaUpload component in place of the removed input, passing: `name="imageUrl"`, `initialUrl={profileImageUrl}`, `onChange={handleImageUrlChange}`.
      Verify existing `handleImageUrlChange` function remains unchanged and wires correctly (it already updates the API and shows toast).
      Wire `onUploadStateChange` to set image uploading state (already declared: `imageUploading` state variable exists but not used yet).
      Keep all other profile and password form logic unchanged.
      Files: `app/(store)/account/page.tsx`
      Verify: `npm run build` completes without errors. Form shows MediaUpload component instead of text input. Image upload works and calls API.

---

## File-by-File Details

### 1. app/(store)/contact/page.tsx (NEW)

**Structure:**
- "use client" directive
- Imports: React hooks (FormEvent, useState), Next Image, lucide-react icons (Mail, Phone, MessageCircle, Send, etc.), react-hot-toast
- State variables:
  - `formData`: {name, email, subject, message, phone}
  - `loading`: boolean for submit button disabled state
  - `status`: "idle" | "success" | "error"
  - `errorMessage`: string for error display
  
**Form Fields:**
- Name (required, min 2 chars) — icon: UserRound
- Email (required, valid email) — icon: Mail
- Subject (required, min 5 chars) — icon: MessageCircle  
- Message (required, min 10 chars) — icon: MessageCircle
- Phone (optional) — icon: Phone

**Submit Handler:**
- Validate all fields
- POST to `/api/contact` with {name, email, subject, message}
- On success: show toast "Thank you! We'll be in touch within 24 hours.", reset form, show success state for 3s
- On error: show toast with error message, display error in page

**Layout:**
- Hero section: "Get in Touch" heading, Kyro aesthetic background gradients
- Form card: rounded-[26px], border-black/[0.07], bg-white/90, shadow like account page
- Owner contact info: "Reach us at: kyrofragrance@gmail.com"
- Mobile responsive: single column on mobile, centered max-w-2xl on desktop
- Use same color palette: #b08d50 gold, #f8f6f0 cream, Georgia serif headings

**Styling approach:**
- Copy design patterns from `app/(store)/account/page.tsx`: same cards, borders, shadows, colors
- Use Tailwind classes consistently (no inline styles for colors; use hex in className)
- Form labels: "text-[11px] font-semibold tracking-[0.14em] text-black/65"
- Inputs: rounded-xl, border-black/[0.09], focus:border-[#b08d50], focus:ring-4 focus:ring-[#b08d50]/10
- Buttons: inline-flex, min-h-12, bg-[#171717], hover:bg-[#302a20], rounded-xl

---

### 2. app/(store)/account/page.tsx (INTEGRATION)

**Current state:**
- Line 39-44: Plain text input `<input className={...} name="imageUrl" type="url" ... />`
- Existing `handleImageUrlChange(url: string)` function at lines 96-119 — already does API call and toast
- State variable `profileImageUrl` already declared and wired
- State variable `imageUploading` already declared (line 31) but not used

**Changes to make:**

1. **Add import** at top of file (after other imports):
   ```typescript
   import MediaUpload from "@/app/components/MediaUpload";
   ```

2. **Replace the plain image input** (currently lines 438-443):
   - **Remove:**
     ```typescript
     <label className="block min-w-0">
       <FieldLabel hint="Optional · public image URL">Profile image</FieldLabel>
       <span className="relative block">
         <ImageIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
         <input className={`${inputClass} pl-10`} name="imageUrl" type="url" defaultValue={user.imageUrl ?? ""} placeholder="https://example.com/profile.jpg" autoComplete="url" />
       </span>
       <span className="mt-2 block text-[11px] leading-5 text-black/35">Use a direct link to an image you want to use as your profile photo.</span>
     </label>
     ```
   - **Replace with:**
     ```typescript
     <MediaUpload 
       name="imageUrl"
       initialUrl={profileImageUrl}
       label="Profile photo"
       onChange={handleImageUrlChange}
       onUploadStateChange={setImageUploading}
     />
     ```

3. **Remove the ImageIcon import** (it's no longer needed):
   - Find the import statement with `Image as ImageIcon` and remove it from the lucide-react import

4. **Verify `handleImageUrlChange` function** remains unchanged:
   - It already accepts a URL string from MediaUpload's onChange callback
   - It already does the PATCH API call to `/api/account/profile` 
   - It already shows toast notifications
   - It already updates the `user` state and `profileImageUrl` state
   - No changes needed to this function

**What NOT to change:**
- All profile update logic (name, email form) stays the same
- All password change logic stays the same
- All existing state variables remain
- All styling, layout, typography remains
- Session loading, auth checks, error handling all remain

---

## Verification Steps

### Contact Page
1. Run `npm run build`
   - Expected: No TypeScript errors, build succeeds
2. Verify no imports of account/session logic remain
3. Test form submission:
   - Fill form with valid data, submit
   - Check browser console for successful POST to `/api/contact`
   - Verify toast shows success message
   - Confirm form resets after submission

### Account Page
1. Run `npm run build`
   - Expected: No TypeScript errors, build succeeds
2. Verify MediaUpload imports and renders
3. Test profile update:
   - Upload an image via MediaUpload component
   - Verify upload completes and shows in the form
   - Submit profile form
   - Check browser console for PATCH to `/api/account/profile` includes imageUrl
   - Verify toast shows success and avatar updates
4. Test that old imageUrl input field no longer exists

---

## Design System Constants (For Reference)

**Colors:**
- Gold: `#b08d50` (primary), `#a58551`, `#96733d` (dark variants)
- Text: `#171717` (black), `#777268` (muted), `#57534e` (lighter muted)
- Background: `#f8f6f0` (cream), `#fffefa` (off-white), `#fbfaf7` (paper)
- Borders: `rgba(23, 23, 23, 0.10)` (line), `rgba(176, 141, 80, 0.20)` (gold line)

**Typography:**
- Headings: `font-serif text-[2.55rem]` (Georgia)
- Labels: `text-[11px] font-semibold tracking-[0.14em]`
- Body: `text-sm` or `text-[13px]`

**Components:**
- Cards: `rounded-[26px] border border-black/[0.07] bg-white/90 shadow-[0_18px_60px_rgba(0,0,0,0.045)]`
- Inputs: `rounded-xl border border-black/[0.09] focus:border-[#b08d50] focus:ring-4 focus:ring-[#b08d50]/10`
- Buttons: `bg-[#171717] hover:bg-[#302a20] rounded-xl min-h-12`

---

## Notes
- Contact page is a complete rewrite with no account functionality
- Account page is a minimal change: one component swap with existing logic
- Both pages maintain mobile responsiveness via Tailwind responsive classes
- Both use Kyro's established design system for consistency
