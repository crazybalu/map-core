import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PluginContextProps } from '../types';
import { useStore } from '../store'; 

// Note: While we inject capabilities, for reactive state like 'visiblePois' 
// usually the Store is still the most efficient "Event Bus" in React.
// However, we use the 'capabilities.setFilter' for actions to decouple logic.

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const ChartPlugin: React.FC<PluginContextProps> = ({ config, capabilities }) => {
  // Subscribing to data changes from the "Bus"
  const { visiblePois, selectedCategory } = useStore();

  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    visiblePois.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [visiblePois]);

  const handleBarClick = (data: any) => {
    const category = data.name;
    if (selectedCategory === category) {
      capabilities.setFilter(null);
    } else {
      capabilities.setFilter(category);
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-4 bg-white">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-slate-700">{config.title}</h3>
        <div className="flex gap-2">
          {selectedCategory && (
            <button 
              onClick={() => capabilities.setFilter(null)}
              className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full hover:bg-blue-200 transition-colors"
            >
              Clear Filter
            </button>
          )}
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            {visiblePois.length} Items
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]} 
                onClick={handleBarClick}
                className="cursor-pointer"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.name === selectedCategory ? '#2563eb' : COLORS[index % COLORS.length]} 
                    fillOpacity={selectedCategory && entry.name !== selectedCategory ? 0.3 : 1}
                  />
                ))}
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
