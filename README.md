# iKunnect Hero Section Component

A modern, responsive React hero section component featuring a dark gradient background, glass morphism effects, and interactive elements for the iKunnect translation platform.

## Features

### Visual Design
- **Full-screen layout** with dark blue gradient background (slate-900 → blue-900 → indigo-900)
- **Glass morphism card** with backdrop blur and subtle borders
- **Gradient text** for the main "iKunnect" heading (blue-to-white)
- **Animated translation orb** with pulse effect and glowing animation
- **Language showcase** with flag icons and bidirectional arrow
- **Scroll indicator** at the bottom with bounce animation

### Interactive Features
- **Dual button modes**: "Try Demo" and "Try Your Voice"
- **Email capture mode**: Switches to email input and verification when "Try Your Voice" is clicked
- **State management**: Handles email mode toggle and form state
- **Responsive design**: Works on desktop and mobile devices

### Animations
- **Fade-in effect** on component mount
- **Pulse animation** on the translation orb
- **Glowing effect** with animated rings
- **Hover effects** on buttons with scale transforms
- **Bounce animation** on scroll indicator

## Component Structure

```
src/
├── components/
│   └── HeroSection.jsx     # Main hero section component
├── App.jsx                 # App component using HeroSection
└── App.css                 # Tailwind CSS configuration
```

## Usage

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

The component includes built-in state management for:
- `emailMode`: Boolean to toggle between button view and email capture
- `email`: String to store the email input value
- `isVisible`: Boolean for fade-in animation control

### Event Handlers

- `handleTryDemo()`: Logs guest demo start (customize for your demo logic)
- `handleTryVoice()`: Switches to email capture mode
- `handleEmailVerification()`: Processes email verification (customize for your backend)

## Customization

### Colors and Styling
The component uses Tailwind CSS classes. Key styling elements:

- **Background gradient**: `bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900`
- **Glass card**: `backdrop-blur-lg bg-white/10 rounded-3xl border border-white/20`
- **Text gradient**: `bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent`

### Content Customization
Update the following in `HeroSection.jsx`:

- Main heading text: "iKunnect"
- Subtitle: "Intelligence"
- Tagline: "Real-time translation supporting 152+ languages with AI-powered intelligence"
- Language examples: Currently shows English ↔ Spanish

### Button Actions
Customize the event handlers to integrate with your backend:

```jsx
const handleTryDemo = () => {
  // Add your demo logic here
  console.log('Guest demo started')
}

const handleEmailVerification = () => {
  // Add your email verification logic here
  console.log('Email verification:', email)
}
```

## Dependencies

The component uses the following packages (pre-installed in the template):

- **React**: Core framework
- **Tailwind CSS**: Styling framework
- **shadcn/ui**: UI components (Button, Input)
- **Lucide React**: Icons (Languages, ChevronDown, ArrowLeftRight)

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- Mobile responsive design
- Backdrop-filter support for glass morphism effects

## Development

### Running Locally
```bash
cd ikunnect-hero
pnpm run dev
```

### Building for Production
```bash
pnpm run build
```

## Technical Specifications

- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS with custom animations
- **Icons**: Lucide React icon library
- **Responsive**: Mobile-first design approach
- **Animations**: CSS transitions and Tailwind animation utilities
- **Accessibility**: Semantic HTML structure with proper button elements

## File Structure

```
ikunnect-hero/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   └── HeroSection.jsx  # Main component
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## License

This component is created for the iKunnect platform. Customize and use according to your project requirements.

