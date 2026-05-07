import React, { useMemo } from 'react';
import { usePoiStore } from '../stores/poiStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getPoiConfig } from '../config/resources';
import { PluginContextProps } from '../types';

export const ChartPlugin: React.FC<PluginContextProps> = ({ config, capabilities }) => {
  const { pois } = usePoiStore();

  const data = useMemo(() => {
    const counts = pois.reduce((acc, poi) => {
      acc[poi.category] = (acc[poi.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([category, count]) => ({
        category,
        count,
        config: getPoiConfig(category)
      }))
      .sort((a, b) => b.count - a.count);
  }, [pois]);

  const total = pois.length;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
        No data available in current view
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-800 dark:text-slate-100 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Distribution</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Total POIs: {total}</p>
      </div>
      
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="category" 
              type="category" 
              width={100}
              tickFormatter={(val) => getPoiConfig(val).label}
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-2 rounded shadow-lg border border-white/20 dark:border-slate-700/50 text-sm text-slate-800 dark:text-slate-100">
                      <span className="font-semibold">{data.config.label}:</span> {data.count}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="count" 
              radius={[0, 4, 4, 0]}

              className="cursor-pointer transition-opacity hover:opacity-80"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.config.color} 
                  opacity={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>


    </div>
  );
};
