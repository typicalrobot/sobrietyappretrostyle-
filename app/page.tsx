"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Smile, Frown, Meh, Heart, Trophy, Download, Upload, Check } from "lucide-react"

type Habit = "cigarettes" | "weed" | "alcohol" | "vapes"
type Mood = "great" | "good" | "okay" | "bad" | "terrible"

interface CheckIn {
  date: string
  mood: Mood
  habits: Habit[]
}

const HABITS: { key: Habit; label: string; color: string }[] = [
  { key: "cigarettes", label: "Cigarettes", color: "bg-chart-1" },
  { key: "vapes", label: "Vapes", color: "bg-chart-4" },
  { key: "weed", label: "Weed", color: "bg-chart-2" },
  { key: "alcohol", label: "Alcohol", color: "bg-chart-3" },
]

const MOODS: { key: Mood; label: string; icon: any; color: string }[] = [
  { key: "great", label: "Great", icon: Heart, color: "text-chart-1" },
  { key: "good", label: "Good", icon: Smile, color: "text-chart-2" },
  { key: "okay", label: "Okay", icon: Meh, color: "text-muted-foreground" },
  { key: "bad", label: "Bad", icon: Frown, color: "text-chart-4" },
  { key: "terrible", label: "Terrible", icon: Frown, color: "text-destructive" },
]

