"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, TrendingUp, Activity, AlertTriangle, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CarouselSlide {
  id: string
  title: string
  subtitle: string
  value: string | number
  trend: "up" | "down" | "stable"
  trendValue: string
  icon: React.ElementType
  color: string
  bgGradient: string
}

interface DashboardCarouselProps {
  autoRotate?: boolean
  rotateInterval?: number
}

export function DashboardCarousel({ 
  autoRotate = true, 
  rotateInterval = 5000 
}: DashboardCarouselProps) {
  const slides: CarouselSlide[] = [
    {
      id: "equipment",
      title: "Equipment Status",
      subtitle: "Overall Performance",
      value: "94.2%",
      trend: "up",
      trendValue: "+2.1%",
      icon: Activity,
      color: "text-green-600",
      bgGradient: "from-green-50 to-green-100"
    },
    {
      id: "operations",
      title: "Operational Efficiency", 
      subtitle: "Production Rate",
      value: "87.5%",
      trend: "up",
      trendValue: "+5.3%",
      icon: BarChart3,
      color: "text-primary-600",
      bgGradient: "from-primary-50 to-primary-100"
    },
    {
      id: "maintenance",
      title: "Maintenance Status",
      subtitle: "Preventive vs Corrective",
      value: "76.8%",
      trend: "stable",
      trendValue: "0.0%",
      icon: AlertTriangle,
      color: "text-orange-600", 
      bgGradient: "from-orange-50 to-orange-100"
    }
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoRotate)

  // Auto-rotation logic
  useEffect(() => {
    if (!isPlaying) return

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          return 0
        }
        return prev + (100 / (rotateInterval / 50)) // Update every 50ms
      })
    }, 50)

    const slideInterval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length)
      setProgress(0)
    }, rotateInterval)

    return () => {
      clearInterval(progressInterval)
      clearInterval(slideInterval)
    }
  }, [isPlaying, rotateInterval, slides.length])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
    setProgress(0)
  }, [])

  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % slides.length)
    setProgress(0)
  }, [slides.length])

  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length)
    setProgress(0)
  }, [slides.length])

  const toggleAutoplay = () => {
    setIsPlaying(!isPlaying)
    setProgress(0)
  }

  const currentSlide = slides[currentIndex]
  const Icon = currentSlide.icon

  return (
    <div className="relative">
      {/* Main Carousel */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-background to-muted/30 border-2 border-primary/10 shadow-lg">
        <CardContent className="p-0">
          <div className="relative h-full">
            {/* Background with gradient */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br transition-all duration-700 ease-in-out",
              currentSlide.bgGradient
            )} />
            
            {/* Content */}
            <div className="relative h-full flex items-center justify-center p-8">
              <div className="text-center space-y-4 max-w-md">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className={cn(
                    "h-16 w-16 rounded-full flex items-center justify-center transition-all duration-700",
                    "bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg"
                  )}>
                    <Icon className={cn("h-8 w-8", currentSlide.color)} />
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">
                    {currentSlide.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {currentSlide.subtitle}
                  </p>
                </div>

                {/* Value */}
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-foreground">
                    {currentSlide.value}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className={cn(
                      "h-4 w-4",
                      currentSlide.trend === "up" ? "text-green-600" :
                      currentSlide.trend === "down" ? "text-red-600" :
                      "text-gray-600"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      currentSlide.trend === "up" ? "text-green-600" :
                      currentSlide.trend === "down" ? "text-red-600" :
                      "text-gray-600"
                    )}>
                      {currentSlide.trendValue} from last month
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost" 
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200"
              onClick={nextSlide}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            {/* Progress Bar */}
            {isPlaying && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div 
                  className="h-full bg-yellow-500 transition-all duration-[50ms] ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Dots - Simplified */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {slides.map((_, index) => (
          <button
            key={index}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === currentIndex 
                ? "w-8 bg-yellow-500 shadow-md" 
                : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            onClick={() => goToSlide(index)}
          />
        ))}
        
        {/* Auto-play toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="ml-4 h-8 px-3 text-xs hover:bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 hover:text-yellow-500"
          onClick={toggleAutoplay}
        >
          {isPlaying ? "⏸️ Pause" : "▶️ Play"}
        </Button>
      </div>
    </div>
  )
}
