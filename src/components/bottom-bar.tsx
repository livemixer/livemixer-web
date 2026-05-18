import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Play,
  Plus,
  Settings,
  Square,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { pluginRegistry } from '../services/plugin-registry';
import type { Scene, SceneItem } from '../types/protocol';
import { AddSourceDialog, type SourceType } from './add-source-dialog';
import { AudioMixerPanel } from './audio-mixer-panel';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface BottomBarProps {
  scenes: Scene[];
  activeSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onSettingsClick: () => void;
  onAddScene: () => void;
  onDeleteScene: (sceneId: string) => void;
  onMoveSceneUp: (sceneId: string) => void;
  onMoveSceneDown: (sceneId: string) => void;
  onAddItem: (sourceType: SourceType) => void;
  onDeleteItem: (itemId: string) => void;
  onMoveItemUp: (itemId: string) => void;
  onMoveItemDown: (itemId: string) => void;
  onToggleItemVisibility: (itemId: string) => void;
  onToggleItemLock: (itemId: string) => void;
  onUpdateItem?: (itemId: string, updates: Partial<SceneItem>) => void;
}

export function BottomBar({
  scenes,
  activeSceneId,
  onSceneSelect,
  selectedItemId,
  onSelectItem,
  isStreaming,
  onToggleStreaming,
  onSettingsClick,
  onAddScene,
  onDeleteScene,
  onMoveSceneUp,
  onMoveSceneDown,
  onAddItem,
  onDeleteItem,
  onMoveItemUp,
  onMoveItemDown,
  onToggleItemVisibility,
  onToggleItemLock,
  onUpdateItem,
}: BottomBarProps) {
  const { t } = useI18n();
  const activeScene = scenes.find((s) => s.id === activeSceneId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteItemDialogOpen, setDeleteItemDialogOpen] = useState(false);
  const [addSourceDialogOpen, setAddSourceDialogOpen] = useState(false);
  const sceneToDelete = activeScene;
  const itemToDelete = activeScene?.items.find(
    (item) => item.id === selectedItemId,
  );

  return (
    <TooltipProvider>
      <div className="w-full h-full flex bg-linear-to-r from-(--lm-gradient-from) via-(--lm-gradient-via) to-(--lm-gradient-to)">
        {/* Scene area - 25% */}
        <div className="w-[25%] flex flex-col border-r border-(--lm-border) overflow-hidden">
          <div className="px-4 py-2 border-b border-(--lm-border) text-center bg-(--lm-surface-3) sticky top-0">
            <h3 className="text-sm font-semibold text-(--lm-fg)">
              {t('scene.title')}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              {scenes.map((scene) => (
                <Tooltip key={scene.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onSceneSelect(scene.id)}
                      className={`
                          w-full px-3 py-2 rounded-lg cursor-pointer transition-all text-sm select-none border text-left
                        ${
                          activeSceneId === scene.id
                            ? 'bg-linear-to-r from-primary-600 to-primary-500 text-white border-primary-400 shadow-lg'
                            : 'bg-(--lm-surface-1) text-(--lm-muted) hover:bg-(--lm-hover) border-(--lm-border)'
                        }
                      `}
                    >
                      <div className="font-medium">{scene.name}</div>
                      <div className="text-xs opacity-70">
                        {scene.items.length} {t('scene.items')}
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div className="space-y-1">
                      <div className="font-medium">{scene.name}</div>
                      <div className="text-xs text-(--lm-muted-2)">
                        ID: {scene.id}
                      </div>
                      <div className="text-xs text-(--lm-muted-2)">
                        {scene.items.length} {t('scene.items')}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
          {/* Scene actions - footer */}
          <div className="border-t border-(--lm-border-strong) p-2 flex items-center justify-center gap-2 bg-(--lm-surface-2)">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onAddScene}
                  className="p-2 hover:bg-(--lm-hover) rounded transition-colors"
                >
                  <Plus className="w-4 h-4 text-(--lm-muted)" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('toolbar.addScene')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={!activeSceneId || scenes.length <= 1}
                  className="p-2 hover:bg-(--lm-hover) rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4 text-(--lm-muted)" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('toolbar.deleteScene')}</TooltipContent>
            </Tooltip>
            <div className="w-px h-5 bg-(--lm-border-strong)" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => activeSceneId && onMoveSceneUp(activeSceneId)}
                  disabled={
                    !activeSceneId ||
                    scenes.findIndex((s) => s.id === activeSceneId) === 0
                  }
                  className="p-2 hover:bg-(--lm-hover) rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="w-4 h-4 text-(--lm-muted)" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Move Up</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() =>
                    activeSceneId && onMoveSceneDown(activeSceneId)
                  }
                  disabled={
                    !activeSceneId ||
                    scenes.findIndex((s) => s.id === activeSceneId) ===
                      scenes.length - 1
                  }
                  className="p-2 hover:bg-(--lm-hover) rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-4 h-4 text-(--lm-muted)" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Move Down</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Sources area (within active scene) - 45% */}
        <div className="flex-1 flex flex-col border-r border-(--lm-border) overflow-hidden">
          <div className="px-4 py-2 border-b border-(--lm-border) text-center">
            <h3 className="text-sm font-semibold text-(--lm-muted)">
              {t('source.title')} {activeScene && `- ${activeScene.name}`}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {activeScene ? (
              <div className="space-y-2">
                {activeScene.items.map((item) => (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={`
                          px-3 py-2 rounded transition-colors select-none flex items-center gap-2
                          ${
                            selectedItemId === item.id
                              ? 'bg-blue-500/80 text-white'
                              : 'bg-(--lm-surface-1) text-(--lm-muted) hover:bg-(--lm-hover)'
                          }
                          ${item.visible === false ? 'opacity-50' : ''}
                        `}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectItem(item.id)}
                          className="flex-1 cursor-pointer text-left"
                        >
                          <div className="text-sm font-medium">{item.id}</div>
                          <div className="text-xs opacity-70">{item.type}</div>
                        </button>
                        {/* Visibility and lock buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleItemVisibility(item.id);
                            }}
                            className="p-1 hover:bg-black/20 rounded transition-colors"
                            title={
                              item.visible === false
                                ? t('source.show')
                                : t('source.hide')
                            }
                          >
                            {item.visible === false ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleItemLock(item.id);
                            }}
                            className="p-1 hover:bg-black/20 rounded transition-colors"
                            title={
                              item.locked
                                ? t('source.unlock')
                                : t('source.lock')
                            }
                          >
                            {item.locked ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <LockOpen className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <div className="space-y-1">
                        <div className="font-medium">{item.id}</div>
                        <div className="text-xs text-(--lm-muted-2)">
                          Type: {item.type}
                        </div>
                        <div className="text-xs text-(--lm-muted-2)">
                          Status:{' '}
                          {item.visible === false ? 'Hidden' : 'Visible'} |{' '}
                          {item.locked ? 'Locked' : 'Unlocked'}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ) : (
              <div className="text-sm text-(--lm-muted-2) text-center py-4">
                {t('scene.selectPrompt')}
              </div>
            )}
          </div>
          {/* Source actions - footer */}
          <div className="border-t border-(--lm-border-strong) p-2 flex items-center justify-center gap-2 bg-(--lm-surface-2)">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setAddSourceDialogOpen(true)}
                  disabled={!activeSceneId}
                  className="p-2 hover:bg-(--lm-hover) rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 text-(--lm-muted)" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('toolbar.addSource')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setDeleteItemDialogOpen(true)}
                  disabled={!selectedItemId}
                  className="p-2 hover:bg-(--lm-hover) rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4 text-(--lm-muted)" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('toolbar.deleteSource')}</TooltipContent>
            </Tooltip>
            <div className="w-px h-5 bg-(--lm-border-strong)" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => selectedItemId && onMoveItemUp(selectedItemId)}
                  disabled={
                    !selectedItemId ||
                    !activeScene ||
                    activeScene.items.findIndex(
                      (i) => i.id === selectedItemId,
                    ) === 0
                  }
                  className="p-2 hover:bg-(--lm-hover) rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="w-4 h-4 text-(--lm-muted)" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('toolbar.moveUp')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() =>
                    selectedItemId && onMoveItemDown(selectedItemId)
                  }
                  disabled={
                    !selectedItemId ||
                    !activeScene ||
                    activeScene.items.findIndex(
                      (i) => i.id === selectedItemId,
                    ) ===
                      activeScene.items.length - 1
                  }
                  className="p-2 hover:bg-(--lm-hover) rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-4 h-4 text-(--lm-muted)" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('toolbar.moveDown')}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Audio Mixer - 20% */}
        <div className="w-[20%] flex flex-col border-r border-(--lm-border) overflow-hidden">
          <AudioMixerPanel
            audioItems={
              activeScene?.items.filter((item) => {
                // Check if item's plugin supports audio mixing
                const plugin = pluginRegistry.getPluginBySourceType(item.type);
                return plugin?.audioMixer?.enabled === true;
              }) ?? []
            }
            onUpdateItem={onUpdateItem}
          />
        </div>

        {/* Control area - 20% */}
        <div className="w-[20%] flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-(--lm-border) text-center">
            <h3 className="text-sm font-semibold text-(--lm-muted)">
              {t('control.title')}
            </h3>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={onToggleStreaming}
              className={`
                w-full px-4 py-3 rounded font-medium transition-all flex items-center justify-center gap-2
                ${
                  isStreaming
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }
              `}
            >
              {isStreaming ? (
                <>
                  <Square className="w-5 h-5" fill="currentColor" />
                  <span>{t('toolbar.stopStreaming')}</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" fill="currentColor" />
                  <span>{t('toolbar.startStreaming')}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onSettingsClick}
              className="w-full px-4 py-3 bg-(--lm-surface-1) hover:bg-(--lm-hover) text-(--lm-fg) rounded transition-colors flex items-center justify-center gap-2"
            >
              <Settings className="w-5 h-5" />
              <span>{t('toolbar.settings')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete scene confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('dialog.confirmDeleteScene')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('scene.deleteConfirm', { name: sceneToDelete?.name })}
              <br />
              <span className="text-yellow-500 font-medium">
                {t('scene.deleteWarning')}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel>{t('dialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (activeSceneId) {
                  onDeleteScene(activeSceneId);
                }
              }}
            >
              {t('dialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete source confirmation dialog */}
      <AlertDialog
        open={deleteItemDialogOpen}
        onOpenChange={setDeleteItemDialogOpen}
      >
        <AlertDialogContent className="shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('dialog.confirmDeleteSource')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('source.deleteConfirm', { id: itemToDelete?.id })}
              <br />
              <span className="text-yellow-500 font-medium">
                {t('source.deleteWarning')}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel>{t('dialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedItemId) {
                  onDeleteItem(selectedItemId);
                }
              }}
            >
              {t('dialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add-source selection dialog */}
      <AddSourceDialog
        open={addSourceDialogOpen}
        onOpenChange={setAddSourceDialogOpen}
        onSelectSourceType={onAddItem}
      />
    </TooltipProvider>
  );
}
