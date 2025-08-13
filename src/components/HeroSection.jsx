import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Languages, ChevronDown, ArrowLeftRight, Search, Mic, MicOff, Volume2, AlertCircle } from 'lucide-react'
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
  
  // Microphone and audio recording states
  const [hasPermission, setHasPermission] = useState(null)
  const [permissionError, setPermissionError] = useState(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordedAudio, setRecordedAudio] = useState(null)
  
  // New hands-free states
  const [employeeText, setEmployeeText] = useState('')
  const [customerText, setCustomerText] = useState('')
  const [statusText, setStatusText] = useState('Idle')
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [isHandsFree, setIsHandsFree] = useState(false)
  
  // Refs for audio handling
  const mediaRecorderRef = useRef(null)
  const audioStreamRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationFrameRef = useRef(null)
  
  // New refs for hands-free functionality
  const verbumRef = useRef(null)
  const routerRef = useRef(null)
  const enrolledRef = useRef(false)

  useEffect(() => {
    setIsVisible(true)
    // Check for microphone support
    checkMicrophoneSupport()
    
    // Cleanup function
    return () => {
      stopRecording()
      
      // Cleanup hands-free resources
      if (verbumRef.current) {
        verbumRef.current.stopStream?.().catch(()=>{})
        verbumRef.current.dispose?.()
        verbumRef.current = null
      }
      
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Check if browser supports microphone access
  const checkMicrophoneSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionError('Microphone access is not supported in this browser')
      setHasPermission(false)
      return false
    }
    return true
  }

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      setPermissionError(null)
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      })
      
      audioStreamRef.current = stream
      setHasPermission(true)
      
      // Set up audio context for level monitoring
      setupAudioContext(stream)
      
      console.log('Microphone permission granted')
      return stream
    } catch (error) {
      console.error('Microphone permission denied:', error)
      setHasPermission(false)
      
      if (error.name === 'NotAllowedError') {
        setPermissionError('Microphone access denied. Please allow microphone access and try again.')
      } else if (error.name === 'NotFoundError') {
        setPermissionError('No microphone found. Please connect a microphone and try again.')
      } else if (error.name === 'NotReadableError') {
        setPermissionError('Microphone is already in use by another application.')
      } else {
        setPermissionError('Unable to access microphone. Please check your settings.')
      }
      return null
    }
  }

  // Set up audio context for real-time audio level monitoring
  const setupAudioContext = (stream) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      
      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      microphone.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      
      // Start monitoring audio levels
      const monitorAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray)
          
          // Calculate average volume
          let sum = 0
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i]
          }
          const average = sum / bufferLength / 255 // Normalize to 0-1
          
          setAudioLevel(average)
          
          // Detect if speaking (above threshold)
          const speakingThreshold = 0.1
          const currentlySpeaking = average > speakingThreshold
          
          if (currentlySpeaking !== isSpeaking) {
            setIsSpeaking(currentlySpeaking)
          }
          
          animationFrameRef.current = requestAnimationFrame(monitorAudioLevel)
        }
      }
      
      monitorAudioLevel()
      
    } catch (error) {
      console.error('Failed to set up audio context:', error)
    }
  }

  // Start recording audio
  const startRecording = async () => {
    try {
      let stream = audioStreamRef.current
      
      if (!stream) {
        stream = await requestMicrophonePermission()
        if (!stream) return
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      const audioChunks = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        setRecordedAudio(audioUrl)
        console.log('Recording stopped, audio saved')
      }
      
      mediaRecorder.onerror = (error) => {
        console.error('MediaRecorder error:', error)
        setPermissionError('Recording failed. Please try again.')
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      
      console.log('Recording started')
      
    } catch (error) {
      console.error('Failed to start recording:', error)
      setPermissionError('Could not start recording. Please check your microphone.')
    }
  }

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      console.log('Recording stopped')
    }
  }

  // Play recorded audio
  const playRecordedAudio = () => {
    if (recordedAudio) {
      const audio = new Audio(recordedAudio)
      audio.play().catch(error => {
        console.error('Failed to play audio:', error)
      })
    }
  }

  // Consent message translations
  const getConsentMessage = (language) => {
    const messages = {
      'en-US': 'This conversation is being recorded for quality purposes. Do you agree to proceed?',
      'es-MX': 'Esta conversación está siendo grabada con fines de calidad. ¿Estás de acuerdo en continuar?',
      'fr-FR': 'Cette conversation est enregistrée à des fins de qualité. Êtes-vous d\'accord pour continuer?',
      'de-DE': 'Dieses Gespräch wird zu Qualitätszwecken aufgezeichnet. Stimmen Sie zu, fortzufahren?',
      'zh-CN': '此对话正在录音以确保质量。您同意继续吗？',
      'ja-JP': 'この会話は品質向上のために録音されています。続行に同意しますか？',
      'ko-KR': '이 대화는 품질 목적으로 녹음되고 있습니다. 계속 진행하는 데 동의하십니까？',
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

  const handleConsentAccept = async () => {
    setShowConsent(false)
    setShowConversation(true)
    setIsHandsFree(true)

    // 1) mic permission
    let stream = audioStreamRef.current
    if (!stream || !hasPermission) {
      stream = await requestMicrophonePermission()
      if (!stream) return
    }

    // 2) short employee enrollment (5–8s) – simplified for build
    try {
      setIsEnrolling(true)
      setStatusText('Please read the phrase aloud for a few seconds to enroll your voice...')
      
      // Simplified enrollment simulation
      await new Promise(r => setTimeout(r, 6000))
      
      setIsEnrolling(false)
      setIsRecording(true)
      setStatusText('Hands-free mode active - speak naturally')

      // Simulate conversation updates
      setTimeout(() => {
        setEmployeeText('Hello, how can I help you today?')
        setCustomerText(getCustomerGreeting(selectedLanguage).replace(/"/g, ''))
      }, 2000)

    } catch (e) {
      console.error('hands-free init failed', e)
      setPermissionError('Could not start hands‑free mode. Please try again.')
      setIsEnrolling(false)
      setIsHandsFree(false)
    }
  }

  const handleConsentDecline = () => {
    setShowConsent(false)
    setShowLanguageGrid(true)
    setSelectedLanguage(null)
  }

  const toggleRecording = async () => {
    if (!isRecording) {
      await startRecording()
    } else {
      stopRecording()
    }
  }

  // Flag Icon Component
  const FlagIcon = ({ countryCode, size = 'medium' }) => {
    const sizeClasses = {
      small: 'w-8 h-8',
      medium: 'w-12 h-12',
      large: 'w-16 h-16'
    }

    const flagUrl = `https://flagcdn.com/80x60/${countryCode?.toLowerCase()}.png`
    
    return (
      <div className={`${sizeClasses[size]} rounded-lg overflow-hidden shadow-md border border-white/20 bg-white/10 flex items-center justify-center`}>
        <img 
          src={flagUrl}
          alt={`${countryCode} flag`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to country code if flag image fails
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
        <div className="w-full h-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center" style={{display: 'none'}}>
          {countryCode}
        </div>
      </div>
    )
  }

  // Language data with comprehensive list
  const languages = [
    // Recent languages (updated with Mexican Spanish)
    { code: 'en-US', name: 'English', native: 'English', flag: 'us' },
    { code: 'es-MX', name: 'Spanish (Mexico)', native: 'Español', flag: 'mx' },
    { code: 'fr-FR', name: 'French', native: 'Français', flag: 'fr' },
    { code: 'de-DE', name: 'German', native: 'Deutsch', flag: 'de' },
    
    // All languages
    { code: 'en-US', name: 'English (US)', native: 'English', flag: 'us' },
    { code: 'en-GB', name: 'English (UK)', native: 'English', flag: 'gb' },
    { code: 'en-AU', name: 'English (Australia)', native: 'English', flag: 'au' },
    { code: 'en-CA', name: 'English (Canada)', native: 'English', flag: 'ca' },
    { code: 'en-NZ', name: 'English (New Zealand)', native: 'English', flag: 'nz' },
    { code: 'es-ES', name: 'Spanish (Spain)', native: 'Español', flag: 'es' },
    { code: 'es-MX', name: 'Spanish (Mexico)', native: 'Español', flag: 'mx' },
    { code: 'es-AR', name: 'Spanish (Argentina)', native: 'Español', flag: 'ar' },
    { code: 'es-CO', name: 'Spanish (Colombia)', native: 'Español', flag: 'co' },
    { code: 'es-CL', name: 'Spanish (Chile)', native: 'Español', flag: 'cl' },
    { code: 'fr-FR', name: 'French (France)', native: 'Français', flag: 'fr' },
    { code: 'fr-CA', name: 'French (Canada)', native: 'Français', flag: 'ca' },
    { code: 'de-DE', name: 'German (Germany)', native: 'Deutsch', flag: 'de' },
    { code: 'it-IT', name: 'Italian', native: 'Italiano', flag: 'it' },
    { code: 'pt-PT', name: 'Portuguese', native: 'Português', flag: 'pt' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', native: '中文', flag: 'cn' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', native: '中文', flag: 'tw' },
    { code: 'ja-JP', name: 'Japanese', native: '日本語', flag: 'jp' },
    { code: 'ko-KR', name: 'Korean', native: '한국어', flag: 'kr' },
    { code: 'ar-SA', name: 'Arabic', native: 'العربية', flag: 'sa' },
    { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी', flag: 'in' },
    { code: 'ru-RU', name: 'Russian', native: 'Русский', flag: 'ru' },
    { code: 'ms-MY', name: 'Malay (Malaysia)', native: 'Bahasa Melayu', flag: 'my' },
    { code: 'da-DK', name: 'Danish', native: 'Dansk', flag: 'dk' }
  ]

  const recentLanguages = languages.slice(0, 4)
  const allLanguages = languages.slice(4)

  const filteredLanguages = allLanguages.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.native.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 25%, #334155 50%, #475569 75%, #64748B 100%)'
    }}>
      {/* CSS Variables */}
      <style jsx>{`
        :root {
          --bg-primary: #0E2042;
          --bg-secondary: #102B5C;
          --bg-tertiary: #1B3C7A;
          --text-primary: #FFFFFF;
          --text-secondary: #E2E8F0;
          --text-muted: #94A3B8;
          --accent-blue: #3B82F6;
          --accent-light: #60A5FA;
          --glass-light: rgba(255, 255, 255, 0.05);
          --glass-medium: rgba(255, 255, 255, 0.1);
          --stroke: rgba(255, 255, 255, 0.2);
          --shadow: rgba(0, 0, 0, 0.3);
        }
        
        .glass-card {
          background: var(--glass-light);
          backdrop-filter: blur(10px);
          border: 1px solid var(--stroke);
          border-radius: 24px;
        }
        
        .pill-button {
          border-radius: 50px;
          font-weight: 600;
          transition: all 0.3s ease;
          border: none;
        }
        
        .pill-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        .fade-in {
          animation: fadeIn 1s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .pulse-glow {
          animation: pulseGlow 2s ease-in-out infinite;
        }
        
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 50px rgba(59, 130, 246, 0.8), 0 0 100px rgba(59, 130, 246, 0.3);
          }
        }
        
        .text-display {
          font-size: clamp(3rem, 8vw, 4rem);
          font-weight: 800;
          line-height: 1.1;
        }
        
        .text-h2 {
          font-size: clamp(1.75rem, 4vw, 2.25rem);
          font-weight: 600;
          line-height: 1.2;
        }
        
        .text-h3 {
          font-size: clamp(1.25rem, 3vw, 1.5rem);
          font-weight: 600;
          line-height: 1.3;
        }
        
        .text-body {
          font-size: clamp(1rem, 2.5vw, 1.125rem);
          font-weight: 400;
          line-height: 1.5;
        }
      `}</style>

      {/* Microphone Status Indicator - Top Right */}
      {showConversation && (
        <div className="fixed top-6 right-6 z-50">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg" 
               style={{ 
                 background: 'rgba(30, 64, 175, 0.9)', 
                 borderColor: 'rgba(59, 130, 246, 0.7)',
                 border: '2px solid',
                 backdropFilter: 'blur(10px)'
               }}>
            <div className="relative">
              {hasPermission ? (
                <Mic className="w-5 h-5 text-green-300" />
              ) : (
                <MicOff className="w-5 h-5 text-red-300" />
              )}
            </div>
            <span className={`text-sm font-semibold ${
              hasPermission ? 'text-green-300' : 'text-red-300'
            }`}>
              {hasPermission ? 'MIC READY' : 'MIC OFF'}
            </span>
            <div className={`w-2 h-2 rounded-full ${
              hasPermission ? 'bg-green-300' : 'bg-red-300'
            }`}></div>
          </div>
        </div>
      )}

      <div className={`w-full max-w-4xl mx-auto ${isVisible ? 'fade-in' : 'opacity-0'}`}>
        {/* Hero Section */}
        {!showLanguageGrid && !showConversation && !showConsent && (
          <div className="glass-card p-8 md:p-12 text-center">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <img 
                src={logoSvg} 
                alt="iKOneWorld Logo" 
                className="h-96 w-auto"
              />
            </div>

            {/* Tagline */}
            <p className="text-h3 mb-8" style={{ color: 'var(--text-secondary)' }}>
              Real-time translation supporting 152+ languages with AI-powered intelligence
            </p>

            {/* Translation Orb */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center pulse-glow"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #1E40AF)' }}
                >
                  <Languages className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>

            {/* Language count */}
            <div className="mb-8 flex items-center justify-center gap-2">
              <Languages className="w-5 h-5" style={{ color: 'var(--accent-light)' }} />
              <span className="text-body" style={{ color: 'var(--text-muted)' }}>152+ Languages</span>
            </div>

            {/* Language showcase */}
            <div className="mb-8 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <FlagIcon countryCode="US" size="small" />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>"Hello, how are you?"</span>
              </div>
              <ArrowLeftRight className="w-5 h-5" style={{ color: 'var(--accent-light)' }} />
              <div className="flex items-center gap-2">
                <FlagIcon countryCode="ES" size="small" />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>"Hola, ¿cómo estás?"</span>
              </div>
            </div>

            {/* Action buttons */}
            {!emailMode ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleStartConversation}
                  className="pill-button bg-white text-blue-900 hover:bg-gray-100 px-8 py-3 text-lg"
                >
                  Start Conversation
                </Button>
                <Button
                  onClick={handleTryDemo}
                  className="pill-button bg-white text-blue-900 hover:bg-gray-100 px-8 py-3 text-lg"
                >
                  Try Demo
                </Button>
                <Button
                  onClick={handleTryVoice}
                  variant="outline"
                  className="pill-button border-white text-white hover:bg-white/10 px-8 py-3 text-lg"
                >
                  Try Your Voice
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/60"
                  />
                  <Button
                    onClick={handleEmailVerification}
                    className="pill-button bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    Verify
                  </Button>
                </div>
                <Button
                  onClick={() => setEmailMode(false)}
                  variant="ghost"
                  className="text-white/70 hover:text-white"
                >
                  Back
                </Button>
              </div>
            )}

            {/* Scroll indicator */}
            <div className="mt-12 flex justify-center">
              <ChevronDown className="w-6 h-6 animate-bounce" style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
        )}

        {/* Language Selection Grid */}
        {showLanguageGrid && (
          <div className="glass-card p-8">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <img 
                src={logoSvg} 
                alt="iKOneWorld Logo" 
                className="h-64 w-auto"
              />
            </div>

            <h2 className="text-h2 text-center mb-6" style={{ color: 'var(--text-primary)' }}>
              Select your target language
            </h2>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              <Input
                type="text"
                placeholder="Search languages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/30 text-white placeholder:text-white/60"
              />
            </div>

            {/* Recent Languages */}
            <div className="mb-8">
              <h3 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>Recent</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {recentLanguages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageSelect(language)}
                    className="glass-card p-4 flex flex-col items-center justify-center hover:scale-105 hover:shadow-lg transition-all duration-200"
                    style={{ minHeight: '120px' }}
                  >
                    <FlagIcon countryCode={language.flag} size="medium" />
                    <div className="mt-3 text-center">
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {language.flag.toUpperCase()}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {language.native}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* All Languages */}
            <div>
              <h3 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>All Languages</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-h-96 overflow-y-auto">
                {filteredLanguages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageSelect(language)}
                    className="glass-card p-4 flex flex-col items-center justify-center hover:scale-105 hover:shadow-lg transition-all duration-200"
                    style={{ minHeight: '120px' }}
                  >
                    <FlagIcon countryCode={language.flag} size="medium" />
                    <div className="mt-3 text-center">
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {language.flag.toUpperCase()}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {language.native}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Back button */}
            <div className="mt-8 text-center">
              <Button
                onClick={() => setShowLanguageGrid(false)}
                variant="outline"
                className="pill-button border-white/30 text-white hover:bg-white/10 px-6 py-3"
              >
                Back to Home
              </Button>
            </div>
          </div>
        )}

        {/* Consent Dialog */}
        {showConsent && selectedLanguage && (
          <div className="glass-card p-8 text-center">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <img 
                src={logoSvg} 
                alt="iKOneWorld Logo" 
                className="h-80 w-auto"
              />
            </div>

            {/* English consent */}
            <div className="mb-6">
              <h3 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>English</h3>
              <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                This conversation is being recorded for quality purposes. Do you agree to proceed?
              </p>
            </div>

            {/* Selected language consent */}
            <div className="mb-8">
              <h3 className="text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
                {selectedLanguage.name || selectedLanguage.native}
              </h3>
              <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                {getConsentMessage(selectedLanguage)}
              </p>
            </div>

            {/* Consent buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleConsentAccept}
                className="pill-button bg-white text-blue-900 hover:bg-gray-100 px-8 py-3"
              >
                {getButtonText(selectedLanguage, 'ok')} / OK
              </Button>
              <Button
                onClick={handleConsentDecline}
                variant="outline"
                className="pill-button border-white/30 text-white hover:bg-white/10 px-8 py-3"
              >
                {getButtonText(selectedLanguage, 'cancel')} / Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Conversation Interface */}
        {showConversation && selectedLanguage && (
          <div className="glass-card p-8">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <img 
                src={logoSvg} 
                alt="iKOneWorld Logo" 
                className="h-80 w-auto"
              />
            </div>

            {/* Enhanced Translation Orb */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div 
                  className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isRecording && isSpeaking ? 'pulse-glow scale-110' : 'pulse-glow'
                  }`}
                  style={{ 
                    background: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
                    boxShadow: isRecording && isSpeaking 
                      ? '0 0 50px rgba(59, 130, 246, 0.8), 0 0 100px rgba(59, 130, 246, 0.4)' 
                      : '0 0 30px rgba(59, 130, 246, 0.5)'
                  }}
                >
                  <Languages className="w-16 h-16 text-white" />
                </div>
                
                {/* Pulse rings when speaking */}
                {isRecording && isSpeaking && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping opacity-40"></div>
                    <div className="absolute inset-0 rounded-full border border-blue-400 animate-pulse opacity-60"></div>
                  </>
                )}
              </div>
            </div>

            {/* Status Indicator */}
            <div className="mb-6 flex justify-center">
              <div className="flex items-center gap-3 px-6 py-3 rounded-full shadow-lg" 
                   style={{ 
                     background: 'rgba(30, 64, 175, 0.8)', 
                     borderColor: 'rgba(59, 130, 246, 0.5)',
                     border: '2px solid',
                     backdropFilter: 'blur(10px)'
                   }}>
                <div className="relative">
                  {isRecording ? (
                    <div className="relative">
                      <Mic className={`w-6 h-6 ${isSpeaking ? 'text-green-300' : 'text-red-300'}`} />
                      {isSpeaking && (
                        <div className="absolute -inset-2 rounded-full animate-ping bg-green-300 opacity-40"></div>
                      )}
                    </div>
                  ) : (
                    <MicOff className="w-6 h-6 text-white opacity-70" />
                  )}
                </div>
                <span className={`text-base font-semibold ${
                  isRecording 
                    ? isSpeaking 
                      ? 'text-green-300' 
                      : 'text-red-300'
                    : 'text-white opacity-70'
                }`}>
                  {statusText.toUpperCase()}
                </span>
                <div className={`w-3 h-3 rounded-full ${
                  isRecording 
                    ? isSpeaking 
                      ? 'bg-green-300 animate-pulse' 
                      : 'bg-red-300 animate-pulse'
                    : hasPermission === false
                      ? 'bg-red-400'
                      : 'bg-gray-400'
                }`}></div>
              </div>
            </div>

            {/* Microphone Permission Status */}
            {permissionError && (
              <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', border: '1px solid' }}>
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{permissionError}</span>
                </div>
                <Button
                  onClick={requestMicrophonePermission}
                  className="mt-2 pill-button bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm"
                >
                  Grant Microphone Access
                </Button>
              </div>
            )}

            {/* Audio Level Indicator */}
            {hasPermission && isRecording && (
              <div className="mb-6 flex justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Audio Level:</span>
                  <div className="w-32 h-2 rounded-full" style={{ background: 'var(--glass-light)' }}>
                    <div 
                      className="h-full rounded-full transition-all duration-100"
                      style={{ 
                        width: `${audioLevel * 100}%`,
                        background: audioLevel > 0.5 ? '#10B981' : audioLevel > 0.2 ? '#F59E0B' : '#6B7280'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

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
                    {employeeText || '"Hello, how can I help you today?"'}
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
                    {customerText || getCustomerGreeting(selectedLanguage)}
                  </p>
                </div>
              </div>
            </div>

            {/* Recording controls - Hidden in hands-free mode */}
            {!isHandsFree && (
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
                  onClick={playRecordedAudio}
                  disabled={!recordedAudio}
                  className={`pill-button px-6 py-3 flex items-center gap-2 ${
                    recordedAudio 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Volume2 className="w-5 h-5" />
                  Play Translation
                </Button>
              </div>
            )}

            {/* Hands-free controls */}
            {isHandsFree && (
              <div className="flex justify-center gap-4 mb-6">
                <Button
                  onClick={async () => {
                    setStatusText('Paused')
                    setIsRecording(false)
                  }}
                  className="pill-button px-6 py-3 flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <MicOff className="w-5 h-5" />
                  Pause Listening
                </Button>
                
                <Button
                  onClick={playRecordedAudio}
                  disabled={!recordedAudio}
                  className={`pill-button px-6 py-3 flex items-center gap-2 ${
                    recordedAudio 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Volume2 className="w-5 h-5" />
                  Play Translation
                </Button>
              </div>
            )}

            {/* Back to language selection */}
            <div className="text-center">
              <Button
                onClick={async () => {
                  setShowConversation(false)
                  setShowLanguageGrid(true)
                  setSelectedLanguage(null)
                  setIsHandsFree(false)
                  setEmployeeText('')
                  setCustomerText('')
                  setStatusText('Idle')
                  stopRecording()
                  setRecordedAudio(null)
                }}
                variant="outline"
                className="pill-button border-white/30 text-white hover:bg-white/10 px-6 py-3"
              >
                Change Language
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HeroSection

