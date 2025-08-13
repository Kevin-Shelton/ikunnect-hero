import { useState, useEffect } from 'react'
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

  // Consent messages in both languages
  const getConsentMessage = (language) => {
    const messages = {
      'en-US': 'This conversation is being recorded for quality purposes. Do you agree to proceed?',
      'es-MX': 'Esta conversación está siendo grabada con fines de calidad. ¿Está de acuerdo en continuar?',
      'es-ES': 'Esta conversación está siendo grabada con fines de calidad. ¿Está de acuerdo en continuar?',
      'fr-FR': 'Cette conversation est enregistrée à des fins de qualité. Êtes-vous d\'accord pour continuer?',
      'de-DE': 'Dieses Gespräch wird zu Qualitätszwecken aufgezeichnet. Stimmen Sie zu, fortzufahren?',
      'zh-CN': '此对话正在录音以确保质量。您同意继续吗？',
      'zh-TW': '此對話正在錄音以確保品質。您同意繼續嗎？',
      'ja-JP': 'この会話は品質向上のために録音されています。続行に同意しますか？',
      'ko-KR': '이 대화는 품질 목적으로 녹음되고 있습니다. 계속 진행하는 것에 동의하십니까？',
      'ar-SA': 'يتم تسجيل هذه المحادثة لأغراض الجودة. هل توافق على المتابعة؟',
      'hi-IN': 'यह बातचीत गुणवत्ता के उद्देश्यों के लिए रिकॉर्ड की जा रही है। क्या आप आगे बढ़ने के लिए सहमत हैं?',
      'pt-BR': 'Esta conversa está sendo gravada para fins de qualidade. Você concorda em prosseguir?',
      'pt-PT': 'Esta conversa está a ser gravada para fins de qualidade. Concorda em prosseguir?',
      'it-IT': 'Questa conversazione viene registrata per scopi di qualità. Sei d\'accordo a procedere?',
      'ru-RU': 'Этот разговор записывается в целях качества. Согласны ли вы продолжить?',
      'ms-MY': 'Perbualan ini sedang dirakam untuk tujuan kualiti. Adakah anda bersetuju untuk meneruskan?',
      'th-TH': 'การสนทนานี้กำลังถูกบันทึกเพื่อวัตถุประสงค์ด้านคุณภาพ คุณยินยอมที่จะดำเนินการต่อหรือไม่?',
      'vi-VN': 'Cuộc trò chuyện này đang được ghi âm cho mục đích chất lượng. Bạn có đồng ý tiếp tục không?',
      'id-ID': 'Percakapan ini sedang direkam untuk tujuan kualitas. Apakah Anda setuju untuk melanjutkan?',
      'tl-PH': 'Ang pag-uusapang ito ay nirerekord para sa mga layuning kalidad. Sumasang-ayon ka ba na magpatuloy?',
      'nl-NL': 'Dit gesprek wordt opgenomen voor kwaliteitsdoeleinden. Ga je akkoord om door te gaan?',
      'sv-SE': 'Detta samtal spelas in för kvalitetsändamål. Godkänner du att fortsätta?',
      'da-DK': 'Denne samtale optages til kvalitetsformål. Er du enig i at fortsætte?',
      'no-NO': 'Denne samtalen blir tatt opp for kvalitetsformål. Er du enig i å fortsette?',
      'fi-FI': 'Tämä keskustelu tallennetaan laatutarkoituksiin. Hyväksytkö jatkamisen?',
      'pl-PL': 'Ta rozmowa jest nagrywana w celach jakościowych. Czy zgadzasz się kontynuować?',
      'cs-CZ': 'Tento rozhovor je nahráván pro účely kvality. Souhlasíte s pokračováním?',
      'hu-HU': 'Ez a beszélgetés minőségi célokból kerül rögzítésre. Egyetért a folytatással?',
      'ro-RO': 'Această conversație este înregistrată în scopuri de calitate. Sunteți de acord să continuați?',
      'bg-BG': 'Този разговор се записва за целите на качеството. Съгласни ли сте да продължите?',
      'hr-HR': 'Ovaj razgovor se snima u svrhu kvalitete. Slažete li se da nastavimo?',
      'sk-SK': 'Tento rozhovor sa nahráva na účely kvality. Súhlasíte s pokračovaním?',
      'sl-SI': 'Ta pogovor se posname za namene kakovosti. Se strinjate s nadaljevanjem?',
      'et-EE': 'See vestlus salvestatakse kvaliteedi eesmärkidel. Kas nõustute jätkamisega?',
      'lv-LV': 'Šī saruna tiek ierakstīta kvalitātes nolūkos. Vai piekrītat turpināt?',
      'lt-LT': 'Šis pokalbis įrašomas kokybės tikslais. Ar sutinkate tęsti?',
      'mt-MT': 'Din il-konversazzjoni qed tiġi rrekordjata għal skopijiet ta\' kwalità. Taqbel li tkompli?',
      'el-GR': 'Αυτή η συνομιλία καταγράφεται για σκοπούς ποιότητας. Συμφωνείτε να συνεχίσετε;',
      'tr-TR': 'Bu konuşma kalite amaçları için kaydediliyor. Devam etmeyi kabul ediyor musunuz?',
      'he-IL': 'השיחה הזו מוקלטת למטרות איכות. האם אתה מסכים להמשיך?',
      'fa-IR': 'این مکالمه برای اهداف کیفیت ضبط می‌شود. آیا موافق ادامه هستید؟',
      'ur-PK': 'یہ گفتگو معیار کے مقاصد کے لیے ریکارڈ کی جا رہی ہے۔ کیا آپ جاری رکھنے پر راضی ہیں؟',
      'bn-BD': 'এই কথোপকথনটি গুণমানের উদ্দেশ্যে রেকর্ড করা হচ্ছে। আপনি কি এগিয়ে যেতে সম্মত?',
      'ta-IN': 'இந்த உரையாடல் தரமான நோக்கங்களுக்காக பதிவு செய்யப்படுகிறது. தொடர ஒப்புக்கொள்கிறீர்களா?',
      'te-IN': 'ఈ సంభాషణ నాణ్యత ప్రయోజనాల కోసం రికార్డ్ చేయబడుతోంది. మీరు కొనసాగించడానికి అంగీకరిస్తున్నారా?',
      'ml-IN': 'ഈ സംഭാഷണം ഗുണനിലവാര ആവശ്യങ്ങൾക്കായി റെക്കോർഡ് ചെയ്യുന്നു. തുടരാൻ നിങ്ങൾ സമ്മതിക്കുന്നുണ്ടോ?',
      'kn-IN': 'ಈ ಸಂಭಾಷಣೆಯನ್ನು ಗುಣಮಟ್ಟದ ಉದ್ದೇಶಗಳಿಗಾಗಿ ರೆಕಾರ್ಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ. ಮುಂದುವರಿಸಲು ನೀವು ಒಪ್ಪುತ್ತೀರಾ?',
      'gu-IN': 'આ વાર્તાલાપ ગુણવત્તાના હેતુઓ માટે રેકોર્ડ કરવામાં આવી રહ્યો છે. શું તમે આગળ વધવા માટે સંમત છો?',
      'pa-IN': 'ਇਹ ਗੱਲਬਾਤ ਗੁਣਵੱਤਾ ਦੇ ਉਦੇਸ਼ਾਂ ਲਈ ਰਿਕਾਰਡ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ। ਕੀ ਤੁਸੀਂ ਅੱਗੇ ਵਧਣ ਲਈ ਸਹਿਮਤ ਹੋ?'
    }
    return messages[language?.code] || messages['en-US']
  }

  // Button text translations for consent dialog
  const getButtonText = (language, buttonType) => {
    const translations = {
      'en-US': { ok: 'OK', cancel: 'Cancel' },
      'es-MX': { ok: 'Sí', cancel: 'Cancelar' },
      'es-ES': { ok: 'Sí', cancel: 'Cancelar' },
      'fr-FR': { ok: 'OK', cancel: 'Annuler' },
      'de-DE': { ok: 'OK', cancel: 'Abbrechen' },
      'zh-CN': { ok: '确定', cancel: '取消' },
      'zh-TW': { ok: '確定', cancel: '取消' },
      'ja-JP': { ok: 'はい', cancel: 'キャンセル' },
      'ko-KR': { ok: '확인', cancel: '취소' },
      'ar-SA': { ok: 'موافق', cancel: 'إلغاء' },
      'hi-IN': { ok: 'ठीक है', cancel: 'रद्द करें' },
      'pt-BR': { ok: 'OK', cancel: 'Cancelar' },
      'pt-PT': { ok: 'OK', cancel: 'Cancelar' },
      'it-IT': { ok: 'OK', cancel: 'Annulla' },
      'ru-RU': { ok: 'ОК', cancel: 'Отмена' },
      'ms-MY': { ok: 'OK', cancel: 'Batal' },
      'th-TH': { ok: 'ตกลง', cancel: 'ยกเลิก' },
      'vi-VN': { ok: 'OK', cancel: 'Hủy' },
      'id-ID': { ok: 'OK', cancel: 'Batal' },
      'tl-PH': { ok: 'OK', cancel: 'Kanselahin' },
      'nl-NL': { ok: 'OK', cancel: 'Annuleren' },
      'sv-SE': { ok: 'OK', cancel: 'Avbryt' },
      'da-DK': { ok: 'OK', cancel: 'Annuller' },
      'no-NO': { ok: 'OK', cancel: 'Avbryt' },
      'fi-FI': { ok: 'OK', cancel: 'Peruuta' },
      'pl-PL': { ok: 'OK', cancel: 'Anuluj' },
      'cs-CZ': { ok: 'OK', cancel: 'Zrušit' },
      'hu-HU': { ok: 'OK', cancel: 'Mégse' },
      'ro-RO': { ok: 'OK', cancel: 'Anulare' },
      'bg-BG': { ok: 'ОК', cancel: 'Отказ' },
      'hr-HR': { ok: 'OK', cancel: 'Otkaži' },
      'sk-SK': { ok: 'OK', cancel: 'Zrušiť' },
      'sl-SI': { ok: 'OK', cancel: 'Prekliči' },
      'et-EE': { ok: 'OK', cancel: 'Tühista' },
      'lv-LV': { ok: 'OK', cancel: 'Atcelt' },
      'lt-LT': { ok: 'OK', cancel: 'Atšaukti' },
      'mt-MT': { ok: 'OK', cancel: 'Ikkanċella' },
      'el-GR': { ok: 'OK', cancel: 'Ακύρωση' },
      'tr-TR': { ok: 'Tamam', cancel: 'İptal' },
      'he-IL': { ok: 'אישור', cancel: 'ביטול' },
      'fa-IR': { ok: 'تأیید', cancel: 'لغو' },
      'ur-PK': { ok: 'ٹھیک ہے', cancel: 'منسوخ' },
      'bn-BD': { ok: 'ঠিক আছে', cancel: 'বাতিল' },
      'ta-IN': { ok: 'சரி', cancel: 'ரத்து' },
      'te-IN': { ok: 'సరే', cancel: 'రద్దు' },
      'ml-IN': { ok: 'ശരി', cancel: 'റദ്ദാക്കുക' },
      'kn-IN': { ok: 'ಸರಿ', cancel: 'ರದ್ದುಮಾಡು' },
      'gu-IN': { ok: 'બરાબર', cancel: 'રદ કરો' },
      'pa-IN': { ok: 'ਠੀਕ ਹੈ', cancel: 'ਰੱਦ ਕਰੋ' }
    }
    
    const langTranslation = translations[language?.code] || translations['en-US']
    return langTranslation[buttonType]
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
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // Simulate speaking animation
    if (!isRecording) {
      setIsSpeaking(true)
      setTimeout(() => setIsSpeaking(false), 3000)
    } else {
      setIsSpeaking(false)
    }
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

  // Consent Dialog Component
  if (showConsent) {
    return (
      <div 
        className={`min-h-screen flex items-center justify-center p-4 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'var(--bg-gradient)' }}
      >
        <div className="w-full max-w-2xl">
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
        <div className="w-full max-w-4xl">
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
                      background: 'var(--orb-gradient)',
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
                    {selectedLanguage?.code === 'es-MX' ? '"Hola, ¿cómo me puede ayudar hoy?"' : 
                     selectedLanguage?.code === 'fr-FR' ? '"Bonjour, comment pouvez-vous m\'aider aujourd\'hui?"' :
                     selectedLanguage?.code === 'de-DE' ? '"Hallo, wie können Sie mir heute helfen?"' :
                     selectedLanguage?.code === 'zh-CN' ? '"你好，今天你能帮我什么吗？"' :
                     '"Hello, how can you help me today?"'}
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
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: `linear-gradient(135deg, var(--bg-deep) 0%, var(--bg-grad-1) 50%, var(--bg-grad-2) 100%)`
        }}
      >
        <div className={`w-full max-w-4xl transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
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
            </div> */}
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

