'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface LineChartComponentProps {
  data: Array<Record<string, any>>;
  xDataKey: string;
  lines: Array<{
    dataKey: string;
    color: string;
    name?: string;
  }>;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function LineChartComponent({
  data,
  xDataKey,
  lines,
  height = 300,
  showGrid = true,
  showTooltip = true,
  className,
}: LineChartComponentProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              strokeOpacity={0.5}
            />
          )}
          <XAxis 
            dataKey={xDataKey}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          {showTooltip && (
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-sm">
                      <div className="mb-2 text-sm text-muted-foreground">{label}</div>
                      <div className="space-y-1">
                        {payload.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div 
                              className="h-2 w-2 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm font-medium">
                              {item.name || item.dataKey}: {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          )}
          {lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 4, fill: line.color }}
              activeDot={{ r: 6, fill: line.color }}
              animationDuration={1000}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}