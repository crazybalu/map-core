import { BiPlugin } from '../types';

class PluginRegistry {
  private plugins: Map<string, BiPlugin> = new Map();

  register(plugin: BiPlugin) {
    this.plugins.set(plugin.type, plugin);
    console.log(`[Kernel] Plugin registered: ${plugin.name} (${plugin.type})`);
  }

  get(type: string): BiPlugin | undefined {
    return this.plugins.get(type);
  }

  getAll(): BiPlugin[] {
    return Array.from(this.plugins.values());
  }
}

export const pluginRegistry = new PluginRegistry();
