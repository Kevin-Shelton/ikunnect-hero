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
        verbumRef.current.stopStream().catch(()=>{})
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
      
      // Cleanup audio
      import('./lib/audio.ts').then(m => m.cleanup()).catch(()=>{})
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
      analyser.smoothingTimeConstant = 0.8
      microphone.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      
      // Start monitoring audio levels
      monitorAudioLevel()
    } catch (error) {
      console.error('Error setting up audio context:', error)
    }
  }

  // Monitor audio levels for visual feedback
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    
    const updateLevel = () => {
      analyserRef.current.getByteFrequencyData(dataArray)
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
      const normalizedLevel = average / 255
      
      setAudioLevel(normalizedLevel)
      
      // Update speaking state based on audio level
      setIsSpeaking(normalizedLevel > 0.1 && isRecording)
      
      if (isRecording) {
        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }
    }
    
    updateLevel()
  }

  // Start recording audio
  const startRecording = async () => {
    try {
      let stream = audioStreamRef.current
      
      // Request permission if not already granted
      if (!stream || !hasPermission) {
        stream = await requestMicrophonePermission()
        if (!stream) return
      }
      
      // Create MediaRecorder
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
        setRecordedAudio({ blob: audioBlob, url: audioUrl })
        console.log('Recording stopped, audio saved')
      }
      
      mediaRecorder.start(100) // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder
      
      setIsRecording(true)
      monitorAudioLevel()
      
      console.log('Recording started')
    } catch (error) {
      console.error('Error starting recording:', error)
      setPermissionError('Failed to start recording. Please try again.')
    }
  }

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    
    setIsRecording(false)
    setIsSpeaking(false)
    setAudioLevel(0)
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    console.log('Recording stopped')
  }

  // Play recorded audio
  const playRecordedAudio = () => {
    if (recordedAudio?.url) {
      const audio = new Audio(recordedAudio.url)
      audio.play().catch(error => {
        console.error('Error playing audio:', error)
      })
    }
  }

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

    // 2) short employee enrollment (5–8s) – reuse MediaRecorder path
    try {
      setIsEnrolling(true)
      setStatusText('Please read the phrase aloud for a few seconds to enroll your voice...')
      
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const src = audioCtx.createMediaStreamSource(stream)
      const rec = audioCtx.createScriptProcessor(4096, 1, 1)
      const buffers = []
      
      rec.onaudioprocess = e => buffers.push(e.inputBuffer.getChannelData(0).slice(0))
      src.connect(rec)
      rec.connect(audioCtx.destination)

      await new Promise(r => setTimeout(r, 6000)) // simple 6s capture
      rec.disconnect()
      src.disconnect()

      const flat = new Float32Array(buffers.reduce((a,b)=>a+b.length,0))
      let o=0
      buffers.forEach(b=>{ flat.set(b,o); o+=b.length })

      // 3) init verbum + enroll
      const { createVerbumHandle } = await import('./adapters/verbumAdapter.ts')
      verbumRef.current = await createVerbumHandle()
      await verbumRef.current.enrollEmployeeVoice(flat)
      enrolledRef.current = true
      setIsEnrolling(false)

      // 4) init router
      const { SpeakerRouter } = await import('./lib/speakerRouter.ts')
      const { translateText } = await import('./api/translationClient.ts')
      
      routerRef.current = new SpeakerRouter(
        { minTurn:1500, silence:600, vp:0.65 },
        async (role, text) => {
          if (role === 'employee') {
            setEmployeeText(text)
            try {
              const { translatedText } = await translateText({ 
                text, 
                source:'en', 
                target:selectedLanguage?.code?.slice(0,2) || 'es' 
              })
              setCustomerText(translatedText)
            } catch (error) {
              console.error('Translation failed:', error)
            }
          } else {
            setCustomerText(text)
            try {
              const { translatedText } = await translateText({ 
                text, 
                source:selectedLanguage?.code?.slice(0,2) || 'es', 
                target:'en' 
              })
              setEmployeeText(translatedText)
              // optional TTS: const url = await verbumRef.current.synthesize(translatedText, 'en'); await play(url);
            } catch (error) {
              console.error('Translation failed:', error)
            }
          }
        },
        setStatusText
      )

      // 5) start SDK stream (hands‑free)
      await verbumRef.current.startStream(
        { diarization:true, vad:true, echoCancellation:true }, 
        (chunk) => {
          // When speech detected, duck any playing TTS; resume after 600ms silence
          if (chunk.vad?.isSpeech) { 
            import('./lib/audio.ts').then(m=>m.duck())
            setIsSpeaking(true)
          } else { 
            import('./lib/audio.ts').then(m=>m.resumeAfter(600))
            setIsSpeaking(false)
          }
          
          routerRef.current.push({
            ts: Date.now(),
            partial: chunk.partial,
            final: chunk.final,
            diarization: chunk.diarization,
            voiceprintScore: chunk.voiceprintScore,
            vad: chunk.vad
          })
        }
      )

      setIsRecording(true)
      setStatusText('Hands-free mode active - speak naturally')

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

              {/* Microphone Status Indicator - Always Visible */}
              <div className="flex justify-center mb-6">
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
                    if (verbumRef.current) {
                      await verbumRef.current.stopStream()
                      setStatusText('Paused')
                      setIsRecording(false)
                    }
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
                  // Cleanup hands-free resources
                  if (verbumRef.current) {
                    await verbumRef.current.stopStream().catch(()=>{})
                    verbumRef.current.dispose?.()
                    verbumRef.current = null
                  }
                  
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 px-4">
                  {recentLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang)}
                      className="flag-tile group p-4 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg"
                      style={{ 
                        background: 'var(--glass-light)', 
                        borderColor: 'var(--stroke)',
                        border: '1px solid',
                        minHeight: '120px'
                      }}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <FlagIcon countryCode={lang.flag} size="medium" />
                        <div className="mt-3 text-center">
                          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {lang.flag}
                          </div>
                          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            {lang.native}
                          </div>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-h-96 overflow-y-auto p-4">
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang)}
                    className="flag-tile group p-4 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    style={{ 
                      background: 'var(--glass-light)', 
                      borderColor: 'var(--stroke)',
                      border: '1px solid',
                      minHeight: '120px'
                    }}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <FlagIcon countryCode={lang.flag} size="medium" />
                      <div className="mt-3 text-center">
                        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {lang.flag}
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          {lang.native}
                        </div>
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
      <div className="max-w-4xl w-full text-center relative">
        
        {/* Microphone Status Indicator - Top Right - More Visible */}
        <div className="absolute top-6 right-6 z-10">
          <div className="flex items-center gap-3 px-4 py-3 rounded-full shadow-lg" 
               style={{ 
                 background: 'rgba(30, 64, 175, 0.9)', 
                 borderColor: 'rgba(59, 130, 246, 0.7)',
                 border: '2px solid',
                 backdropFilter: 'blur(10px)'
               }}>
            <div className="relative">
              {hasPermission === true ? (
                <Mic className="w-5 h-5 text-green-300" />
              ) : hasPermission === false ? (
                <MicOff className="w-5 h-5 text-red-300" />
              ) : (
                <Mic className="w-5 h-5 text-white opacity-70" />
              )}
            </div>
            <span className={`text-sm font-semibold ${
              hasPermission === true 
                ? 'text-green-300' 
                : hasPermission === false 
                  ? 'text-red-300'
                  : 'text-white opacity-70'
            }`}>
              {hasPermission === true 
                ? 'MIC READY' 
                : hasPermission === false 
                  ? 'MIC OFF'
                  : 'MIC STATUS'
              }
            </span>
            <div className={`w-2 h-2 rounded-full ${
              hasPermission === true 
                ? 'bg-green-300' 
                : hasPermission === false 
                  ? 'bg-red-300'
                  : 'bg-gray-400'
            }`}></div>
          </div>
        </div>

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

