import { Button } from "@/components/ui/button";
import { Satellite, Wind, AlertTriangle, TrendingDown } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full text-accent text-sm font-medium backdrop-blur-sm">
            <Satellite className="w-4 h-4" />
            NASA Space Apps Challenge 2024
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Breathe Easy with
            <span className="block mt-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              TEMPO Air Intelligence
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Harness the power of NASA's TEMPO satellite to predict air quality, protect vulnerable communities, and breathe cleaner air tomorrow.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
            <div className="group p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-accent/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Satellite className="w-6 h-6 text-accent group-hover:animate-pulse" />
                <span className="text-4xl font-bold text-white">24/7</span>
              </div>
              <p className="text-sm text-white/70 font-medium">Real-Time Monitoring</p>
            </div>
            
            <div className="group p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingDown className="w-6 h-6 text-accent group-hover:animate-pulse" />
                <span className="text-4xl font-bold text-white">85%+</span>
              </div>
              <p className="text-sm text-white/70 font-medium">Forecast Accuracy</p>
            </div>
            
            <div className="group p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-accent/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="w-6 h-6 text-accent group-hover:animate-pulse" />
                <span className="text-4xl font-bold text-white">&lt;5min</span>
              </div>
              <p className="text-sm text-white/70 font-medium">Alert Response</p>
            </div>
            
            <div className="group p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Wind className="w-6 h-6 text-accent group-hover:animate-pulse" />
                <span className="text-4xl font-bold text-white">AI</span>
              </div>
              <p className="text-sm text-white/70 font-medium">Powered Predictions</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-white glow-accent text-lg px-8 py-6 hover:scale-105 transition-transform duration-300"
              onClick={() => document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Live Dashboard
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6 hover:scale-105 transition-transform duration-300"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full p-1">
          <div className="w-1.5 h-3 bg-white/50 rounded-full mx-auto animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;