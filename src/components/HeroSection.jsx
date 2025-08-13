import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Languages, ChevronDown, ArrowLeftRight } from 'lucide-react'

const HeroSection = () => {
  const [emailMode, setEmailMode] = useState(false)
  const [email, setEmail] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleTryDemo = () => {
    console.log('Guest demo started')
    // Handle guest demo logic
  }

  const handleTryVoice = () => {
    setEmailMode(true)
  }

  const handleEmailVerification = () => {
    console.log('Email verification:', email)
    // Handle email verification logic
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated fade-in container */}
      <div className={`container mx-auto px-4 text-center transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        
        {/* Glass card container */}
        <div className="backdrop-blur-lg bg-white/10 rounded-3xl border border-white/20 p-8 md:p-12 max-w-4xl mx-auto shadow-2xl">
          
          {/* Main heading with gradient */}
          <div className="mb-6">
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent mb-2">
              iKunnect
            </h1>
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Intelligence
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto">
              Real-time translation supporting 152+ languages with AI-powered intelligence
            </p>
          </div>

          {/* Translation orb with pulse animation */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                  <Languages className="w-10 h-10 text-white" />
                </div>
              </div>
              {/* Glowing effect */}
              <div className="absolute inset-0 w-24 h-24 bg-blue-500/30 rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Languages indicator */}
          <div className="mb-8 flex items-center justify-center gap-2 text-white">
            <Languages className="w-5 h-5" />
            <span className="text-lg font-medium">152+ Languages</span>
          </div>

          {/* Language showcase */}
          <div className="mb-8 flex items-center justify-center gap-6 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-6 bg-red-500 rounded-sm flex items-center justify-center">
                <span className="text-xs font-bold text-white">🇺🇸</span>
              </div>
              <span className="text-sm">"Hello, how are you?"</span>
            </div>
            
            <ArrowLeftRight className="w-6 h-6 text-blue-300" />
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-6 bg-yellow-500 rounded-sm flex items-center justify-center">
                <span className="text-xs font-bold text-white">🇪🇸</span>
              </div>
              <span className="text-sm">"Hola, ¿cómo estás?"</span>
            </div>
          </div>

          {/* Buttons or email capture */}
          {!emailMode ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button 
                onClick={handleTryDemo}
                className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-3 text-lg font-semibold rounded-full shadow-lg transition-all duration-300 hover:scale-105"
              >
                Try Demo
              </Button>
              <Button 
                onClick={handleTryVoice}
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3 text-lg font-semibold rounded-full bg-transparent transition-all duration-300 hover:scale-105"
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
                className="bg-white/20 border-white/30 text-white placeholder:text-blue-200 rounded-full px-6 py-3"
              />
              <Button 
                onClick={handleEmailVerification}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105"
              >
                Verify
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce">
        <ChevronDown className="w-6 h-6" />
      </div>
    </div>
  )
}

export default HeroSection

