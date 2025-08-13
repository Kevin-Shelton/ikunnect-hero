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

  // Comprehensive language data organized by regions
  const languageGroups = {
    'English': [
      { code: 'en-US', name: 'English (United States)', native: 'English', flag: 'US', priority: 1 },
      { code: 'en-GB', name: 'English (United Kingdom)', native: 'English', flag: 'GB', priority: 2 },
      { code: 'en-AU', name: 'English (Australia)', native: 'English', flag: 'AU', priority: 3 },
      { code: 'en-CA', name: 'English (Canada)', native: 'English', flag: 'CA', priority: 4 },
      { code: 'en-NZ', name: 'English (New Zealand)', native: 'English', flag: 'NZ', priority: 5 },
      { code: 'en-IE', name: 'English (Ireland)', native: 'English', flag: 'IE', priority: 6 },
      { code: 'en-IN', name: 'English (India)', native: 'English', flag: 'IN', priority: 7 },
      { code: 'en-PH', name: 'English (Philippines)', native: 'English', flag: 'PH', priority: 8 },
      { code: 'en-SG', name: 'English (Singapore)', native: 'English', flag: 'SG', priority: 9 },
      { code: 'en-ZA', name: 'English (South Africa)', native: 'English', flag: 'ZA', priority: 10 }
    ],
    'Spanish': [
      { code: 'es-ES', name: 'Spanish (Spain)', native: 'Español', flag: 'ES', priority: 11 },
      { code: 'es-MX', name: 'Spanish (Mexico)', native: 'Español', flag: 'MX', priority: 12 },
      { code: 'es-AR', name: 'Spanish (Argentina)', native: 'Español', flag: 'AR', priority: 13 },
      { code: 'es-CO', name: 'Spanish (Colombia)', native: 'Español', flag: 'CO', priority: 14 },
      { code: 'es-CL', name: 'Spanish (Chile)', native: 'Español', flag: 'CL', priority: 15 },
      { code: 'es-PE', name: 'Spanish (Peru)', native: 'Español', flag: 'PE', priority: 16 },
      { code: 'es-VE', name: 'Spanish (Venezuela)', native: 'Español', flag: 'VE', priority: 17 },
      { code: 'es-US', name: 'Spanish (United States)', native: 'Español', flag: 'US', priority: 18 }
    ],
    'French': [
      { code: 'fr-FR', name: 'French (France)', native: 'Français', flag: 'FR', priority: 19 },
      { code: 'fr-CA', name: 'French (Canada)', native: 'Français', flag: 'CA', priority: 20 },
      { code: 'fr-BE', name: 'French (Belgium)', native: 'Français', flag: 'BE', priority: 21 },
      { code: 'fr-CH', name: 'French (Switzerland)', native: 'Français', flag: 'CH', priority: 22 }
    ],
    'German': [
      { code: 'de-DE', name: 'German (Germany)', native: 'Deutsch', flag: 'DE', priority: 23 },
      { code: 'de-AT', name: 'German (Austria)', native: 'Deutsch', flag: 'AT', priority: 24 },
      { code: 'de-CH', name: 'German (Switzerland)', native: 'Deutsch', flag: 'CH', priority: 25 }
    ],
    'Chinese': [
      { code: 'zh-CN', name: 'Chinese Mandarin (Simplified)', native: '中文', flag: 'CN', priority: 26 },
      { code: 'zh-TW', name: 'Chinese Mandarin (Traditional)', native: '中文', flag: 'TW', priority: 27 },
      { code: 'zh-HK', name: 'Chinese Cantonese (Hong Kong)', native: '中文', flag: 'HK', priority: 28 }
    ],
    'Arabic': [
      { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', native: 'العربية', flag: 'SA', priority: 29 },
      { code: 'ar-EG', name: 'Arabic (Egypt)', native: 'العربية', flag: 'EG', priority: 30 },
      { code: 'ar-AE', name: 'Arabic (UAE)', native: 'العربية', flag: 'AE', priority: 31 },
      { code: 'ar-MA', name: 'Arabic (Morocco)', native: 'العربية', flag: 'MA', priority: 32 }
    ],
    'Europe': [
      { code: 'it-IT', name: 'Italian (Italy)', native: 'Italiano', flag: 'IT', priority: 33 },
      { code: 'pt-PT', name: 'Portuguese (Portugal)', native: 'Português', flag: 'PT', priority: 34 },
      { code: 'ru-RU', name: 'Russian (Russia)', native: 'Русский', flag: 'RU', priority: 35 },
      { code: 'pl-PL', name: 'Polish (Poland)', native: 'Polski', flag: 'PL', priority: 36 },
      { code: 'nl-NL', name: 'Dutch (Netherlands)', native: 'Nederlands', flag: 'NL', priority: 37 },
      { code: 'sv-SE', name: 'Swedish (Sweden)', native: 'Svenska', flag: 'SE', priority: 38 },
      { code: 'da-DK', name: 'Danish (Denmark)', native: 'Dansk', flag: 'DK', priority: 39 },
      { code: 'nb-NO', name: 'Norwegian (Norway)', native: 'Norsk', flag: 'NO', priority: 40 }
    ],
    'East Asia': [
      { code: 'ja-JP', name: 'Japanese (Japan)', native: '日本語', flag: 'JP', priority: 41 },
      { code: 'ko-KR', name: 'Korean (South Korea)', native: '한국어', flag: 'KR', priority: 42 }
    ],
    'South Asia': [
      { code: 'hi-IN', name: 'Hindi (India)', native: 'हिन्दी', flag: 'IN', priority: 43 },
      { code: 'bn-IN', name: 'Bengali (India)', native: 'বাংলা', flag: 'IN', priority: 44 },
      { code: 'ta-IN', name: 'Tamil (India)', native: 'தமிழ்', flag: 'IN', priority: 45 },
      { code: 'te-IN', name: 'Telugu (India)', native: 'తెలుగు', flag: 'IN', priority: 46 }
    ],
    'Southeast Asia': [
      { code: 'th-TH', name: 'Thai (Thailand)', native: 'ไทย', flag: 'TH', priority: 47 },
      { code: 'vi-VN', name: 'Vietnamese (Vietnam)', native: 'Tiếng Việt', flag: 'VN', priority: 48 },
      { code: 'id-ID', name: 'Indonesian (Indonesia)', native: 'Bahasa Indonesia', flag: 'ID', priority: 49 },
      { code: 'ms-MY', name: 'Malay (Malaysia)', native: 'Bahasa Melayu', flag: 'MY', priority: 50 }
    ],
    'Americas': [
      { code: 'pt-BR', name: 'Portuguese (Brazil)', native: 'Português', flag: 'BR', priority: 51 }
    ]
  }

  // Flatten all languages for search and display
  const allLanguages = Object.values(languageGroups).flat()
  const recentLanguages = allLanguages.slice(0, 4)
  
  const filteredLanguages = allLanguages.filter(lang => 
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.native.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Flag component using country code with actual flag image
  const FlagIcon = ({ countryCode, size = "large" }) => {
    const sizeClasses = {
      small: "w-8 h-8",
      medium: "w-12 h-12", 
      large: "w-16 h-16",
      xlarge: "w-20 h-20"
    }
    
    return (
      <div className={`${sizeClasses[size]} flex flex-col items-center justify-center gap-1`}>
        {/* Flag image using flagcdn.com API */}
        <div className={`${sizeClasses[size]} rounded-lg overflow-hidden shadow-lg border-2 border-white/20`}>
          <img 
            src={`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`}
            alt={`${countryCode} flag`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to country code if flag image fails to load
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          {/* Fallback country code display */}
          <div 
            className="w-full h-full bg-blue-600 text-white font-bold rounded-lg flex items-center justify-center text-xs"
            style={{ display: 'none' }}
          >
            {countryCode}
          </div>
        </div>
        {/* Country code label below flag */}
        <span className="text-xs font-medium text-center" style={{ color: 'var(--text-muted)' }}>
          {countryCode}
        </span>
      </div>
    )
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
                <h3 className="text-button mb-4" style={{ color: 'var(--text-muted)' }}>Recent</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {recentLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang)}
                      className="flag-tile flex flex-col items-center justify-center p-4 glass-card hover:scale-105 transition-all duration-200 min-h-[120px]"
                      style={{ background: 'var(--glass)', borderColor: 'var(--stroke)' }}
                    >
                      <FlagIcon countryCode={lang.flag} size="medium" />
                      <span className="text-sm font-medium mt-2 text-center" style={{ color: 'var(--text-primary)' }}>
                        {lang.native}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Language Grid */}
            <div className="mb-6">
              <h3 className="text-button mb-4" style={{ color: 'var(--text-muted)' }}>
                {searchTerm ? 'Search Results' : 'All Languages'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-80 overflow-y-auto">
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang)}
                    className="flag-tile flex flex-col items-center justify-center p-4 glass-card hover:scale-105 transition-all duration-200 min-h-[120px]"
                    style={{ background: 'var(--glass)', borderColor: 'var(--stroke)' }}
                  >
                    <FlagIcon countryCode={lang.flag} size="medium" />
                    <span className="text-sm font-medium text-center mt-2" style={{ color: 'var(--text-primary)' }}>
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
          <div className="mb-8 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
            <div className="flex items-center gap-3">
              <FlagIcon countryCode="US" size="small" />
              <span className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>"Hello, how are you?"</span>
            </div>
            
            <ArrowLeftRight className="w-8 h-8 rotate-90 sm:rotate-0" style={{ color: 'var(--accent)' }} />
            
            <div className="flex items-center gap-3">
              <FlagIcon countryCode="ES" size="small" />
              <span className="text-base font-medium" style={{ color: 'var(--text-primary)' }}>"Hola, ¿cómo estás?"</span>
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

