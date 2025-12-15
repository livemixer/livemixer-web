import { useState } from 'react'
import { useSettingsStore } from '@/store/setting'
import lmsLogo from '/lms.svg'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState('general')

  // 从 store 获取设置和更新方法
  const {
    // 常规设置
    language,
    theme,
    // 直播设置
    streamService,
    livekitUrl,
    livekitToken,
    // 输出设置
    videoBitrate,
    audioBitrate,
    videoEncoder,
    audioEncoder,
    // 音频设置
    audioDevice,
    sampleRate,
    channels,
    // 视频设置
    baseResolution,
    outputResolution,
    fps,
    scaleFilter,
    customWidth,
    customHeight,
    // 更新方法
    updatePersistentSettings,
    updateSensitiveSettings,
  } = useSettingsStore()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] p-0 flex flex-col bg-[#1e1e1e]">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 bg-white rounded-t-lg relative">
          <div className="flex items-center gap-3">
            <img src={lmsLogo} alt="Logo" className="w-8 h-8" />
            <DialogTitle className="text-gray-900">设置</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* 左侧边栏 */}
          <div className="w-48 border-r border-[#3e3e42] bg-[#1a1a1a] flex-shrink-0">
            <div className="flex flex-col p-2">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 text-left rounded text-sm transition-colors ${
                  activeTab === 'general'
                    ? 'bg-[#2a2a2a] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#252525]'
                }`}
              >
                常规
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('streaming')}
                className={`px-4 py-2 text-left rounded text-sm transition-colors ${
                  activeTab === 'streaming'
                    ? 'bg-[#2a2a2a] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#252525]'
                }`}
              >
                直播
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('output')}
                className={`px-4 py-2 text-left rounded text-sm transition-colors ${
                  activeTab === 'output'
                    ? 'bg-[#2a2a2a] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#252525]'
                }`}
              >
                输出
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('audio')}
                className={`px-4 py-2 text-left rounded text-sm transition-colors ${
                  activeTab === 'audio'
                    ? 'bg-[#2a2a2a] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#252525]'
                }`}
              >
                音频
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('video')}
                className={`px-4 py-2 text-left rounded text-sm transition-colors ${
                  activeTab === 'video'
                    ? 'bg-[#2a2a2a] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#252525]'
                }`}
              >
                视频
              </button>
            </div>
          </div>

          {/* 右侧内容区 */}
          <div className="flex-1 overflow-auto p-6 min-w-0">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white">常规设置</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">语言</Label>
                    <select
                      id="language"
                      value={language}
                      onChange={(e) =>
                        updatePersistentSettings({ language: e.target.value })
                      }
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="zh-CN">简体中文</option>
                      <option value="en-US">English</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme">主题</Label>
                    <select
                      id="theme"
                      value={theme}
                      onChange={(e) =>
                        updatePersistentSettings({ theme: e.target.value })
                      }
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="dark">深色</option>
                      <option value="light">浅色</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'streaming' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white">直播设置</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="streamService">推流服务</Label>
                    <select
                      id="streamService"
                      value={streamService}
                      onChange={(e) =>
                        updatePersistentSettings({
                          streamService: e.target.value,
                        })
                      }
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="custom">自定义</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="livekitUrl">服务器地址</Label>
                    <Input
                      id="livekitUrl"
                      value={livekitUrl}
                      onChange={(e) =>
                        updatePersistentSettings({
                          livekitUrl: e.target.value,
                        })
                      }
                      placeholder="wss://your-livekit-server.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="livekitToken">Token</Label>
                    <Input
                      id="livekitToken"
                      type="password"
                      value={livekitToken}
                      onChange={(e) =>
                        updateSensitiveSettings({
                          livekitToken: e.target.value,
                        })
                      }
                      placeholder="输入 Token"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'output' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white">输出设置</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="videoBitrate">视频码率 (kbps)</Label>
                    <Input
                      id="videoBitrate"
                      type="number"
                      value={videoBitrate}
                      onChange={(e) =>
                        updatePersistentSettings({
                          videoBitrate: e.target.value,
                        })
                      }
                      placeholder="2500"
                      min="500"
                      max="20000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="audioBitrate">音频码率 (bps)</Label>
                    <select
                      id="audioBitrate"
                      value={audioBitrate}
                      onChange={(e) =>
                        updatePersistentSettings({
                          audioBitrate: e.target.value,
                        })
                      }
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="12000">12 kbps (Telephone)</option>
                      <option value="24000">24 kbps (Speech)</option>
                      <option value="48000">48 kbps (Music)</option>
                      <option value="64000">64 kbps (Music Stereo)</option>
                      <option value="96000">
                        96 kbps (Music High Quality)
                      </option>
                      <option value="128000">
                        128 kbps (Music High Quality Stereo)
                      </option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videoEncoder">视频编码器</Label>
                    <select
                      id="videoEncoder"
                      value={videoEncoder}
                      onChange={(e) =>
                        updatePersistentSettings({
                          videoEncoder: e.target.value,
                        })
                      }
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="h264">H.264/AVC</option>
                      <option value="h265">H.265/HEVC</option>
                      <option value="vp8">VP8</option>
                      <option value="vp9">VP9</option>
                      <option value="av1">AV1</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="audioEncoder">音频编码器</Label>
                    <select
                      id="audioEncoder"
                      value={audioEncoder}
                      onChange={(e) =>
                        updatePersistentSettings({
                          audioEncoder: e.target.value,
                        })
                      }
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="aac">AAC</option>
                      <option value="opus">Opus</option>
                      <option value="mp3">MP3</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white">音频设置</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="audioDevice">音频设备</Label>
                    <select
                      id="audioDevice"
                      value={audioDevice}
                      onChange={(e) =>
                        updatePersistentSettings({
                          audioDevice: e.target.value,
                        })
                      }
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="default">默认</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sampleRate">采样率</Label>
                    <select
                      id="sampleRate"
                      value={sampleRate}
                      onChange={(e) =>
                        updatePersistentSettings({ sampleRate: e.target.value })
                      }
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="44100">44.1 kHz</option>
                      <option value="48000">48 kHz</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="channels">声道</Label>
                    <select
                      id="channels"
                      value={channels}
                      onChange={(e) =>
                        updatePersistentSettings({ channels: e.target.value })
                      }
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="stereo">立体声</option>
                      <option value="mono">单声道</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'video' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white">视频设置</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="baseResolution">基础画布分辨率</Label>
                    <select
                      id="baseResolution"
                      value={baseResolution}
                      onChange={(e) =>
                        updatePersistentSettings({
                          baseResolution: e.target.value,
                        })
                      }
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="1920x1080">1920x1080</option>
                      <option value="1280x720">1280x720</option>
                      <option value="2560x1440">2560x1440</option>
                      <option value="3840x2160">3840x2160</option>
                      <option value="custom">自定义</option>
                    </select>
                  </div>

                  {baseResolution === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customWidth">宽度</Label>
                        <Input
                          id="customWidth"
                          type="number"
                          value={customWidth || ''}
                          onChange={(e) =>
                            updatePersistentSettings({
                              customWidth: e.target.value,
                            })
                          }
                          placeholder="1920"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customHeight">高度</Label>
                        <Input
                          id="customHeight"
                          type="number"
                          value={customHeight || ''}
                          onChange={(e) =>
                            updatePersistentSettings({
                              customHeight: e.target.value,
                            })
                          }
                          placeholder="1080"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="outputResolution">输出分辨率</Label>
                    <select
                      id="outputResolution"
                      value={outputResolution}
                      onChange={(e) =>
                        updatePersistentSettings({
                          outputResolution: e.target.value,
                        })
                      }
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="1920x1080">1920x1080</option>
                      <option value="1280x720">1280x720</option>
                      <option value="2560x1440">2560x1440</option>
                      <option value="3840x2160">3840x2160</option>
                      <option value="same">与基础画布相同</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fps">帧率 (FPS)</Label>
                    <select
                      id="fps"
                      value={fps}
                      onChange={(e) =>
                        updatePersistentSettings({ fps: e.target.value })
                      }
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="24">24</option>
                      <option value="30">30</option>
                      <option value="60">60</option>
                      <option value="120">120</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scaleFilter">缩放滤镜</Label>
                    <select
                      id="scaleFilter"
                      value={scaleFilter}
                      onChange={(e) =>
                        updatePersistentSettings({
                          scaleFilter: e.target.value,
                        })
                      }
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="bilinear">双线性</option>
                      <option value="bicubic">双三次</option>
                      <option value="lanczos">Lanczos</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-6 py-5 pr-8 border-t border-[#3e3e42] flex-shrink-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-8 py-3 text-sm rounded bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] transition-colors min-w-[90px]"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              // 应用设置但不关闭弹窗（设置已自动保存到 store）
              console.log('设置已应用')
            }}
            className="px-8 py-3 text-sm rounded bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] transition-colors min-w-[90px]"
          >
            应用
          </button>
          <button
            type="button"
            onClick={() => {
              // 保存设置并关闭弹窗（设置已自动保存到 store）
              console.log('设置已保存')
              onOpenChange(false)
            }}
            className="px-8 py-3 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors min-w-[90px]"
          >
            确定
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
