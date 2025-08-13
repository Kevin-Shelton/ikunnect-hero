import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Languages, ChevronDown, ArrowLeftRight, Search } from 'lucide-react'

const HeroSection = () => {
  const [emailMode, setEmailMode] = useState(false)
  const [showLanguageGrid, setShowLanguageGrid] = useState(false)
  const [email, setEmail] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Sample language data with geo-prioritization
  const languages = [
    { code: 'en', name: 'English', native: 'English', flag: '🇺🇸', priority: 1 },
    { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', priority: 2 },
    { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', priority: 3 },
    { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪', priority: 4 },
    { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹', priority: 5 },
    { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇵🇹', priority: 6 },
    { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳', priority: 7 },
    { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵', priority: 8 },
    { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷', priority: 9 },
    { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦', priority: 10 },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', priority: 11 },
    { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺', priority: 12 }
  ]

  const recentLanguages = languages.slice(0, 4)
  const filteredLanguages = languages.filter(lang => 
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.native.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleStartConversation = () => {
    setShowLanguageGrid(true)
  }

  const handleTryDemo = () => {
    console.log('Guest demo started')
  }

  const handleTryVoice = () => {
    setEmailMode(true)
  }

  const handleEmailVerification = () => {
    console.log('Email verification:', email)
  }

  const handleLanguageSelect = (language) => {
    console.log('Selected language:', language)
    // Navigate to conversation screen
  }

  if (showLanguageGrid) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: `linear-gradient(135deg, var(--bg-deep) 0%, var(--bg-grad-1) 50%, var(--bg-grad-2) 100%)`
        }}
      >
        <div className={`w-full max-w-4xl transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          
          {/* Glass card container */}
          <div className="glass-card p-6 md:p-8">
            
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-display mb-2" style={{ color: 'var(--text-primary)' }}>
                iKunnect
              </h1>
              <h2 className="text-h2 mb-4" style={{ color: 'var(--text-primary)' }}>
                Intelligence
              </h2>
              <p className="text-body" style={{ color: 'var(--text-muted)' }}>
                Select your target language
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              <Input
                type="text"
                placeholder="Search languages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-card border-0 text-button"
                style={{ 
                  background: 'var(--glass)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--stroke)'
                }}
              />
            </div>

            {/* Recent Languages */}
            {!searchTerm && (
              <div className="mb-6">
                <h3 className="text-button mb-3" style={{ color: 'var(--text-muted)' }}>Recent</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {recentLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang)}
                      className="flag-tile flex flex-col items-center justify-center p-3 glass-card hover:scale-105 transition-all duration-200"
                      style={{ background: 'var(--glass)', borderColor: 'var(--stroke)' }}
                    >
                      <span className="text-2xl mb-1">{lang.flag}</span>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                        {lang.native}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Language Grid */}
            <div className="mb-6">
              <h3 className="text-button mb-3" style={{ color: 'var(--text-muted)' }}>
                {searchTerm ? 'Search Results' : 'All Languages'}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-64 overflow-y-auto">
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang)}
                    className="flag-tile flex flex-col items-center justify-center p-3 glass-card hover:scale-105 transition-all duration-200"
                    style={{ background: 'var(--glass)', borderColor: 'var(--stroke)' }}
                  >
                    <span className="text-2xl mb-1">{lang.flag}</span>
                    <span className="text-xs font-medium text-center" style={{ color: 'var(--text-primary)' }}>
                      {lang.native}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Back Button */}
            <div className="text-center">
              <Button
                onClick={() => setShowLanguageGrid(false)}
                variant="outline"
                className="pill-button text-button"
                style={{
                  borderColor: 'var(--stroke)',
                  color: 'var(--text-primary)',
                  background: 'transparent'
                }}
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, var(--bg-deep) 0%, var(--bg-grad-1) 50%, var(--bg-grad-2) 100%)`
      }}
    >
      {/* Animated fade-in container */}
      <div className={`w-full max-w-4xl transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        
        {/* Glass card container */}
        <div className="glass-card p-6 md:p-8 lg:p-12">
          
          {/* Main heading with gradient */}
          <div className="text-center mb-8">
            <h1 className="text-display mb-2" style={{ color: 'var(--text-primary)' }}>
              iKunnect
            </h1>
            <h2 className="text-h2 mb-4" style={{ color: 'var(--text-primary)' }}>
              Intelligence
            </h2>
            <p className="text-body max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Real-time translation supporting 152+ languages with AI-powered intelligence
            </p>
          </div>

          {/* Translation orb with pulse animation */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div 
                className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-2xl animate-pulse"
                style={{ background: `linear-gradient(135deg, var(--accent) 0%, #4A90E2 100%)` }}
              >
                <div 
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, #4A90E2 0%, var(--accent) 100%)` }}
                >
                  <Languages className="w-8 h-8 md:w-10 md:h-10" style={{ color: 'var(--text-primary)' }} />
                </div>
              </div>
              {/* Glowing effect */}
              <div 
                className="absolute inset-0 w-20 h-20 md:w-24 md:h-24 rounded-full animate-ping opacity-30"
                style={{ background: 'var(--accent)' }}
              ></div>
            </div>
          </div>

          {/* Languages indicator */}
          <div className="mb-8 flex items-center justify-center gap-2">
            <Languages className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            <span className="text-button" style={{ color: 'var(--text-muted)' }}>152+ Languages</span>
          </div>

          {/* Language showcase */}
          <div className="mb-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-6 rounded-sm flex items-center justify-center text-xs font-bold"
                style={{ background: '#DC2626', color: 'white' }}
              >
                🇺🇸
              </div>
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>"Hello, how are you?"</span>
            </div>
            
            <ArrowLeftRight className="w-6 h-6 rotate-90 sm:rotate-0" style={{ color: 'var(--accent)' }} />
            
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-6 rounded-sm flex items-center justify-center text-xs font-bold"
                style={{ background: '#EAB308', color: 'white' }}
              >
                🇪🇸
              </div>
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>"Hola, ¿cómo estás?"</span>
            </div>
          </div>

          {/* Buttons or email capture */}
          {!emailMode ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button 
                onClick={handleStartConversation}
                className="pill-button text-button w-full sm:w-auto"
                style={{
                  background: 'var(--cta)',
                  color: 'var(--cta-text)',
                  border: 'none'
                }}
              >
                Start Conversation
              </Button>
              <Button 
                onClick={handleTryDemo}
                className="pill-button text-button w-full sm:w-auto"
                style={{
                  background: 'var(--cta)',
                  color: 'var(--cta-text)',
                  border: 'none'
                }}
              >
                Try Demo
              </Button>
              <Button 
                onClick={handleTryVoice}
                variant="outline"
                className="pill-button text-button w-full sm:w-auto"
                style={{
                  borderColor: 'var(--stroke)',
                  color: 'var(--text-primary)',
                  background: 'transparent'
                }}
              >
                Try Your Voice
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-card border-0 text-button"
                style={{ 
                  background: 'var(--glass)',
                  color: 'var(--text-primary)',
                  borderColor: 'var(--stroke)'
                }}
              />
              <Button 
                onClick={handleEmailVerification}
                className="pill-button text-button"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--text-primary)',
                  border: 'none'
                }}
              >
                Verify
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
      </div>
    </div>
  )
}

export default HeroSection