export default function SobrietyTracker() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null)
  const [selectedHabits, setSelectedHabits] = useState<Habit[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [trackingCategories, setTrackingCategories] = useState<Habit[]>([])
  const [streaks, setStreaks] = useState<Record<Habit, number>>({
    cigarettes: 0,
    vapes: 0,
    weed: 0,
    alcohol: 0,
  })

  useEffect(() => {
    const savedCheckIns = localStorage.getItem("sobriety-checkins")
    const savedCategories = localStorage.getItem("tracking-categories")

    if (savedCheckIns) {
      const parsed = JSON.parse(savedCheckIns)
      setCheckIns(parsed)
      calculateStreaks(parsed)
    }

    if (savedCategories) {
      setTrackingCategories(JSON.parse(savedCategories))
    }
  }, [])

  const calculateStreaks = (checkInData: CheckIn[]) => {
    const today = new Date().toDateString()
    const newStreaks: Record<Habit, number> = { cigarettes: 0, vapes: 0, weed: 0, alcohol: 0 }

    const sortedCheckIns = [...checkInData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    HABITS.forEach(({ key }) => {
      let streak = 0
      const currentDate = new Date()

      for (let i = 0; i < sortedCheckIns.length; i++) {
        const checkIn = sortedCheckIns[i]
        const checkInDate = new Date(checkIn.date)

        if (checkInDate.toDateString() === currentDate.toDateString()) {
          if (!checkIn.habits.includes(key)) {
            streak++
            currentDate.setDate(currentDate.getDate() - 1)
          } else {
            break
          }
        } else {
          break
        }
      }

      newStreaks[key] = streak
    })

    setStreaks(newStreaks)
  }

  const toggleTrackingCategory = (habit: Habit) => {
    const newCategories = trackingCategories.includes(habit)
      ? trackingCategories.filter((h) => h !== habit)
      : [...trackingCategories, habit]

    setTrackingCategories(newCategories)
    localStorage.setItem("tracking-categories", JSON.stringify(newCategories))
  }

  const handleCheckIn = () => {
    if (!selectedMood) return

    const today = new Date().toDateString()
    const newCheckIn: CheckIn = {
      date: today,
      mood: selectedMood,
      habits: selectedHabits,
    }

    const updatedCheckIns = checkIns.filter((c) => c.date !== today)
    updatedCheckIns.push(newCheckIn)

    setCheckIns(updatedCheckIns)
    localStorage.setItem("sobriety-checkins", JSON.stringify(updatedCheckIns))

    calculateStreaks(updatedCheckIns)

    const anyStreakMultipleOfFive = Object.values(streaks).some((streak) => streak > 0 && (streak + 1) % 5 === 0)

    if (anyStreakMultipleOfFive) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }

    setSelectedMood(null)
    setSelectedHabits([])
  }

  const toggleHabit = (habit: Habit) => {
    setSelectedHabits((prev) => (prev.includes(habit) ? prev.filter((h) => h !== habit) : [...prev, habit]))
  }

  const getTodaysCheckIn = () => {
    const today = new Date().toDateString()
    return checkIns.find((c) => c.date === today)
  }

  const todaysCheckIn = getTodaysCheckIn()

  const exportData = () => {
    const dataToExport = {
      checkIns,
      exportDate: new Date().toISOString(),
      version: "1.0",
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sobriety-tracker-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const importedData = JSON.parse(content)

        if (importedData.checkIns && Array.isArray(importedData.checkIns)) {
          setCheckIns(importedData.checkIns)
          localStorage.setItem("sobriety-checkins", JSON.stringify(importedData.checkIns))
          calculateStreaks(importedData.checkIns)

          event.target.value = ""
        } else {
          alert("Invalid file format. Please select a valid sobriety tracker export file.")
        }
      } catch (error) {
        alert("Error reading file. Please make sure it's a valid JSON file.")
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-background p-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-8 h-8 bg-primary rounded-full retro-float opacity-20" />
      <div
        className="absolute top-32 right-16 w-6 h-6 bg-secondary rotate-45 retro-float opacity-30"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute bottom-20 left-20 w-10 h-10 bg-accent rounded-full retro-float opacity-25"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-40 right-8 w-4 h-8 bg-muted retro-float opacity-20"
        style={{ animationDelay: "0.5s" }}
      />

      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-8xl animate-bounce retro-shadow">🎉</div>
          <div className="absolute animate-pulse">
            <Trophy className="w-20 h-20 text-primary retro-shadow" />
          </div>
          <div className="absolute top-1/4 left-1/4 text-4xl animate-spin">⭐</div>
          <div className="absolute top-1/4 right-1/4 text-4xl animate-bounce">✨</div>
          <div className="absolute bottom-1/4 left-1/3 text-4xl animate-pulse">🌟</div>
        </div>
      )}

      <div className="max-w-sm mx-auto lg:max-w-4xl space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <div className="flex-1 text-center">
              <h1 className="text-4xl lg:text-6xl font-black text-foreground retro-shadow tracking-wider">
                SOBRIETY TRACKER
              </h1>
            </div>
            <div className="flex-1 flex justify-end" />
          </div>
        </div>

        <Card className="border-4 border-border retro-shadow bg-card">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-card-foreground uppercase tracking-wider">
              Choose Categories to Track
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {HABITS.map(({ key, label, color }) => (
                <Button
                  key={key}
                  variant={trackingCategories.includes(key) ? "default" : "outline"}
                  size="lg"
                  onClick={() => toggleTrackingCategory(key)}
                  className={`flex items-center gap-2 font-bold border-2 retro-shadow hover:scale-105 transition-transform ${
                    trackingCategories.includes(key)
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground border-border"
                  }`}
                >
                  {trackingCategories.includes(key) && <Check className="w-4 h-4" />}
                  <div className={`w-4 h-4 rounded-full ${color} border-2 border-current`} />
                  {label.toUpperCase()}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {trackingCategories.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {HABITS.filter(({ key }) => trackingCategories.includes(key)).map(({ key, label, color }, index) => (
              <Card
                key={key}
                className="border-4 border-border retro-shadow hover:scale-105 transition-transform bg-card"
              >
                <CardContent className="p-8">
                  <div className="flex items-center justify-between lg:flex-col lg:items-center lg:text-center lg:space-y-4">
                    <div className="flex items-center gap-4 lg:flex-col lg:gap-3">
                      <div
                        className={`w-8 h-8 lg:w-12 lg:h-12 rounded-full ${color} border-4 border-border retro-shadow`}
                      />
                      <span className="font-black text-xl lg:text-2xl text-card-foreground tracking-wide">
                        {label.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-right lg:text-center">
                      <div className="text-5xl lg:text-6xl font-black text-primary retro-shadow">{streaks[key]}</div>
                      <div className="text-lg font-bold text-card-foreground uppercase tracking-wider">
                        {streaks[key] === 1 ? "day" : "days"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-4 border-border retro-shadow bg-card">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-card-foreground uppercase tracking-wider">
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  onClick={exportData}
                  variant="outline"
                  size="lg"
                  className="flex-1 bg-primary text-primary-foreground border-4 border-border retro-shadow hover:scale-105 transition-transform font-bold"
                >
                  <Download className="w-5 h-5 mr-2" />
                  EXPORT
                </Button>
                <div className="flex-1">
                  <input type="file" accept=".json" onChange={importData} className="hidden" id="import-file" />
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full bg-secondary text-secondary-foreground border-4 border-border retro-shadow hover:scale-105 transition-transform font-bold"
                  >
                    <label htmlFor="import-file" className="cursor-pointer flex items-center justify-center">
                      <Upload className="w-5 h-5 mr-2" />
                      IMPORT
                    </label>
                  </Button>
                </div>
              </div>
              <p className="text-sm font-bold text-card-foreground/80 uppercase tracking-wide">
                Backup your progress or sync between devices
              </p>
            </CardContent>
          </Card>

          {trackingCategories.length > 0 && (
            <Card className="border-4 border-border retro-shadow bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-black text-card-foreground uppercase tracking-wider">
                  <Calendar className="w-6 h-6" />
                  Daily Check-in
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {todaysCheckIn ? (
                  <div className="text-center space-y-4">
                    <Badge
                      variant="secondary"
                      className="bg-primary text-primary-foreground text-lg font-black px-6 py-2 retro-shadow uppercase tracking-wider"
                    >
                      ✓ Checked in today
                    </Badge>
                    <p className="text-lg font-bold text-card-foreground uppercase tracking-wide">
                      Mood: {MOODS.find((m) => m.key === todaysCheckIn.mood)?.label}
                    </p>
                    {todaysCheckIn.habits.length > 0 && (
                      <p className="text-lg font-bold text-card-foreground uppercase tracking-wide">
                        Used: {todaysCheckIn.habits.join(", ")}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <label className="text-lg font-black text-card-foreground uppercase tracking-wider">
                        How are you feeling today?
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {MOODS.map(({ key, label, icon: Icon, color }) => (
                          <Button
                            key={key}
                            variant={selectedMood === key ? "default" : "outline"}
                            size="lg"
                            onClick={() => setSelectedMood(key)}
                            className={`flex items-center gap-2 font-bold border-2 retro-shadow hover:scale-105 transition-transform ${
                              selectedMood === key
                                ? "bg-primary text-primary-foreground"
                                : "bg-card text-card-foreground border-border"
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${selectedMood === key ? "" : color}`} />
                            {label.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-border h-1" />

                    <div className="space-y-4">
                      <label className="text-lg font-black text-card-foreground uppercase tracking-wider">
                        Did you use any of these today?
                      </label>
                      <div className="space-y-3">
                        {HABITS.filter(({ key }) => trackingCategories.includes(key)).map(({ key, label }) => (
                          <Button
                            key={key}
                            variant={selectedHabits.includes(key) ? "destructive" : "outline"}
                            size="lg"
                            onClick={() => toggleHabit(key)}
                            className={`w-full justify-start font-bold border-2 retro-shadow hover:scale-105 transition-transform ${
                              selectedHabits.includes(key)
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-card text-card-foreground border-border"
                            }`}
                          >
                            {label.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleCheckIn}
                      disabled={!selectedMood}
                      className="w-full bg-accent text-accent-foreground border-4 border-border retro-shadow hover:scale-105 transition-transform font-black text-lg uppercase tracking-wider"
                      size="lg"
                    >
                      Complete Check-in
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {trackingCategories.length > 0 && checkIns.length > 0 && (
          <Card className="border-4 border-border retro-shadow bg-card">
            <CardHeader>
              <CardTitle className="text-2xl font-black text-card-foreground uppercase tracking-wider">
                Recent Check-ins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checkIns
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map((checkIn, index) => {
                    const mood = MOODS.find((m) => m.key === checkIn.mood)
                    const MoodIcon = mood?.icon || Meh
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between py-3 px-4 bg-muted rounded-lg border-2 border-border retro-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <MoodIcon className={`w-6 h-6 ${mood?.color || "text-muted-foreground"}`} />
                          <span className="text-lg font-bold text-muted-foreground uppercase tracking-wide">
                            {new Date(checkIn.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {checkIn.habits.length === 0 ? (
                            <Badge
                              variant="secondary"
                              className="bg-primary text-primary-foreground font-black px-4 py-1 retro-shadow uppercase tracking-wider"
                            >
                              Clean
                            </Badge>
                          ) : (
                            checkIn.habits.map((habit) => (
                              <Badge
                                key={habit}
                                variant="destructive"
                                className="font-black px-3 py-1 retro-shadow uppercase tracking-wider"
                              >
                                {habit}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
