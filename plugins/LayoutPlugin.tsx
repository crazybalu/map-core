import React from 'react';
import { PluginContextProps } from '../types';
import { pluginRegistry } from '../core/PluginRegistry';

const LayoutPlugin: React.FC<PluginContextProps> = ({ config, capabilities }) => {
  const children = config.children || [];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {children.map((childConfig) => {
        const def = pluginRegistry.get(childConfig.type);
        
        if (!def) return null;
        const Component = def.component;

        const layout = childConfig.layout || { x: 0, y: 0, w: 200, h: 200 };

        return (
          <div 
            key={childConfig.id}
            className="absolute pointer-events-auto transition-all duration-300 ease-in-out bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 overflow-hidden"
            style={{
              left: layout.x,
              top: layout.y,
              width: layout.w,
              height: layout.h,
            }}
          >
             <Component config={childConfig} capabilities={capabilities} />
          </div>
        );
      })}
    </div>
  );
};

export default LayoutPlugin;
