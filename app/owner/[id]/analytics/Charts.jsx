"use client";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
 LineChart,
 Line,
 XAxis,
 YAxis,
 CartesianGrid,
 BarChart,
 Bar,
 Tooltip
} from "recharts";


export function DailyMealsTrendChart({ data }) {
  const chartConfig = {
    meals: {
      label: "Meals Served",
      color: "#60a5fa",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          tickFormatter={(value) => {
            const d = new Date(value);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
        <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
       <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="meals"
          stroke="#60a5fa"
          strokeWidth={2}
          dot={{ fill: "#60a5fa", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

export function PeakTimeSlotsChart({ data }) {
  const chartConfig = {
    count: {
      label: "Orders",
      color: "#34d399",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="slot"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          tickFormatter={(value) =>
            value.charAt(0).toUpperCase() + value.slice(1)
          }
        />
        <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
       <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="#34d399" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function PlatePerformanceChart({ data }) {
  const chartConfig = {
    count: {
      label: "Plates Sold",
      color: "#f59e0b",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="dish"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          width={120}
        />
        <Tooltip
          content={<ChartTooltipContent />}
          cursor={{ fill: "rgba(245, 158, 11, 0.1)" }}
        />
        <Bar dataKey="count" fill="#f59e0b" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function WastageChart({ data }) {
  const chartConfig = {
    wastage: {
      label: "Wastage %",
      color: "#ef4444",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          tickFormatter={(value) => {
            const d = new Date(value);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
        <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
        <Tooltip
          content={<ChartTooltipContent />}
          cursor={{ stroke: "#4b5563" }}
        />
        <Line
          type="monotone"
          dataKey="wastage"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ fill: "#ef4444", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
