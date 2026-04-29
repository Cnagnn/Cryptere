"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
  
} from "@/components/ui/chart"
import type {ChartConfig} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type EarningsEntry = {
  label: string
  points: number
  xp: number
}

type ChartAreaInteractiveProps = {
  weekly: EarningsEntry[]
  monthly: EarningsEntry[]
}

const chartConfig = {
  earnings: {
    label: "Earnings",
  },
  points: {
    label: "Points",
    color: "var(--chart-1)",
  },
  xp: {
    label: "XP",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive({ weekly = [], monthly = [] }: ChartAreaInteractiveProps) {
  const [timeRange, setTimeRange] = React.useState("monthly")

  const rawData = timeRange === "weekly" ? weekly : monthly
  const data = Array.isArray(rawData) ? rawData : []

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Earnings History</CardTitle>
          <CardDescription>
            {timeRange === "weekly"
              ? "Points & XP earned in the last 7 days"
              : "Points & XP earned in the last 12 months"}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select time range"
          >
            <SelectValue placeholder="Last 12 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="monthly" className="rounded-lg">
              Last 12 months
            </SelectItem>
            <SelectItem value="weekly" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
            <defs>
              <linearGradient id="fillPoints" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-points)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-points)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillXp" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-xp)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-xp)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="xp"
              type="natural"
              fill="url(#fillXp)"
              stroke="var(--color-xp)"
              stackId="a"
            />
            <Area
              dataKey="points"
              type="natural"
              fill="url(#fillPoints)"
              stroke="var(--color-points)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
