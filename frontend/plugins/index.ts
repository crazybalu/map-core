import { pluginRegistry } from '../core/PluginRegistry';
import { pluginDefinitions } from '../config/pluginConfig';

export const registerPlugins = () => {
  pluginDefinitions.forEach(plugin => {
    pluginRegistry.register(plugin);
  });
};