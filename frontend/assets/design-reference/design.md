# TurfX — Design System Reference

Source of truth for all frontend styling. This is the actual exported "TurfX Pro-Sport System" from Stitch — match these values exactly, don't approximate. Antigravity should treat this file plus the 8 attached screenshots as the complete design spec.

## Brand direction

Corporate/Modern aesthetic with high-contrast athletic accents — a bright, premium "Pro-League" feel rather than a dark "gamer" sports-app look. Personality: **trustworthy and energetic**. Heavy whitespace for an airy, professional environment; vibrant accent colors reserved specifically for action, performance, and status signals. Should feel like a clean, high-end physical stadium — clear surfaces, clear boundaries, vibrant highlights used sparingly and meaningfully.

## Colors

Use Tailwind config / CSS variables with these exact hex values — do not substitute approximate colors.

### Core surfaces
| Token | Hex | Usage |
|---|---|---|
| `background` / `surface` | `#f8f9fa` | Global page background |
| `surface-container-lowest` | `#ffffff` | Cards, primary containers |
| `surface-container-low` | `#f3f4f5` | Subtle nested containers |
| `surface-container` | `#edeeef` | Slightly deeper containers |
| `surface-container-high` | `#e7e8e9` | Hover states |
| `surface-container-highest` | `#e1e3e4` | Active/pressed states |
| `on-surface` | `#191c1d` | Primary text on light surfaces |
| `on-surface-variant` | `#464555` | Secondary/muted text |
| `outline` | `#777587` | Default borders |
| `outline-variant` | `#c7c4d8` | Subtle dividers |

### Primary — Electric Indigo (brand, primary actions, active nav)
| Token | Hex |
|---|---|
| `primary` | `#3525cd` |
| `on-primary` | `#ffffff` |
| `primary-container` | `#4f46e5` |
| `on-primary-container` | `#dad7ff` |

### Secondary — Stadium Green (availability, confirmations, growth metrics ONLY)
| Token | Hex |
|---|---|
| `secondary` | `#006c49` |
| `on-secondary` | `#ffffff` |
| `secondary-container` | `#6cf8bb` |
| `on-secondary-container` | `#00714d` |

### Tertiary — Performance Orange (peak-pricing alerts, urgent/high-demand slots)
| Token | Hex |
|---|---|
| `tertiary` | `#684000` |
| `on-tertiary` | `#ffffff` |
| `tertiary-container` | `#885500` |
| `on-tertiary-container` | `#ffd4a4` |

### Error
| Token | Hex |
|---|---|
| `error` | `#ba1a1a` |
| `on-error` | `#ffffff` |
| `error-container` | `#ffdad6` |
| `on-error-container` | `#93000a` |

**Color usage rule**: Indigo = brand/primary actions/navigation. Green = availability + success + confirmed/paid states, nothing else. Orange = peak pricing + urgency + warnings, nothing else. Don't mix these roles — e.g. never use orange for a primary button, never use green for a generic link.

## Typography

Two-font pairing: **Montserrat** for impact (headlines), **Inter** for utility (body/data).

| Style | Font | Size | Weight | Line height | Notes |
|---|---|---|---|---|---|
| `display-lg` | Montserrat | 48px | 700 | 56px | -0.02em letter-spacing |
| `headline-lg` | Montserrat | 32px | 700 | 40px | -0.01em letter-spacing; desktop page titles |
| `headline-lg-mobile` | Montserrat | 24px | 700 | 32px | mobile equivalent of headline-lg |
| `headline-md` | Montserrat | 20px | 600 | 28px | card headers, section titles |
| `body-lg` | Inter | 18px | 400 | 28px | |
| `body-md` | Inter | 16px | 400 | 24px | default body text |
| `label-md` | Inter | 14px | 600 | 20px | 0.05em letter-spacing, use ALL-CAPS for metadata/section labels (sports-broadcast style) |
| `caption` | Inter | 12px | 400 | 16px | timestamps, fine print |

Rule: headlines are always Montserrat Bold/Semi-Bold; body and data are always Inter; small metadata labels are Inter Semi-Bold in all-caps.

## Layout & spacing

