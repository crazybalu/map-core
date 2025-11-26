import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PluginContextProps } from '../types';
import { useStore } from '../store'; 
import { getPoiConfig } from '../config/poiConfig';

const ChartPlugin: React.FC<PluginContextProps> = ({ config, capabilities }) => {
  // Use 'pois' (all data in view) instead of 'visiblePois' so the chart 
  // maintains context of other categories when a filter is applied.
  const { pois, selectedCategory, theme } = useStore();

  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    pois.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [pois]);

  const handleBarClick = (entry: any) => {
    if (!entry || !entry.name) return;

    const category = entry.name;
    if (selectedCategory === category) {
      capabilities.setFilter(null);
    } else {
      capabilities.setFilter(category);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col h-full w-full p-4 bg-white dark:bg-transparent text-slate-800 dark:text-slate-200">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{config.title}</h3>
        <div className="flex gap-2">
          {selectedCategory && (
            <button 
              onClick={() => capabilities.setFilter(null)}
              className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              Clear Filter
            </button>
          )}
          <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
            {pois.length} Items
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis 
                dataKey="name" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                stroke={isDark ? '#94a3b8' : '#64748b'} 
              />
              <YAxis 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                stroke={isDark ? '#94a3b8' : '#64748b'}
              />
              <Tooltip 
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none', 
                  backgroundColor: isDark ? '#1e293b' : '#fff',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  color: isDark ? '#f1f5f9' : '#1e293b'
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]} 
                className="cursor-pointer"
              >
                {data.map((entry, index) => {
                  const color = getPoiConfig(entry.name).color;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={color} 
                      fillOpacity={selectedCategory && entry.name !== selectedCategory ? 0.3 : 1}
                      onClick={() => handleBarClick(entry)}
                      style={{ cursor: 'pointer', pointerEvents: 'all' }}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            No data in view
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartPlugin;