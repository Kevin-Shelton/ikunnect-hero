import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Languages, ChevronDown, ArrowLeftRight, Search, Mic, MicOff, Volume2 } from 'lucide-react'
import logoSvg from '../assets/ikow.svg'

const HeroSection = () => {
  const [emailMode, setEmailMode] = useState(false)
  const [showLanguageGrid, setShowLanguageGrid] = useState(false)
  const [showConversation, setShowConversation] = useState(false)
  const [showConsent, setShowConsent] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(null)
  const [email, setEmail] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

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
    'Other': [
      { code: 'fr-FR', name: 'French (France)', native: 'Français', flag: 'FR', priority: 19 },
      { code: 'de-DE', name: 'German (Germany)', native: 'Deutsch', flag: 'DE', priority: 20 },
      { code: 'zh-CN', name: 'Chinese (Simplified)', native: '中文', flag: 'CN', priority: 21 },
      { code: 'zh-TW', name: 'Chinese (Traditional)', native: '中文', flag: 'TW', priority: 22 },
      { code: 'ja-JP', name: 'Japanese (Japan)', native: '日本語', flag: 'JP', priority: 23 },
      { code: 'ko-KR', name: 'Korean (Korea)', native: '한국어', flag: 'KR', priority: 24 },
      { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', native: 'العربية', flag: 'SA', priority: 25 },
      { code: 'hi-IN', name: 'Hindi (India)', native: 'हिन्दी', flag: 'IN', priority: 26 },
      { code: 'pt-BR', name: 'Portuguese (Brazil)', native: 'Português', flag: 'BR', priority: 27 },
      { code: 'it-IT', name: 'Italian (Italy)', native: 'Italiano', flag: 'IT', priority: 28 },
      { code: 'ru-RU', name: 'Russian (Russia)', native: 'Русский', flag: 'RU', priority: 29 },
      { code: 'ms-MY', name: 'Malay (Malaysia)', native: 'Bahasa Melayu', flag: 'MY', priority: 30 },
      { code: 'da-DK', name: 'Danish (Denmark)', native: 'Dansk', flag: 'DK', priority: 31 }
    ]
  }

  const allLanguages = Object.values(languageGroups).flat()
  
  // Updated recent languages: US English, Mexican Spanish, Australian English, Canadian English
  const recentLanguages = [
    allLanguages.find(lang => lang.code === 'en-US'), // US English
    allLanguages.find(lang => lang.code === 'es-MX'), // Mexican Spanish (replaced British)
    allLanguages.find(lang => lang.code === 'en-AU'), // Australian English
    allLanguages.find(lang => lang.code === 'en-CA')  // Canadian English
  ].filter(Boolean)
  
  const filteredLanguages = allLanguages.filter(lang => 
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.native.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Consent messages in customer's language
  const getConsentMessage = (language) => {
    const messages = {
      'en-US': 'This conversation is being recorded for quality purposes. Do you agree to proceed?',
      'es-MX': 'Esta conversación está siendo grabada con fines de calidad. ¿Está de acuerdo en continuar?',
      'fr-FR': 'Cette conversation est enregistrée à des fins de qualité. Êtes-vous d\'accord pour continuer?',
      'de-DE': 'Dieses Gespräch wird zu Qualitätszwecken aufgezeichnet. Stimmen Sie zu, fortzufahren?',
      'zh-CN': '此对话正在录音以确保质量。您同意继续吗？',
      'ja-JP': 'この会話は品質向上のために録音されています。続行に同意しますか？',
      'ko-KR': '이 대화는 품질 목적으로 녹음되고 있습니다. 계속 진행하는 것에 동의하십니까？',
      'ar-SA': 'يتم تسجيل هذه المحادثة لأغراض الجودة. هل توافق على المتابعة؟',
      'hi-IN': 'यह बातचीत गुणवत्ता के उद्देश्यों के लिए रिकॉर्ड की जा रही है। क्या आप आगे बढ़ने के लिए सहमत हैं?',
      'pt-BR': 'Esta conversa está sendo gravada para fins de qualidade. Você concorda em prosseguir?',
      'it-IT': 'Questa conversazione viene registrata per scopi di qualità. Sei d\'accordo a procedere?',
      'ru-RU': 'Этот разговор записывается в целях качества. Согласны ли вы продолжить?',
      'ms-MY': 'Perbualan ini sedang dirakam untuk tujuan kualiti. Adakah anda bersetuju untuk meneruskan?',
      'da-DK': 'Denne samtale optages til kvalitetsformål. Er du enig i at fortsætte?'
    }
    return messages[language?.code] || messages['en-US']
  }

  // Button text translations for consent dialog
  const getButtonText = (language, buttonType) => {
    const translations = {
      'en-US': { ok: 'OK', cancel: 'Cancel' },
      'es-MX': { ok: 'Sí', cancel: 'Cancelar' },
      'fr-FR': { ok: 'OK', cancel: 'Annuler' },
      'de-DE': { ok: 'OK', cancel: 'Abbrechen' },
      'zh-CN': { ok: '确定', cancel: '取消' },
      'ja-JP': { ok: 'はい', cancel: 'キャンセル' },
      'ko-KR': { ok: '확인', cancel: '취소' },
      'ar-SA': { ok: 'موافق', cancel: 'إلغاء' },
      'hi-IN': { ok: 'ठीक है', cancel: 'रद्द करें' },
      'pt-BR': { ok: 'OK', cancel: 'Cancelar' },
      'it-IT': { ok: 'OK', cancel: 'Annulla' },
      'ru-RU': { ok: 'ОК', cancel: 'Отмена' },
      'ms-MY': { ok: 'OK', cancel: 'Batal' },
      'da-DK': { ok: 'OK', cancel: 'Annuller' }
    }
    
    const langTranslation = translations[language?.code] || translations['en-US']
    return langTranslation[buttonType]
  }

  // Customer greeting messages in their native language
  const getCustomerGreeting = (language) => {
    const greetings = {
      'en-US': '"Hello, how can you help me today?"',
      'es-MX': '"Hola, ¿cómo me puede ayudar hoy?"',
      'fr-FR': '"Bonjour, comment pouvez-vous m\'aider aujourd\'hui?"',
      'de-DE': '"Hallo, wie können Sie mir heute helfen?"',
      'zh-CN': '"你好，今天你能帮我什么吗？"',
      'ja-JP': '"こんにちは、今日はどのようにお手伝いできますか？"',
      'ko-KR': '"안녕하세요, 오늘 어떻게 도와드릴까요?"',
      'ar-SA': '"مرحبا، كيف يمكنك مساعدتي اليوم؟"',
      'hi-IN': '"नमस्ते, आज आप मेरी कैसे मदद कर सकते हैं?"',
      'pt-BR': '"Olá, como você pode me ajudar hoje?"',
      'it-IT': '"Ciao, come puoi aiutarmi oggi?"',
      'ru-RU': '"Здравствуйте, как вы можете мне помочь сегодня?"',
      'ms-MY': '"Hello, bagaimana anda boleh membantu saya hari ini?"',
      'da-DK': '"Hej, hvordan kan du hjælpe mig i dag?"'
    }
    return greetings[language?.code] || greetings['en-US']
  }

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
    setSelectedLanguage(language)
    setShowLanguageGrid(false)
    setShowConsent(true)
  }

  const handleConsentAccept = () => {
    setShowConsent(false)
    setShowConversation(true)
  }

  const handleConsentDecline = () => {
    setShowConsent(false)
    setShowLanguageGrid(true)
    setSelectedLanguage(null)
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    setIsSpeaking(!isRecording)
    
    if (!isRecording) {
      // Simulate speaking for 3 seconds
      setTimeout(() => {
        setIsSpeaking(false)
      }, 3000)
    }
  }

  // Flag Icon Component
  const FlagIcon = ({ countryCode, size = 'medium' }) => {
    const sizeClasses = {
      small: 'w-8 h-8',
      medium: 'w-12 h-12',
      large: 'w-16 h-16'
    }

    return (
      <div className={`${sizeClasses[size]} rounded-lg overflow-hidden shadow-md flex items-center justify-center bg-blue-600 text-white font-semibold text-sm`}>
        <img 
          src={`https://flagcdn.com/80x60/${countryCode?.toLowerCase()}.png`}
          alt={`${countryCode} flag`}
          className="w-full h-full object-cover rounded-lg"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'block'
          }}
        />
        <span className="hidden">{countryCode}</span>
      </div>
    )
  }

  // Consent Dialog Component
  if (showConsent && selectedLanguage) {
    return (
      <div 
        className={`min-h-screen flex items-center justify-center p-4 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'var(--bg-gradient)' }}
      >
        <div className="max-w-2xl w-full">
          <div 
            className="glass-card p-8 text-center"
            style={{ background: 'var(--glass)', borderColor: 'var(--stroke)' }}
          >
            <div className="text-center mb-6">
              <img 
                src={logoSvg} 
                alt="iKOneWorld - One Platform Every Language Every Channel"
                className="mx-auto h-80 w-auto mb-4"
              />
            </div>
            
            <div className="mb-8">
              <div className="mb-6">
                <h3 className="text-h3 mb-2" style={{ color: 'var(--text-primary)' }}>English</h3>
                <p className="text-body" style={{ color: 'var(--text-muted)' }}>
                  This conversation is being recorded for quality purposes. Do you agree to proceed?
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="text-h3 mb-2" style={{ color: 'var(--text-primary)' }}>
                  {selectedLanguage?.name || selectedLanguage?.native}
                </h3>
                <p className="text-body" style={{ color: 'var(--text-muted)' }}>
                  {getConsentMessage(selectedLanguage)}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleConsentAccept}
                className="pill-button bg-white text-blue-600 hover:bg-gray-100 px-8 py-3"
              >
                OK / {getButtonText(selectedLanguage, 'ok')}
              </Button>
              <Button
                onClick={handleConsentDecline}
                variant="outline"
                className="pill-button border-white/30 text-white hover:bg-white/10 px-8 py-3"
              >
                Cancel / {getButtonText(selectedLanguage, 'cancel')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Conversation Interface Component
  if (showConversation) {
    return (
      <div 
        className={`min-h-screen flex items-center justify-center p-4 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'var(--bg-gradient)' }}
      >
        <div className="max-w-4xl w-full">
          <div 
            className="glass-card p-8"
            style={{ background: 'var(--glass)', borderColor: 'var(--stroke)' }}
          >
            <div className="text-center mb-8">
              <img 
                src={logoSvg} 
                alt="iKOneWorld - One Platform Every Language Every Channel"
                className="mx-auto h-80 w-auto mb-6"
              />
              
              {/* Enhanced ever-present pulsating orb */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div 
                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isSpeaking ? 'scale-110' : 'scale-100'
                    }`}
                    style={{ 
                      background: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
                      boxShadow: isSpeaking 
                        ? '0 0 50px rgba(59, 130, 246, 0.8), 0 0 100px rgba(59, 130, 246, 0.4)' 
                        : '0 0 30px rgba(59, 130, 246, 0.5)'
                    }}
                  >
                    <Languages className="w-12 h-12" style={{ color: 'white' }} />
                  </div>
                  
                  {/* Animated pulse rings */}
                  {isSpeaking && (
                    <>
                      <div 
                        className="absolute inset-0 w-32 h-32 rounded-full animate-ping opacity-40"
                        style={{ background: 'rgba(59, 130, 246, 0.3)' }}
                      ></div>
                      <div 
                        className="absolute inset-0 w-32 h-32 rounded-full animate-pulse opacity-60"
                        style={{ background: 'rgba(59, 130, 246, 0.2)' }}
                      ></div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Language pair display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Employee side (English) */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <FlagIcon countryCode="US" size="small" />
                  <span className="text-h3" style={{ color: 'var(--text-primary)' }}>Employee</span>
                </div>
                <div 
                  className="glass-card p-4 min-h-[120px] flex items-center justify-center"
                  style={{ background: 'var(--glass-light)', borderColor: 'var(--stroke)' }}
                >
                  <p className="text-body" style={{ color: 'var(--text-primary)' }}>
                    "Hello, how can I help you today?"
                  </p>
                </div>
              </div>

              {/* Customer side (Selected language) */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <FlagIcon countryCode={selectedLanguage?.flag} size="small" />
                  <span className="text-h3" style={{ color: 'var(--text-primary)' }}>Customer</span>
                </div>
                <div 
                  className="glass-card p-4 min-h-[120px] flex items-center justify-center"
                  style={{ background: 'var(--glass-light)', borderColor: 'var(--stroke)' }}
                >
                  <p className="text-body" style={{ color: 'var(--text-primary)' }}>
                    {getCustomerGreeting(selectedLanguage)}
                  </p>
                </div>
              </div>
            </div>

            {/* Recording controls */}
            <div className="flex justify-center gap-4 mb-6">
              <Button
                onClick={toggleRecording}
                className={`pill-button px-6 py-3 flex items-center gap-2 ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                {isRecording ? 'Stop' : 'Begin'}
              </Button>
              
              <Button
                className="pill-button bg-green-600 hover:bg-green-700 text-white px-6 py-3 flex items-center gap-2"
              >
                <Volume2 className="w-5 h-5" />
                Play Translation
              </Button>
            </div>

            {/* Back to language selection */}
            <div className="text-center">
              <Button
                onClick={() => {
                  setShowConversation(false)
                  setShowLanguageGrid(true)
                  setSelectedLanguage(null)
                  setIsRecording(false)
                  setIsSpeaking(false)
                }}
                variant="outline"
                className="pill-button border-white/30 text-white hover:bg-white/10 px-6 py-3"
              >
                Change Language
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Language Grid Component
  if (showLanguageGrid) {
    return (
      <div 
        className={`min-h-screen flex items-center justify-center p-4 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'var(--bg-gradient)' }}
      >
        <div className="max-w-4xl w-full">
          <div 
            className="glass-card p-6 md:p-8"
            style={{ background: 'var(--glass)', borderColor: 'var(--stroke)' }}
          >
            {/* Logo */}
            <div className="text-center mb-6">
              <img 
                src={logoSvg} 
                alt="iKOneWorld - One Platform Every Language Every Channel"
                className="mx-auto h-64 w-auto mb-4"
              />
              <p className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
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
                className="pl-10 glass-input"
                style={{ 
                  background: 'var(--glass-light)', 
                  borderColor: 'var(--stroke)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            {/* Recent Languages */}
            {!searchTerm && (
              <div className="mb-8">
                <h3 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>Recent</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {recentLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang)}
                      className="flag-tile group"
                    >
                      <FlagIcon countryCode={lang.flag} size="medium" />
                      <div className="mt-2">
                        <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {lang.flag}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {lang.native}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All Languages or Search Results */}
            <div className="mb-6">
              <h3 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
                {searchTerm ? 'Search Results' : 'All Languages'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-96 overflow-y-auto">
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang)}
                    className="flag-tile group"
                  >
                    <FlagIcon countryCode={lang.flag} size="medium" />
                    <div className="mt-2">
                      <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {lang.flag}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {lang.native}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Back to Home */}
            <div className="text-center">
              <Button
                onClick={() => setShowLanguageGrid(false)}
                variant="outline"
                className="pill-button border-white/30 text-white hover:bg-white/10 px-6 py-3"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main Hero Section
  return (
    <div 
      className={`min-h-screen flex items-center justify-center p-4 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: 'var(--bg-gradient)' }}
    >
      <div className="max-w-4xl w-full text-center">
        <div className="glass-card p-6 md:p-8 lg:p-12">
          
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src={logoSvg} 
              alt="iKOneWorld - One Platform Every Language Every Channel"
              className="mx-auto h-96 w-auto mb-4"
            />
            <p className="text-body max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Real-time translation supporting 152+ languages with AI-powered intelligence
            </p>
          </div>

          {/* Translation Orb */}
          <div className="flex justify-center mb-6">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
                boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)'
              }}
            >
              <Languages className="w-8 h-8" style={{ color: 'white' }} />
            </div>
          </div>

          {/* Languages indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Languages className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            <span className="text-body" style={{ color: 'var(--text-muted)' }}>152+ Languages</span>
          </div>

          {/* Language showcase */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'var(--glass-light)' }}>
              <FlagIcon countryCode="US" size="small" />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>"Hello, how are you?"</span>
            </div>
            
            <ArrowLeftRight className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'var(--glass-light)' }}>
              <FlagIcon countryCode="ES" size="small" />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>"Hola, ¿cómo estás?"</span>
            </div>
          </div>

          {/* Action buttons */}
          {!emailMode ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                onClick={handleStartConversation}
                className="pill-button bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
              >
                Start Conversation
              </Button>
              <Button
                onClick={handleTryDemo}
                variant="outline"
                className="pill-button border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
              >
                Try Demo
              </Button>
              <Button
                onClick={handleTryVoice}
                variant="outline"
                className="pill-button border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
              >
                Try Your Voice
              </Button>
            </div>
          ) : (
            <div className="max-w-md mx-auto mb-8">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input flex-1"
                  style={{ 
                    background: 'var(--glass-light)', 
                    borderColor: 'var(--stroke)',
                    color: 'var(--text-primary)'
                  }}
                />
                <Button
                  onClick={handleEmailVerification}
                  className="pill-button bg-white text-blue-600 hover:bg-gray-100 px-6"
                >
                  Verify
                </Button>
              </div>
            </div>
          )}

          {/* Scroll indicator */}
          <div className="flex justify-center">
            <ChevronDown 
              className="w-6 h-6 animate-bounce" 
              style={{ color: 'var(--text-muted)' }} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default HeroSection

