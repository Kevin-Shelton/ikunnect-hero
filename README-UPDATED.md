# iKunnect Mobile-First Hero Section Component (Updated)

A modern, mobile-first React hero section component for the iKunnect in-field mobile translation app POC, featuring the new Deloitte-inspired color palette, Inter typography, and enhanced language selection functionality.

## 🎯 Key Updates

### New Design System
- **Color Palette**: Updated to Deloitte-ish cool blues matching the POC specifications
- **Typography**: Inter font family with proper weight hierarchy
- **Mobile-First**: Optimized for mobile devices with responsive breakpoints
- **Glass Morphism**: Enhanced glass card styling with 24px border radius

### Enhanced Functionality
- **Language Selection Grid**: Interactive flag tiles with search functionality
- **Geo-Prioritized Languages**: Recent languages section for quick access
- **Three CTA Buttons**: "Start Conversation", "Try Demo", "Try Your Voice"
- **Responsive Design**: Seamless experience across all device sizes

## 🎨 Design Specifications

### Color Palette
```css
--bg-deep: #0E2042          /* Deep background */
--bg-grad-1: #102B5C        /* Gradient stop 1 */
--bg-grad-2: #1B3C7A        /* Gradient stop 2 */
--glass: rgba(255,255,255,0.08)  /* Glass effect */
--stroke: rgba(255,255,255,0.20) /* Border stroke */
--text-primary: #E8F0FF     /* Primary text */
--text-muted: #B6C6E3       /* Muted text */
--accent: #5B8FB9           /* Accent color */
--cta: #FFFFFF              /* CTA button background */
--cta-text: #0F244A         /* CTA button text */
```

### Typography
- **Display**: Inter ExtraBold 48-64px (responsive)
- **H2/H3**: Inter SemiBold 22-28px (responsive)
- **Body**: Inter Regular 16-18px (responsive)
- **Buttons**: Inter SemiBold 16px

### Components
- **GlassCard**: 24px border radius, backdrop blur, 1px inner stroke
- **PillButton**: 50px border radius, white fill for primary
- **FlagTile**: 64px rounded tiles with shadow and hover effects
- **Search**: Glass-styled input with search icon

## 🚀 Features

### Hero Section
- Full-screen layout with deep blue gradient background
- Glass morphism card container with backdrop blur
- "iKunnect Intelligence" branding with gradient text effects
- Animated translation orb with pulse animation
- Language showcase with US/Spanish example translation
- Three action buttons with proper styling

### Language Selection
- **Search Functionality**: Real-time filtering of languages
- **Recent Languages**: Quick access to 4 most recent selections
- **Flag Grid**: Visual language selection with native names
- **Responsive Grid**: Adapts from 3 columns (mobile) to 6 columns (desktop)
- **Smooth Transitions**: Animated state changes and hover effects

### Mobile Optimization
- Touch-friendly button sizes (minimum 44px)
- Responsive typography with clamp() functions
- Mobile-first grid layouts
- Optimized spacing for small screens
- Proper viewport meta tag handling

## 📱 Responsive Breakpoints

```css
/* Mobile First */
.grid-cols-3          /* Mobile: 3 columns */
.sm:grid-cols-4       /* Small: 4 columns */
.md:grid-cols-6       /* Medium: 6 columns */

/* Typography */
clamp(2.5rem, 8vw, 4rem)      /* Display text */
clamp(1.375rem, 4vw, 1.75rem) /* H2 text */
clamp(1rem, 2.5vw, 1.125rem)  /* Body text */
```

## 🛠 Component Structure

```
src/
├── components/
│   └── HeroSection.jsx     # Main component with language selection
├── App.jsx                 # App wrapper
└── App.css                 # Updated design system
```

## 💻 Usage

### Basic Implementation
```jsx
import HeroSection from './components/HeroSection.jsx'

function App() {
  return (
    <div className="App">
      <HeroSection />
    </div>
  )
}
```

### State Management
The component includes comprehensive state management:
- `emailMode`: Email capture toggle
- `showLanguageGrid`: Language selection view
- `searchTerm`: Language search filtering
- `isVisible`: Animation control

### Event Handlers
- `handleStartConversation()`: Shows language selection grid
- `handleTryDemo()`: Initiates guest demo
- `handleTryVoice()`: Switches to email capture
- `handleLanguageSelect(language)`: Processes language selection
- `handleEmailVerification()`: Handles email verification

## 🌍 Language Data Structure

```javascript
{
  code: 'es',           // ISO language code
  name: 'Spanish',      // English name
  native: 'Español',    // Native name
  flag: '🇪🇸',          // Flag emoji
  priority: 2           // Geo-priority ranking
}
```

## 🎯 POC Alignment

This component aligns with the Manus.ai Implementation Brief requirements:

### ✅ Objectives Met
- **Mobile-First**: Optimized for mobile devices and PWA
- **Visual Style**: Maintains existing deep blue gradient and glass card design
- **Color Palette**: Implements Deloitte-ish cool blues
- **Typography**: Uses Inter font family with proper hierarchy
- **Components**: Includes GlassCard, PillButton, and FlagTile components

### ✅ Screens Implemented
- **Welcome/Language Select**: Hero section with language grid
- **Navigation**: Smooth transitions between views
- **Search**: Real-time language filtering
- **Recent Languages**: Quick access to frequently used languages

### ✅ Architecture Ready
- Component-based structure ready for integration
- State management prepared for Zustand/Redux
- Event handlers ready for API integration
- Responsive design for all device types

## 🔧 Development

### Running Locally
```bash
cd ikunnect-hero
pnpm install
pnpm run dev
```

### Building for Production
```bash
pnpm run build
```

### Testing Mobile
The component includes mobile-first responsive design and can be tested using browser dev tools or actual mobile devices.

## 📋 Implementation Checklist

- [x] Updated color palette to match POC specifications
- [x] Implemented Inter font family with proper weights
- [x] Created mobile-first responsive design
- [x] Added glass card styling with 24px border radius
- [x] Implemented language selection grid with flag tiles
- [x] Added search functionality for languages
- [x] Created "Recent" languages section
- [x] Updated button styles to PillButton specifications
- [x] Added three CTA buttons as specified
- [x] Implemented proper state management
- [x] Tested mobile responsiveness
- [x] Verified touch interactions

## 🚀 Next Steps

This component is ready for integration into the full iKunnect mobile translation app POC. The next development phases would include:

1. **Conversation Screen**: Split view with dual microphones
2. **API Integration**: Connect to Invictus Translation API
3. **Verbum SDK**: Integrate streaming STT/TTS capabilities
4. **Export Functionality**: Optional Verizon repository integration
5. **Settings Screen**: Language defaults and preferences

## 📄 License

This component is created for the iKunnect platform POC. Customize and use according to your project requirements.

