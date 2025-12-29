# On-Chain CV Proof Vault - Design Guidelines

## Design Approach
**System-Based with Modern Professional Aesthetic**
Drawing from Material Design principles and modern SaaS applications like Linear, Stripe, and Vercel, emphasizing clarity, trust, and professionalism suitable for HR/recruiting context with a blockchain edge.

## Core Design Principles
1. **Trust & Credibility**: Clean, professional interface that inspires confidence
2. **Clarity Over Complexity**: Every element serves a clear purpose
3. **Progressive Disclosure**: Show information when needed, avoid overwhelming users
4. **Security-Forward Visual Language**: Subtle blockchain/verification aesthetic without being cryptic

## Typography
- **Primary Font**: Inter or DM Sans (via Google Fonts) for modern, professional readability
- **Font Hierarchy**:
  - Hero/H1: 3xl-4xl, font-bold (48-56px)
  - H2 Sections: 2xl-3xl, font-semibold (32-40px)
  - H3 Cards/Components: xl, font-semibold (24px)
  - Body: base, font-normal (16px)
  - Small/Meta: sm, font-medium (14px)
  - Labels: xs, font-medium, uppercase tracking-wide (12px)

## Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Form spacing: gap-6 between fields
- Card padding: p-8 on desktop, p-6 on mobile
- Section spacing: py-16 to py-24
- Container max-width: max-w-6xl for content, max-w-md for forms

## Component Library

### Navigation
- **Header**: Fixed top, backdrop blur with subtle border-b
  - App name/logo left, navigation links right
  - Links: "Register CV" | "Verify" | "About"
  - Height: h-16, clean horizontal layout

### Landing Page
- **Hero Section**: 
  - Centered content, py-20 to py-32
  - Large headline emphasizing "Tamper-Proof CV Verification"
  - Subheadline explaining blockchain-backed proof
  - Two prominent CTA buttons (Register CV - primary, Verify CV - secondary) with gap-4
  - Optional: Subtle grid pattern or blockchain-inspired decorative element in background
  
- **Features Section**: 
  - 3-column grid on desktop (grid-cols-1 md:grid-cols-3)
  - Each feature card: icon top, title, description
  - Icons: Shield (security), Link (blockchain), Check (verification)
  - Cards with subtle border, rounded-lg, p-6

- **How It Works**: 
  - Two-column layout separating "For Candidates" and "For Recruiters"
  - Step-by-step numbered list (1-4 steps each)
  - Clean typography hierarchy

### Forms (Register CV Page)
- **Card Container**: Centered, max-w-2xl, rounded-xl, border, p-8
- **File Upload**: 
  - Large dropzone area with dashed border-2
  - Icon: Upload cloud or document
  - Text: "Drop PDF here or click to browse"
  - Active state: border color change
  
- **Wallet Input**: 
  - Label above, full-width input
  - Placeholder: "0x..."
  - Helper text below explaining format
  
- **Submit Button**: 
  - Full-width, h-12, rounded-lg
  - Primary color, font-semibold
  - Loading state: spinner + "Processing..."

### Success Screen
- **Centered Card**: max-w-2xl
- **Success Icon**: Large checkmark in circle, mb-6
- **Proof Code Display**: 
  - Monospace font (font-mono)
  - Background surface with p-4, rounded-lg
  - Copy button integrated right side
  
- **Shareable URL**: 
  - Similar treatment as proof code
  - Full URL display with copy button
  
- **Action Buttons**: 
  - "Register Another CV" (secondary)
  - "View Proof" (primary)

### Proof Verification Page (/p/<code>)
- **Status Badge**: Top of card, inline-flex
  - "Verified" with checkmark icon
  - Subtle background, rounded-full, px-4 py-2
  
- **Information Grid**: 
  - 2-column layout for metadata
  - Label: value pairs with clear separation
  - Fields: Wallet Address, Timestamp, File Hash (truncated with ...), Tx Hash
  
- **CV Preview Section**: 
  - Prominent "View CV Document" button
  - Icon: External link or document
  - Description text explaining Walrus storage

- **Not Found State**: 
  - Centered message with alert icon
  - "No proof found for this code"
  - Link back to verify page

### Verify Page (Manual Entry)
- **Simple Search Interface**: 
  - Centered card, max-w-xl
  - Single input field for proof code
  - "Verify" button
  - Recent verifications list below (if applicable)

## Visual Elements

### Cards
- Background: white/surface color
- Border: 1px subtle gray
- Border-radius: rounded-lg to rounded-xl
- Shadow: subtle shadow-sm, shadow-md on hover
- Padding: p-6 to p-8

### Buttons
- **Primary**: Solid fill, rounded-lg, h-10 to h-12, px-6, font-medium
- **Secondary**: Border-2, transparent fill, same sizing
- **Icon Buttons**: Square aspect ratio, p-2, rounded-md
- All buttons: transition-colors duration-200

### Input Fields
- Height: h-12
- Border: border-2, rounded-lg
- Padding: px-4
- Focus state: border color change, ring-2 with offset
- Error state: border-red-500, helper text in red

### Status Indicators
- **Success**: Green with checkmark
- **Error**: Red with X icon
- **Loading**: Blue with spinner
- **Info**: Blue with info icon
- Badge style: rounded-full, px-3 py-1, text-sm, font-medium

## Interactions
- **Hover states**: Subtle opacity change or background lightening
- **Focus states**: Visible focus rings for accessibility
- **Loading states**: Skeleton screens for data loading, spinners for actions
- **Transitions**: duration-200 for most interactions
- **Copy buttons**: Success feedback (checkmark) after copying

## Images
No hero background image required. This application prioritizes clarity and function. Use iconography strategically:
- Feature icons from Heroicons (outline style)
- Verification badges/shields for trust signals
- Document/upload icons for file operations
- Optional: Subtle geometric pattern or grid in landing hero background (CSS-based, not image)

## Accessibility
- ARIA labels on all interactive elements
- Form validation with clear error messages
- Keyboard navigation support throughout
- Focus visible on all interactive elements
- High contrast text (minimum WCAG AA)
- Screen reader friendly proof code displays