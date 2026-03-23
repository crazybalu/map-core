import React, { useMemo } from 'react';
import { usePoiStore } from '../stores/poiStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getPoiConfig } from '../config/poiConfig';
import { PluginContextProps } from '../types';

export const ChartPlugin: React.FC<PluginContextProps> = ({ config, capabilities }) => {
  const { pois, selectedCategory, setSelectedCategory } = usePoiStore();

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
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4">
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
                    <div className="bg-white dark:bg-slate-800 p-2 rounded shadow-lg border border-slate-200 dark:border-slate-700 text-sm">
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
              onClick={(data) => {
                setSelectedCategory(selectedCategory === data.category ? null : data.category);
              }}
              className="cursor-pointer transition-opacity hover:opacity-80"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.config.color} 
                  opacity={selectedCategory && selectedCategory !== entry.category ? 0.3 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {selectedCategory && (
        <button
          onClick={() => setSelectedCategory(null)}
          className="mt-4 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-center"
        >
          Clear Selection
        </button>
      )}
    </div>
  );
};
