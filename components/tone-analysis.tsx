'use client'

import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { HelpCircle, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from './ui/button'
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'
import { Switch } from './ui/switch'
import { Label } from './ui/label'

interface ToneAnalysisProps {
  fleschKincaidScore: number
  sentenceLengths: number[]
}

const getFleschKincaidData = (score: number) => {
  return [{ name: 'Flesch-Kincaid', value: score }]
}

const getSentenceLengthData = (lengths: number[]) => {
  const bins = [0, 10, 20, 30, 40, 50]
  const data = bins.map((bin) => ({
    name: `${bin}-${bin + 9}`,
    count: lengths.filter((len) => len >= bin && len < bin + 10).length,
  }))
  return data
}

export function ToneAnalysis({
  fleschKincaidScore,
  sentenceLengths,
}: ToneAnalysisProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [showMetrics, setShowMetrics] = useState(true)

  const flechKincaidData = getFleschKincaidData(fleschKincaidScore)
  const sentenceLengthData = getSentenceLengthData(sentenceLengths)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
            <CardTitle>Readability Metrics</CardTitle>
            <TooltipProvider>
                <ShadTooltip>
                    <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Flesch-Kincaid score and sentence length distribution.</p>
                    </TooltipContent>
                </ShadTooltip>
            </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
            <Label htmlFor="show-metrics">Show</Label>
            <Switch id="show-metrics" checked={showMetrics} onCheckedChange={setShowMetrics} />
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <ChevronUp /> : <ChevronDown />}
            </Button>
        </div>
      </CardHeader>
      {isOpen && showMetrics && (
        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="mb-4 text-center text-lg font-medium">Flesch-Kincaid Grade Level</h3>
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart
                  innerRadius="80%"
                  outerRadius="100%"
                  data={flechKincaidData}
                  startAngle={180}
                  endAngle={0}
                  barSize={20}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                  />
                  <RadialBar
                    background
                    dataKey="value"
                    angleAxisId={0}
                    fill="#8884d8"
                  />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-3xl font-bold"
                  >
                    {fleschKincaidScore.toFixed(1)}
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="mb-4 text-center text-lg font-medium">Sentence Lengths</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sentenceLengthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
