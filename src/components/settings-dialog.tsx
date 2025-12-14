import { useState } from 'react'
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

  // 视频设置状态
  const [baseResolution, setBaseResolution] = useState('1920x1080')
  const [outputResolution, setOutputResolution] = useState('1920x1080')
  const [fps, setFps] = useState('30')

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
                    <Label htmlFor="streamServer">推流服务器</Label>
                    <Input
                      id="streamServer"
                      placeholder="rtmp://live.example.com/live"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="streamKey">推流密钥</Label>
                    <Input
                      id="streamKey"
                      type="password"
                      placeholder="输入推流密钥"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bitrate">比特率 (kbps)</Label>
                    <Input id="bitrate" type="number" placeholder="2500" />
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
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="default">默认</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sampleRate">采样率</Label>
                    <select
                      id="sampleRate"
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
                      onChange={(e) => setBaseResolution(e.target.value)}
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
                          placeholder="1920"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customHeight">高度</Label>
                        <Input
                          id="customHeight"
                          type="number"
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
                      onChange={(e) => setOutputResolution(e.target.value)}
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
                      onChange={(e) => setFps(e.target.value)}
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
              // TODO: 应用设置但不关闭弹窗
              console.log('应用设置')
            }}
            className="px-8 py-3 text-sm rounded bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] transition-colors min-w-[90px]"
          >
            应用
          </button>
          <button
            type="button"
            onClick={() => {
              // TODO: 保存设置
              console.log('保存设置')
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
