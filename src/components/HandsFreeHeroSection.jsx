import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Languages, ChevronDown, ArrowLeftRight, Search, Mic, MicOff, Volume2, Play, Pause, Settings, AlertCircle, CheckCircle, Clock, Users } from 'lucide-react'
import logoSvg from '../assets/ikow.svg'
import { useHandsFreeTranslation } from '../hooks/useHandsFreeTranslation'

const HandsFreeHeroSection = () => {
  // All useState hooks first
  const [emailMode, setEmailMode] = useState(false)
  const [showLanguageGrid, setShowLanguageGrid] = useState(false)
  const [showConversation, setShowConversation] = useState(false)
  const [showConsent, setShowConsent] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(null)
  const [email, setEmail] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [employeeLanguage, setEmployeeLanguage] = useState('en-US')
  const [customerLanguage, setCustomerLanguage] = useState('es-MX')
  const [showHandsFreeSetup, setShowHandsFreeSetup] = useState(false)
  const [showEnrollmentFlow, setShowEnrollmentFlow] = useState(false)
  const [showQualityDashboard, setShowQualityDashboard] = useState(false)

  // All useEffect hooks after useState
  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Custom hooks last
  const [handsFreeState, handsFreeActions] = useHandsFreeTranslation({
    enableQARecording: true,
    enableTTS: true,
    autoStartHandsFree: false,
    enrollmentDuration: 6000,
    confidenceThreshold: 0.65
  })

  // Language data (keeping existing comprehensive language list)
  const languageGroups = {
    'English': [
      { code: 'en-US', name: 'English (United States)', native: 'English', flag: 'US', priority: 1 },
      { code: 'en-GB', name: 'English (United Kingdom)', native: 'English', flag: 'GB', priority: 2 },
      { code: 'en-AU', name: 'English (Australia)', native: 'English', flag: 'AU', priority: 3 },
      { code: 'en-CA', name: 'English (Canada)', native: 'English', flag: 'CA', priority: 4 }
    ],
    'Spanish': [
      { code: 'es-ES', name: 'Spanish (Spain)', native: 'Español', flag: 'ES', priority: 11 },
      { code: 'es-MX', name: 'Spanish (Mexico)', native: 'Español', flag: 'MX', priority: 12 },
      { code: 'es-AR', name: 'Spanish (Argentina)', native: 'Español', flag: 'AR', priority: 13 },
      { code: 'es-CO', name: 'Spanish (Colombia)', native: 'Español', flag: 'CO', priority: 14 }
    ],
    'French': [
      { code: 'fr-FR', name: 'French (France)', native: 'Français', flag: 'FR', priority: 19 },
      { code: 'fr-CA', name: 'French (Canada)', native: 'Français', flag: 'CA', priority: 20 }
    ]
  }

  const allLanguages = Object.values(languageGroups).flat()
  
  const recentLanguages = [
    allLanguages.find(lang => lang.code === 'en-US'),
    allLanguages.find(lang => lang.code === 'es-MX'),
    allLanguages.find(lang => lang.code === 'en-AU'),
    allLanguages.find(lang => lang.code === 'en-CA')
  ].filter(Boolean)

  // Enhanced handlers for hands-free mode
  const handleStartHandsFreeSetup = () => {
    setShowHandsFreeSetup(true)
    setShowLanguageGrid(false)
    setShowConversation(false)
  }

  const handleInitializeSession = async () => {
    try {
      await handsFreeActions.initializeSession(employeeLanguage, customerLanguage)
      setShowEnrollmentFlow(true)
    } catch (error) {
      console.error('Failed to initialize session:', error)
    }
  }

  const handleStartEnrollment = async () => {
    try {
      await handsFreeActions.startEnrollment()
    } catch (error) {
      console.error('Failed to start enrollment:', error)
    }
  }

  const handleStartHandsFreeMode = async () => {
    try {
      await handsFreeActions.startHandsFreeMode()
      setShowConversation(true)
      setShowEnrollmentFlow(false)
      setShowHandsFreeSetup(false)
    } catch (error) {
      console.error('Failed to start hands-free mode:', error)
    }
  }

  const handleStopHandsFreeMode = async () => {
    try {
      await handsFreeActions.stopHandsFreeMode()
      setShowConversation(false)
    } catch (error) {
      console.error('Failed to stop hands-free mode:', error)
    }
  }

  const handleEndSession = async () => {
    try {
      await handsFreeActions.endSession()
      setShowConversation(false)
      setShowEnrollmentFlow(false)
      setShowHandsFreeSetup(false)
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  const getLanguageName = (code) => {
    const lang = allLanguages.find(l => l.code === code)
    return lang ? lang.name : code
  }

  const getStatusColor = () => {
    if (handsFreeState.error) return 'text-red-400'
    if (handsFreeState.isHandsFree) return 'text-green-400'
    if (handsFreeState.isEnrolling) return 'text-blue-400'
    if (handsFreeState.isRecording) return 'text-orange-400'
    return 'text-gray-400'
  }

  const getStatusIcon = () => {
    if (handsFreeState.error) return <AlertCircle className="w-4 h-4" />
    if (handsFreeState.isHandsFree) return <CheckCircle className="w-4 h-4" />
    if (handsFreeState.isEnrolling) return <Settings className="w-4 h-4 animate-spin" />
    if (handsFreeState.isRecording) return <Mic className="w-4 h-4 animate-pulse" />
    return <Clock className="w-4 h-4" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Main Content */}
      <div className={`relative z-10 w-full max-w-6xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img 
              src={logoSvg} 
              alt="iKunnect Logo" 
              className="h-16 w-auto"
            />
            <div className="text-left">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-white to-blue-300 bg-clip-text text-transparent leading-tight">
                iKunnect
              </h1>
              <p className="text-xl md:text-2xl text-white/90 font-light">
                Intelligence
              </p>
            </div>
          </div>
          
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Experience hands-free real-time translation with voice enrollment and speaker diarization. 
            Supporting 152+ languages with AI-powered quality assurance.
          </p>
        </div>

        {/* Translation Orb and Status */}
        <div className="flex flex-col items-center mb-12">
          <div className="relative mb-8">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl transition-all duration-300 ${
              handsFreeState.isRecording ? 'animate-pulse scale-110' : ''
            } ${handsFreeState.isHandsFree ? 'ring-4 ring-green-400/50' : ''}`}>
              <Languages className="w-12 h-12 text-white" />
              {handsFreeState.isRecording && (
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
              )}
            </div>
            
            {/* Audio Level Indicator */}
            {handsFreeState.audioLevel > 0 && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-4 bg-blue-400 rounded-full transition-all duration-150 ${
                        handsFreeState.audioLevel > (i + 1) * 0.2 ? 'opacity-100' : 'opacity-30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status Display */}
          <div className="glass-card p-4 rounded-xl backdrop-blur-md bg-white/10 border border-white/20">
            <div className="flex items-center gap-3">
              <div className={getStatusColor()}>
                {getStatusIcon()}
              </div>
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {handsFreeState.statusText}
              </span>
              {handsFreeState.sessionDuration > 0 && (
                <span className="text-xs text-white/60 ml-2">
                  {formatDuration(handsFreeState.sessionDuration)}
                </span>
              )}
            </div>
            
            {handsFreeState.error && (
              <div className="mt-2 text-xs text-red-300 bg-red-500/10 p-2 rounded">
                {handsFreeState.error}
                <button 
                  onClick={handsFreeActions.clearError}
                  className="ml-2 underline hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Action Buttons */}
        {!showHandsFreeSetup && !showEnrollmentFlow && !showConversation && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              onClick={handleStartHandsFreeSetup}
              className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-3 text-lg font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
              disabled={!handsFreeState.isInitialized}
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Hands-Free Mode
            </Button>
            
            <Button
              onClick={() => setEmailMode(true)}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105"
            >
              Try Demo
            </Button>
          </div>
        )}

        {/* Hands-Free Setup Flow */}
        {showHandsFreeSetup && !showEnrollmentFlow && (
          <div className="glass-card p-8 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Configure Hands-Free Translation
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Employee Language */}
              <div>
                <label className="block text-white/90 font-semibold mb-3">
                  Employee Language
                </label>
                <div className="relative">
                  <select
                    value={employeeLanguage}
                    onChange={(e) => setEmployeeLanguage(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {recentLanguages.map(lang => (
                      <option key={lang.code} value={lang.code} className="bg-gray-800">
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer Language */}
              <div>
                <label className="block text-white/90 font-semibold mb-3">
                  Customer Language
                </label>
                <div className="relative">
                  <select
                    value={customerLanguage}
                    onChange={(e) => setCustomerLanguage(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {recentLanguages.map(lang => (
                      <option key={lang.code} value={lang.code} className="bg-gray-800">
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Configuration Summary */}
            <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-400/20">
              <div className="flex items-center justify-between text-sm text-white/80">
                <span>Translation Route:</span>
                <span className="font-medium">
                  {getLanguageName(employeeLanguage)} ↔ {getLanguageName(customerLanguage)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center mt-8">
              <Button
                onClick={() => setShowHandsFreeSetup(false)}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleInitializeSession}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                disabled={!handsFreeState.isInitialized}
              >
                Initialize Session
              </Button>
            </div>
          </div>
        )}

        {/* Voice Enrollment Flow */}
        {showEnrollmentFlow && (
          <div className="glass-card p-8 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Voice Enrollment
            </h3>
            
            {!handsFreeState.employeeVoicePrint ? (
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Mic className={`w-10 h-10 text-white ${handsFreeState.isEnrolling ? 'animate-pulse' : ''}`} />
                  </div>
                  <p className="text-white/80 mb-4">
                    We need to record your voice to enable speaker identification.
                    Please speak clearly for about 6 seconds.
                  </p>
                  {handsFreeState.isEnrolling && (
                    <p className="text-blue-300 text-sm">
                      Recording... Please speak naturally
                    </p>
                  )}
                </div>
                
                <Button
                  onClick={handleStartEnrollment}
                  disabled={handsFreeState.isEnrolling}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  {handsFreeState.isEnrolling ? 'Recording...' : 'Start Voice Enrollment'}
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-6">
                  <CheckCircle className="w-20 h-20 mx-auto mb-4 text-green-400" />
                  <p className="text-white/80 mb-2">
                    Voice enrollment completed successfully!
                  </p>
                  <p className="text-green-300 text-sm">
                    Confidence: {(handsFreeState.employeeVoicePrint.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                
                <Button
                  onClick={handleStartHandsFreeMode}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                >
                  Start Hands-Free Translation
                </Button>
              </div>
            )}
            
            <div className="flex justify-center mt-6">
              <Button
                onClick={handleEndSession}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-6 py-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Active Conversation Interface */}
        {showConversation && handsFreeState.isHandsFree && (
          <div className="glass-card p-8 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                Live Translation Session
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Users className="w-4 h-4" />
                  <span>Speaker: {handsFreeState.currentSpeaker || 'None'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(handsFreeState.sessionDuration)}</span>
                </div>
              </div>
            </div>

            {/* Translation Display */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Employee Side */}
              <div className="bg-blue-500/10 p-6 rounded-xl border border-blue-400/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-blue-300 font-semibold">
                    Employee ({getLanguageName(employeeLanguage)})
                  </span>
                </div>
                <div className="min-h-[100px] text-white/90">
                  {handsFreeState.employeeText || (
                    <span className="text-white/50 italic">Waiting for speech...</span>
                  )}
                </div>
              </div>

              {/* Customer Side */}
              <div className="bg-green-500/10 p-6 rounded-xl border border-green-400/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-green-300 font-semibold">
                    Customer ({getLanguageName(customerLanguage)})
                  </span>
                </div>
                <div className="min-h-[100px] text-white/90">
                  {handsFreeState.customerText || (
                    <span className="text-white/50 italic">Waiting for speech...</span>
                  )}
                </div>
              </div>
            </div>

            {/* Translation Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {handsFreeState.translationCount}
                </div>
                <div className="text-xs text-white/60">Translations</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {(handsFreeState.speakerConfidence * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-white/60">Speaker Confidence</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {(handsFreeState.qualityScore * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-white/60">Quality Score</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-white">
                  {handsFreeState.microphonePermission === 'granted' ? 'Active' : 'Inactive'}
                </div>
                <div className="text-xs text-white/60">Microphone</div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={handsFreeState.isActive ? handsFreeActions.pauseListening : handsFreeActions.resumeListening}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-6 py-2"
              >
                {handsFreeState.isActive ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleStopHandsFreeMode}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
              >
                <MicOff className="w-4 h-4 mr-2" />
                Stop Session
              </Button>
            </div>
          </div>
        )}

        {/* Language Showcase (keeping original) */}
        {!showHandsFreeSetup && !showEnrollmentFlow && !showConversation && (
          <div className="glass-card p-8 rounded-2xl backdrop-blur-md bg-white/10 border border-white/20 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🇺🇸</span>
                </div>
                <p className="text-white/90 font-medium mb-1">Hello, how can I help you?</p>
                <p className="text-white/60 text-sm">English</p>
              </div>
              
              <div className="flex flex-col items-center">
                <ArrowLeftRight className="w-8 h-8 text-blue-400 mb-2 animate-pulse" />
                <Languages className="w-6 h-6 text-white/60" />
                <p className="text-white/60 text-xs mt-1">152+ Languages</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🇲🇽</span>
                </div>
                <p className="text-white/90 font-medium mb-1">Hola, ¿cómo puedo ayudarte?</p>
                <p className="text-white/60 text-sm">Español</p>
              </div>
            </div>
          </div>
        )}

        {/* Scroll Indicator (keeping original) */}
        {!showHandsFreeSetup && !showEnrollmentFlow && !showConversation && (
          <div className="flex justify-center mt-16">
            <div className="animate-bounce">
              <ChevronDown className="w-6 h-6 text-white/60" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HandsFreeHeroSection

