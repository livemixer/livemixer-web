import { Link as LinkIcon, Lock, Pause, Play, RotateCcw, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { pluginRegistry } from '../services/plugin-registry';
import type { SceneItem } from '../types/protocol';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';

interface PropertyPanelProps {
  selectedItem: SceneItem | null;
  onUpdateItem?: (itemId: string, updates: Partial<SceneItem>) => void;
}

export function PropertyPanel({ selectedItem, onUpdateItem }: PropertyPanelProps) {
  const [localItem, setLocalItem] = useState<SceneItem | null>(selectedItem);
  const [urlInputMethod, setUrlInputMethod] = useState<'file' | 'url'>('url');

  // Keep localItem in sync with any changes to selectedItem
  useEffect(() => {
    setLocalItem(selectedItem);
  }, [selectedItem]);

  if (!selectedItem || !localItem) {
    return (
      <div className="h-full p-4 flex items-center justify-center text-gray-500 text-sm">
        未选中任何元素
      </div>
    );
  }

  const isLocked = localItem.locked === true;

  const updateProperty = (updates: Partial<SceneItem>) => {
    // Disallow edits while locked
    if (isLocked) return;

    const newItem = {
      ...localItem,
      ...updates,
      layout: updates.layout ? { ...localItem.layout, ...updates.layout } : localItem.layout,
      transform: updates.transform
        ? { ...localItem.transform, ...updates.transform }
        : localItem.transform,
    };
    setLocalItem(newItem);
    onUpdateItem?.(selectedItem.id, updates);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateProperty({ url });
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-neutral-900 to-neutral-850">
      <div className="p-4 border-b border-neutral-700/50 bg-neutral-900/80 sticky top-0 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-white">属性</h3>
      </div>

      {/* Locked item notice */}
      {isLocked && (
        <div className="mx-4 mt-4 p-3 bg-error-500/10 border border-error-500/30 rounded-lg flex items-center gap-2 text-sm text-error-400">
          <Lock className="w-4 h-4" />
          <span>该元素已锁定，无法编辑属性</span>
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* Basic info */}
        <div className="space-y-4">
          <div>
            <Label className="block mb-2">元素 ID</Label>
            <div className="text-sm text-neutral-300 bg-neutral-800/50 px-3 py-2 rounded-lg border border-neutral-700/50">
              {localItem.id}
            </div>
          </div>

          <div>
            <Label className="block mb-2">类型</Label>
            <div className="text-sm text-neutral-300 bg-neutral-800/50 px-3 py-2 rounded-lg border border-neutral-700/50 capitalize">
              {localItem.type}
            </div>
          </div>

          <div>
            <Label htmlFor="zIndex" className="block mb-2">
              层级 (Z-Index)
            </Label>
            <Input
              id="zIndex"
              type="number"
              value={localItem.zIndex}
              onChange={e => updateProperty({ zIndex: Number.parseInt(e.target.value) || 0 })}
              disabled={isLocked}
            />
          </div>
        </div>

        {/* Position and size */}
        <div className="border-t border-[#3e3e42] pt-4">
          <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded"></span>
            位置和大小
          </h4>

          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <div>
              <Label htmlFor="x" className="block mb-2">
                X 坐标
              </Label>
              <Input
                id="x"
                type="number"
                value={Math.round(localItem.layout.x)}
                onChange={e =>
                  updateProperty({
                    layout: {
                      ...localItem.layout,
                      x: Number.parseFloat(e.target.value) || 0,
                    },
                  })
                }
                disabled={isLocked}
              />
            </div>
            <div>
              <Label htmlFor="y" className="block mb-2">
                Y 坐标
              </Label>
              <Input
                id="y"
                type="number"
                value={Math.round(localItem.layout.y)}
                onChange={e =>
                  updateProperty({
                    layout: {
                      ...localItem.layout,
                      y: Number.parseFloat(e.target.value) || 0,
                    },
                  })
                }
                disabled={isLocked}
              />
            </div>
            <div>
              <Label htmlFor="width" className="block mb-2">
                宽度
              </Label>
              <Input
                id="width"
                type="number"
                value={Math.round(localItem.layout.width)}
                onChange={e =>
                  updateProperty({
                    layout: {
                      ...localItem.layout,
                      width: Number.parseFloat(e.target.value) || 1,
                    },
                  })
                }
                disabled={isLocked}
              />
            </div>
            <div>
              <Label htmlFor="height" className="block mb-2">
                高度
              </Label>
              <Input
                id="height"
                type="number"
                value={Math.round(localItem.layout.height)}
                onChange={e =>
                  updateProperty({
                    layout: {
                      ...localItem.layout,
                      height: Number.parseFloat(e.target.value) || 1,
                    },
                  })
                }
                disabled={isLocked}
              />
            </div>
          </div>
        </div>

        {/* Transform */}
        <div className="border-t border-[#3e3e42] pt-4">
          <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded"></span>
            变换
          </h4>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label htmlFor="opacity" className="text-xs">
                  透明度
                </Label>
                <span className="text-xs text-gray-300 font-mono bg-[#1e1e1e] px-2 py-1 rounded border border-[#3e3e42]">
                  {((localItem.transform?.opacity ?? 1) * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                id="opacity"
                min={0}
                max={1}
                step={0.01}
                value={[localItem.transform?.opacity ?? 1]}
                onValueChange={value => updateProperty({ transform: { opacity: value[0] } })}
                disabled={isLocked}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <Label htmlFor="rotation" className="text-xs">
                  旋转角度
                </Label>
                <span className="text-xs text-gray-300 font-mono bg-[#1e1e1e] px-2 py-1 rounded border border-[#3e3e42]">
                  {Math.round(localItem.transform?.rotation ?? 0)}°
                </span>
              </div>
              <Slider
                id="rotation"
                min={0}
                max={360}
                step={1}
                value={[localItem.transform?.rotation ?? 0]}
                onValueChange={value => updateProperty({ transform: { rotation: value[0] } })}
                disabled={isLocked}
              />
            </div>

            {(localItem.type === 'window' ||
              localItem.type === 'scene_ref' ||
              localItem.type === 'color') && (
              <div>
                <Label htmlFor="borderRadius" className="block mb-2">
                  圆角半径
                </Label>
                <Input
                  id="borderRadius"
                  type="number"
                  value={localItem.transform?.borderRadius ?? 0}
                  onChange={e =>
                    updateProperty({
                      transform: {
                        borderRadius: Number.parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  placeholder="0"
                  disabled={isLocked}
                />
              </div>
            )}
          </div>
        </div>

        {/* --- Plugin PoC: dynamically render plugin props --- */}
        {(() => {
          const pluginIdMap: Record<string, string> = {
            image: 'io.livemixer.image',
            video_input: 'io.livemixer.webcam',
            text: 'io.livemixer.text',
          };
          const pluginId = pluginIdMap[localItem.type] || localItem.type;
          const plugin = pluginRegistry.getPlugin(pluginId);

          if (plugin && plugin.propsSchema) {
            return (
              <div className="border-t border-[#3e3e42] pt-4">
                <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-purple-500 rounded"></span>
                  插件属性 ({plugin.name})
                </h4>
                <div className="space-y-4">
                  {Object.entries(plugin.propsSchema).map(([key, schema]) => {
                    if (schema.type === 'number') {
                      return (
                        <div key={key}>
                          <div className="flex justify-between items-center mb-3">
                            <Label className="text-xs">{schema.label}</Label>
                            <span className="text-xs text-gray-300 font-mono bg-[#1e1e1e] px-2 py-1 rounded border border-[#3e3e42]">
                              {localItem[key as keyof SceneItem] || schema.defaultValue}
                            </span>
                          </div>
                          <Slider
                            min={schema.min ?? 0}
                            max={schema.max ?? 100}
                            step={schema.step ?? 1}
                            value={[
                              Number(localItem[key as keyof SceneItem] ?? schema.defaultValue),
                            ]}
                            onValueChange={value => updateProperty({ [key]: value[0] })}
                            disabled={isLocked}
                          />
                        </div>
                      );
                    }
                    if (schema.type === 'image' || schema.type === 'string') {
                      return (
                        <div key={key}>
                          <Label className="block mb-2">{schema.label}</Label>
                          <Input
                            type="text"
                            value={localItem[key as keyof SceneItem] || schema.defaultValue}
                            onChange={e => updateProperty({ [key]: e.target.value })}
                            disabled={isLocked}
                          />
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            );
          }
          return null;
        })()}
        {/* ------------------------------------ */}

        {/* Type-specific props */}
        {localItem.type === 'color' && (
          <div className="border-t border-[#3e3e42] pt-4">
            <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded"></span>
              颜色
            </h4>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={localItem.color || '#000000'}
                onChange={e => updateProperty({ color: e.target.value })}
                className="w-14 h-10 p-1 cursor-pointer"
                disabled={isLocked}
              />
              <Input
                type="text"
                value={localItem.color || '#000000'}
                onChange={e => updateProperty({ color: e.target.value })}
                className="flex-1"
                placeholder="#000000"
                disabled={isLocked}
              />
            </div>
          </div>
        )}

        {localItem.type === 'text' && (
          <div className="border-t border-[#3e3e42] pt-4">
            <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded"></span>
              文本
            </h4>

            <div className="space-y-4">
              <div>
                <Label htmlFor="content" className="block mb-2">
                  内容
                </Label>
                <textarea
                  id="content"
                  value={localItem.content || ''}
                  onChange={e => updateProperty({ content: e.target.value })}
                  placeholder="输入文本内容"
                  className="flex min-h-[80px] w-full rounded-md border border-[#3e3e42] bg-[#1e1e1e] px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  rows={3}
                  disabled={isLocked}
                />
              </div>

              <div>
                <Label htmlFor="fontSize" className="block mb-2">
                  字号大小
                </Label>
                <Input
                  id="fontSize"
                  type="number"
                  value={localItem.properties?.fontSize || 16}
                  onChange={e =>
                    updateProperty({
                      properties: {
                        ...localItem.properties,
                        fontSize: Number.parseFloat(e.target.value) || 16,
                      },
                    })
                  }
                  placeholder="16"
                  disabled={isLocked}
                />
              </div>

              <div>
                <Label htmlFor="textColor" className="block mb-2">
                  文字颜色
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={localItem.properties?.color || '#FFFFFF'}
                    onChange={e =>
                      updateProperty({
                        properties: {
                          ...localItem.properties,
                          color: e.target.value,
                        },
                      })
                    }
                    className="w-14 h-10 p-1 cursor-pointer"
                    disabled={isLocked}
                  />
                  <Input
                    type="text"
                    value={localItem.properties?.color || '#FFFFFF'}
                    onChange={e =>
                      updateProperty({
                        properties: {
                          ...localItem.properties,
                          color: e.target.value,
                        },
                      })
                    }
                    className="flex-1"
                    placeholder="#FFFFFF"
                    disabled={isLocked}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {(localItem.type === 'window' || localItem.type === 'screen') && (
          <div className="border-t border-[#3e3e42] pt-4">
            <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded"></span>
              媒体源
            </h4>
            <Label htmlFor="source" className="block mb-2">
              源地址
            </Label>
            <Input
              id="source"
              type="text"
              value={localItem.source || ''}
              onChange={e => updateProperty({ source: e.target.value })}
              placeholder="输入媒体源"
              disabled={isLocked}
            />
          </div>
        )}

        {/* 定时器/时钟控制 */}
        {(localItem.type === 'timer' || localItem.type === 'clock') && (
          <div className="border-t border-[#3e3e42] pt-4">
            <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded"></span>
              {localItem.type === 'timer' ? 'Timer controls' : 'Clock settings'}
            </h4>

            {localItem.type === 'timer' && localItem.timerConfig && (
              <>
                {/* Control buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      const config = localItem.timerConfig!;
                      if (config.running) {
                        // Pause
                        const now = performance.now() / 1000;
                        let pausedAt = 0;

                        if (config.mode === 'countdown' && config.startTime && config.duration) {
                          const elapsed = now - config.startTime;
                          pausedAt = Math.max(0, config.duration - elapsed);
                        } else if (config.mode === 'countup' && config.startTime) {
                          pausedAt = now - config.startTime + (config.startValue || 0);
                        }

                        updateProperty({
                          timerConfig: {
                            ...config,
                            running: false,
                            pausedAt,
                            startTime: undefined,
                          },
                        });
                      } else {
                        // Start or resume
                        const now = performance.now() / 1000;
                        let startTime = now;

                        if (config.mode === 'countdown' && config.pausedAt !== undefined) {
                          // Resume from paused position
                          startTime = now;
                          updateProperty({
                            timerConfig: {
                              ...config,
                              running: true,
                              startTime,
                              duration: config.pausedAt,
                              pausedAt: undefined,
                            },
                          });
                        } else if (config.mode === 'countup' && config.pausedAt !== undefined) {
                          // Count-up resume from pause
                          updateProperty({
                            timerConfig: {
                              ...config,
                              running: true,
                              startTime,
                              startValue: config.pausedAt,
                              pausedAt: undefined,
                            },
                          });
                        } else {
                          updateProperty({
                            timerConfig: {
                              ...config,
                              running: true,
                              startTime,
                              pausedAt: undefined,
                            },
                          });
                        }
                      }
                    }}
                    disabled={isLocked}
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {localItem.timerConfig.running ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>暂停</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>启动</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const config = localItem.timerConfig!;
                      updateProperty({
                        timerConfig: {
                          ...config,
                          running: false,
                          currentTime:
                            config.mode === 'countdown' ? config.duration : config.startValue,
                          startTime: undefined,
                          pausedAt: undefined,
                        },
                      });
                    }}
                    disabled={isLocked}
                    className="px-4 py-2 bg-[#1e1e1e] hover:bg-[#2d2d30] disabled:cursor-not-allowed text-white rounded-lg transition-colors border border-[#3e3e42] flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>重置</span>
                  </button>
                </div>

                {/* Mode display */}
                <div className="mb-4">
                  <Label className="block mb-2">模式</Label>
                  <div className="text-sm text-gray-300 bg-[#1e1e1e] px-3 py-2 rounded border border-[#3e3e42] capitalize">
                    {localItem.timerConfig.mode === 'countdown' ? '倒计时' : '正计时'}
                  </div>
                </div>

                {/* Countdown duration */}
                {localItem.timerConfig.mode === 'countdown' && (
                  <div className="mb-4">
                    <Label htmlFor="duration" className="block mb-2">
                      时长（秒）
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={localItem.timerConfig.duration || 0}
                      onChange={e =>
                        updateProperty({
                          timerConfig: {
                            ...localItem.timerConfig!,
                            duration: Number.parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      disabled={isLocked || localItem.timerConfig.running}
                    />
                  </div>
                )}
              </>
            )}

            {/* Display format */}
            <div className="mb-4">
              <Label htmlFor="format" className="block mb-2">
                显示格式
              </Label>
              <select
                id="format"
                value={localItem.timerConfig?.format || 'HH:MM:SS'}
                onChange={e =>
                  updateProperty({
                    timerConfig: {
                      ...localItem.timerConfig!,
                      format: e.target.value,
                    },
                  })
                }
                disabled={isLocked}
                className="w-full bg-[#1e1e1e] border border-[#3e3e42] text-white px-3 py-2 rounded"
              >
                <option value="HH:MM:SS">HH:MM:SS</option>
                <option value="MM:SS">MM:SS</option>
                {localItem.type === 'clock' && <option value="HH:MM">HH:MM</option>}
              </select>
            </div>

            {/* Font size */}
            <div className="mb-4">
              <Label htmlFor="timer-fontSize" className="block mb-2">
                字体大小
              </Label>
              <Input
                id="timer-fontSize"
                type="number"
                min="12"
                max="200"
                value={localItem.properties?.fontSize || 48}
                onChange={e =>
                  updateProperty({
                    properties: {
                      ...localItem.properties,
                      fontSize: Number.parseInt(e.target.value) || 48,
                    },
                  })
                }
                disabled={isLocked}
              />
            </div>

            {/* Color */}
            <div>
              <Label htmlFor="timer-color" className="block mb-2">
                颜色
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="timer-color"
                  type="color"
                  value={localItem.properties?.color || '#FFFFFF'}
                  onChange={e =>
                    updateProperty({
                      properties: {
                        ...localItem.properties,
                        color: e.target.value,
                      },
                    })
                  }
                  className="w-14 h-10 p-1 cursor-pointer"
                  disabled={isLocked}
                />
                <Input
                  type="text"
                  value={localItem.properties?.color || '#FFFFFF'}
                  onChange={e =>
                    updateProperty({
                      properties: {
                        ...localItem.properties,
                        color: e.target.value,
                      },
                    })
                  }
                  className="flex-1"
                  placeholder="#FFFFFF"
                  disabled={isLocked}
                />
              </div>
            </div>
          </div>
        )}

        {/* Image and media source URL editor */}
        {(localItem.type === 'image' || localItem.type === 'media') && (
          <div className="border-t border-[#3e3e42] pt-4">
            <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded"></span>
              {localItem.type === 'image' ? '图像源' : '媒体源'}
            </h4>

            {/* Input method selection */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setUrlInputMethod('url')}
                disabled={isLocked}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors text-sm flex items-center justify-center gap-2 ${
                  urlInputMethod === 'url'
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-[#1e1e1e] border-[#3e3e42] text-gray-300 hover:bg-[#2d2d30]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>URL</span>
              </button>
              <button
                type="button"
                onClick={() => setUrlInputMethod('file')}
                disabled={isLocked}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors text-sm flex items-center justify-center gap-2 ${
                  urlInputMethod === 'file'
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-[#1e1e1e] border-[#3e3e42] text-gray-300 hover:bg-[#2d2d30]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>本地文件</span>
              </button>
            </div>

            {/* URL input */}
            {urlInputMethod === 'url' && (
              <div>
                <Label htmlFor="url" className="block mb-2">
                  {localItem.type === 'image' ? '图片 URL' : '媒体 URL'}
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={localItem.url || ''}
                  onChange={e => updateProperty({ url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  disabled={isLocked}
                />
              </div>
            )}

            {/* File upload */}
            {urlInputMethod === 'file' && (
              <div>
                <Label htmlFor="file-upload" className="block mb-2">
                  选择文件
                </Label>
                <div className="relative">
                  <Input
                    id="file-upload"
                    type="file"
                    accept={localItem.type === 'image' ? 'image/*' : 'video/*,audio/*'}
                    onChange={handleFileChange}
                    disabled={isLocked}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg transition-colors text-sm text-gray-300 ${
                      isLocked
                        ? 'cursor-not-allowed opacity-50'
                        : 'cursor-pointer hover:bg-[#2d2d30]'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>点击选择{localItem.type === 'image' ? '图片' : '媒体'}文件</span>
                  </label>
                </div>
                {localItem.url && (
                  <p className="text-xs text-gray-500 mt-2">
                    当前: {localItem.url.substring(0, 50)}
                    {localItem.url.length > 50 ? '...' : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
