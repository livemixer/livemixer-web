import { ChevronDown, ChevronRight, Puzzle } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { pluginRegistry } from '../services/plugin-registry';
import type { ISourcePlugin } from '../types/plugin';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

function CategoryBadge({ category }: { category: ISourcePlugin['category'] }) {
  const { t } = useI18n();
  const colorMap: Record<string, string> = {
    media: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    text: 'bg-green-500/20 text-green-300 border-green-500/30',
    widget: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    effect: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 text-[10px] rounded border ${
        colorMap[category] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      }`}
    >
      {t(`pluginManager.${category}`)}
    </span>
  );
}

function TrustBadge({ level }: { level?: string }) {
  const { t } = useI18n();
  if (!level) return null;

  const colorMap: Record<string, string> = {
    official: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    verified: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    community: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 text-[10px] rounded border ${
        colorMap[level] || colorMap.community
      }`}
    >
      {t(`pluginManager.${level}`)}
    </span>
  );
}

function PluginRow({ plugin }: { plugin: ISourcePlugin }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const sourceTypeId = plugin.sourceType?.typeId || '-';
  const permissionList = plugin.permissions?.join(', ') || '-';

  return (
    <div className="border-b border-[#3e3e42] last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#3e3e42]/40 transition-colors text-left"
      >
        <span className="text-neutral-500 shrink-0">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </span>
        <span className="w-5 h-5 flex items-center justify-center text-neutral-400 shrink-0">
          {plugin.icon || <Puzzle className="w-4 h-4" />}
        </span>
        <span className="text-sm text-neutral-200 flex-1 truncate">
          {plugin.name}
        </span>
        <span className="text-xs text-neutral-500 shrink-0">
          v{plugin.version}
        </span>
        <CategoryBadge category={plugin.category} />
      </button>

      {expanded && (
        <div className="px-3 pb-3 pl-12 space-y-2">
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-neutral-500">ID: </span>
              <span className="text-neutral-300 font-mono">{plugin.id}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-neutral-500">
                {t('pluginManager.sourceType')}:
              </span>
              <span className="text-neutral-300 font-mono ml-1">
                {sourceTypeId}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">
                {t('pluginManager.trustLevel')}:
              </span>
              <span className="ml-1">
                <TrustBadge level={plugin.trustLevel} />
              </span>
            </div>
          </div>
          <div className="text-xs">
            <span className="text-neutral-500">
              {t('pluginManager.permissions')}:
            </span>
            <span className="text-neutral-300 font-mono ml-1">
              {permissionList}
            </span>
          </div>
          {plugin.propsSchema && (
            <div className="text-xs">
              <span className="text-neutral-500">Props: </span>
              <span className="text-neutral-300 font-mono">
                {Object.keys(plugin.propsSchema).join(', ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PluginManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PluginManagerDialog({
  open,
  onOpenChange,
}: PluginManagerDialogProps) {
  const { t } = useI18n();
  const plugins = pluginRegistry.getAllPlugins();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-[#2d2d30] border-[#3e3e42]">
        <DialogHeader>
          <DialogTitle className="text-white">
            {t('pluginManager.title')}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-neutral-400 -mt-2">
          {t('pluginManager.description')}
        </p>

        <div className="border border-[#3e3e42] rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
          {plugins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Puzzle className="w-8 h-8 text-neutral-600 mb-2" />
              <span className="text-sm text-neutral-500">
                {t('pluginManager.noPlugins')}
              </span>
            </div>
          ) : (
            plugins.map((plugin) => (
              <PluginRow key={plugin.id} plugin={plugin} />
            ))
          )}
        </div>

        {/* Summary */}
        {plugins.length > 0 && (
          <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
            <span>
              {plugins.length} plugin{plugins.length !== 1 ? 's' : ''} installed
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