- Grid: 12-column fluid grid on desktop, 4-column on mobile
- Base spacing scale: 4px half-step, 8px standard rhythm (`base: 4px, xs: 8px, sm: 12px, md: 16px, lg: 24px, xl: 32px`)
- Page margins: 48px on desktop, 16px on mobile
- Card grid gutters: 20-24px (`gutter: 20px`) — enough that card shadows never overlap or feel cluttered

## Elevation

Multi-layered ambient shadows only — never a harsh single-direction drop shadow.

- **Surface 0 (background)**: `#F8F9FA`, no shadow
- **Surface 1 (cards, inputs)**: white, "Soft Drop" — `0px 2px 4px rgba(0,0,0,0.05)`
- **Surface 2 (interactive/floating, e.g. sticky checkout bar)**: white, "Performance Shadow" — `0px 10px 15px -3px rgba(0,0,0,0.08), 0px 4px 6px -2px rgba(0,0,0,0.04)`
- **Borders**: `1px solid #E5E7EB` for low-elevation containment where a shadow would be too much

## Shapes / border radius

| Token | Value | Usage |
|---|---|---|
| `sm` | 4px | inner-nested elements inside a padded 12px container |
| `DEFAULT` / `md` | 12px | standard — cards, buttons, inputs |
| `lg` | 16-24px | major sections, promo banners |
| `full` | 9999px | pills, badges, chips |

## Components

**Buttons**
- Primary: `#4F46E5` background, white text, Montserrat Semi-Bold, 12px radius, subtle lift shadow on hover
- Never use orange or green for primary CTAs — indigo only

**Chips** (e.g. filter/duration selectors)
- Active: light indigo background `#EEF2FF`, indigo text
- Inactive: light gray background `#F3F4F6`

**Input fields**
- White background, `1px solid #D1D5DB` border
- Focus state: border shifts to primary indigo + 3px soft indigo outer glow box-shadow

**Cards**
- White background, 12px radius, Surface 1 shadow
- Card headers use Montserrat Medium

**Status badges** (slot availability, payment status — must be consistent everywhere)
- Available / Paid / Confirmed → pill badge, Stadium Green `#10B981` at 10% opacity background, solid green text
- Peak pricing / Pending / Urgent → pill badge, Performance Orange background at 10% opacity, solid orange text
- Booked / Blocked / Failed → gray or error-container background, matching darker text

**Data grids / lists** (admin bookings table)
- Horizontal dividers only, `#F3F4F6` — no vertical lines, keeps the airy look
- Row data in Inter Medium

**Match Card** (specialized — e.g. slot card or booking summary card)
- Subtle vertical accent bar on the left edge, using secondary (green) or tertiary (orange) color to indicate category/urgency

## Screens → routes

| Screen | Source file | Route |
|---|---|---|
| Home | TurfX_Home (Light Mode) | `/` |
| Book a Slot | Book a Slot_ TurfX (Light Mode) | `/book` |
| Checkout | Checkout_ TurfX (Light Mode) | `/checkout` |
| Booking Confirmed | Booking Confirmed!_ TurfX (Light Mode) | `/confirmation` |
| Admin Login | Admin Login_ TurfX (Light Mode) | `/admin/login` |
| Admin Dashboard | Admin Dashboard_ TurfX (Light Mode) | `/admin` |
| Manage Slots | Manage Slots_ TurfX (Light Mode) | `/admin/slots` |
| Bookings List | Bookings List_ TurfX (Light Mode) | `/admin/bookings` |

## Non-negotiables

- Exact hex values above, no approximated/similar colors
- Green reserved strictly for availability/success/paid states; orange strictly for peak-pricing/urgency/pending; indigo for all primary actions and navigation — never swap these roles
- Consistent badge styling for slot status and payment status across every screen they appear on (booking calendar, admin slots, admin bookings list, admin dashboard)
- Montserrat for all headlines, Inter for all body/data text — no substitutions
- Mobile-first responsive layout for customer-facing screens (Home, Book a Slot, Checkout, Confirmation); admin screens can be desktop-optimized
- 12px radius as the default for all cards, buttons, and inputs unless otherwise specified above