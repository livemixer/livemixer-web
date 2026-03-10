import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/setting';
import { useI18n } from '../hooks/useI18n';
import lmsLogo from '../assets/lms.svg';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState('general');

  // Get i18n functions
  const { t, changeLanguage } = useI18n();

  // Get settings and update helpers from the store
  const {
    // General settings
    language,
    theme,
    // Streaming settings
    streamService,
    livekitUrl,
    livekitToken,
    // Pull settings
    livekitPullUrl,
    livekitPullToken,
    // Output settings
    videoBitrate,
    audioBitrate,
    videoEncoder,
    audioEncoder,
    // Audio settings
    audioDevice,
    sampleRate,
    channels,
    // Video settings
    baseResolution,
    outputResolution,
    fps,
    scaleFilter,
    customWidth,
    customHeight,
    // Update functions
    updatePersistentSettings,
    updateSensitiveSettings,
  } = useSettingsStore();

  // Local state for pending language change (applied on confirm)
  const [pendingLanguage, setPendingLanguage] = useState(language);

  // Sync pending language when dialog opens
  useEffect(() => {
    if (open) {
      setPendingLanguage(language);
    }
  }, [open, language]);

  // Apply language change to i18n engine
  const applyLanguageChange = async (newLanguage: string) => {
    // Update store
    updatePersistentSettings({ language: newLanguage });
    // Sync with i18n engine (convert zh-CN -> zh, en-US -> en)
    const i18nLang = newLanguage.startsWith('zh') ? 'zh' : 'en';
    await changeLanguage(i18nLang);
  };

  // Handle language selection change (only updates local state)
  const handleLanguageSelect = (newLanguage: string) => {
    setPendingLanguage(newLanguage);
  };

  // Handle apply button - apply language change
  const handleApply = async () => {
    if (pendingLanguage !== language) {
      await applyLanguageChange(pendingLanguage);
    }
  };

  // Handle confirm button - apply language change and close
  const handleConfirm = async () => {
    if (pendingLanguage !== language) {
      await applyLanguageChange(pendingLanguage);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px] p-0 flex flex-col bg-gradient-to-b from-neutral-850 to-neutral-900 border-neutral-700/50">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 bg-gradient-to-r from-primary-600 to-primary-500 rounded-t-xl relative">
          <div className="flex items-center gap-3">
            <img src={lmsLogo} alt="Logo" className="w-8 h-8" />
            <DialogTitle className="text-white">{t('settings.title')}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-1 min-h-0">
          {/* Left sidebar */}
          <div className="w-48 border-r border-neutral-700/30 bg-neutral-900/50 flex-shrink-0">
            <div className="flex flex-col p-2">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`px-4 py-2 text-left rounded-lg text-sm transition-all ${activeTab === 'general'
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-700/30'
                  }`}
              >
                {t('settings.tabs.general')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('streaming')}
                className={`px-4 py-2 text-left rounded-lg text-sm transition-all ${activeTab === 'streaming'
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-700/30'
                  }`}
              >
                {t('settings.tabs.streaming')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pulling')}
                className={`px-4 py-2 text-left rounded text-sm transition-colors ${activeTab === 'pulling'
                  ? 'bg-[#2a2a2a] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#252525]'
                  }`}
              >
                {t('settings.tabs.pulling')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('output')}
                className={`px-4 py-2 text-left rounded text-sm transition-colors ${activeTab === 'output'
                  ? 'bg-[#2a2a2a] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#252525]'
                  }`}
              >
                {t('settings.tabs.output')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('audio')}
                className={`px-4 py-2 text-left rounded text-sm transition-colors ${activeTab === 'audio'
                  ? 'bg-[#2a2a2a] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#252525]'
                  }`}
              >
                {t('settings.tabs.audio')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('video')}
                className={`px-4 py-2 text-left rounded text-sm transition-colors ${activeTab === 'video'
                  ? 'bg-[#2a2a2a] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#252525]'
                  }`}
              >
                {t('settings.tabs.video')}
              </button>
            </div>
          </div>

          {/* Right content area */}
          <div className="flex-1 overflow-auto p-6 min-w-0">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white">{t('settings.tabs.general')}</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">{t('settings.language.title')}</Label>
                    <select
                      id="language"
                      value={pendingLanguage}
                      onChange={e => handleLanguageSelect(e.target.value)}
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="zh-CN">简体中文</option>
                      <option value="en-US">English</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme">{t('settings.theme.title')}</Label>
                    <select
                      id="theme"
                      value={theme}
                      onChange={e => updatePersistentSettings({ theme: e.target.value })}
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="dark">{t('settings.theme.dark')}</option>
                      <option value="light">{t('settings.theme.light')}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'streaming' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white">{t('settings.streaming.title')}</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="streamService">{t('settings.streaming.service')}</Label>
                    <select
                      id="streamService"
                      value={streamService}
                      onChange={e =>
                        updatePersistentSettings({
                          streamService: e.target.value,
                        })
                      }
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="custom">{t('settings.streaming.custom')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="livekitUrl">{t('settings.streaming.serverUrl')}</Label>
                    <Input
                      id="livekitUrl"
                      value={livekitUrl}
                      onChange={e =>
                        updatePersistentSettings({
                          livekitUrl: e.target.value,
                        })
                      }
                      placeholder={t('settings.streaming.serverUrlPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="livekitToken">Token</Label>
                    <Input
                      id="livekitToken"
                      type="password"
                      value={livekitToken}
                      onChange={e =>
                        updateSensitiveSettings({
                          livekitToken: e.target.value,
                        })
                      }
                      placeholder={t('settings.streaming.tokenPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pulling' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white">{t('settings.pulling.title')}</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="livekitPullUrl">{t('settings.streaming.serverUrl')}</Label>
                    <Input
                      id="livekitPullUrl"
                      value={livekitPullUrl}
                      onChange={e =>
                        updatePersistentSettings({
                          livekitPullUrl: e.target.value,
                        })
                      }
                      placeholder={t('settings.streaming.serverUrlPlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="livekitPullToken">{t('settings.streaming.token')}</Label>
                    <Input
                      id="livekitPullToken"
                      type="password"
                      value={livekitPullToken}
                      onChange={e =>
                        updateSensitiveSettings({
                          livekitPullToken: e.target.value,
                        })
                      }
                      placeholder={t('settings.streaming.tokenPlaceholder')}
                    />
                  </div>
                  <div className="pt-4 border-t border-[#3e3e42]">
                    <p className="text-sm text-gray-400">
                      {t('settings.pulling.description')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'output' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white">{t('settings.output.title')}</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="videoBitrate">{t('settings.output.videoBitrate')}</Label>
                    <Input
                      id="videoBitrate"
                      type="number"
                      value={videoBitrate}
                      onChange={e =>
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
                    <Label htmlFor="audioBitrate">{t('settings.output.audioBitrate')}</Label>
                    <select
                      id="audioBitrate"
                      value={audioBitrate}
                      onChange={e =>
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
                      <option value="96000">96 kbps (Music High Quality)</option>
                      <option value="128000">128 kbps (Music High Quality Stereo)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videoEncoder">{t('settings.output.videoEncoder')}</Label>
                    <select
                      id="videoEncoder"
                      value={videoEncoder}
                      onChange={e =>
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
                    <Label htmlFor="audioEncoder">{t('settings.output.audioEncoder')}</Label>
                    <select
                      id="audioEncoder"
                      value={audioEncoder}
                      onChange={e =>
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
                <h2 className="text-lg font-semibold text-white">{t('settings.audio.title')}</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="audioDevice">{t('settings.audio.device')}</Label>
                    <select
                      id="audioDevice"
                      value={audioDevice}
                      onChange={e =>
                        updatePersistentSettings({
                          audioDevice: e.target.value,
                        })
                      }
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="default">{t('settings.audio.default')}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sampleRate">{t('settings.audio.sampleRate')}</Label>
                    <select
                      id="sampleRate"
                      value={sampleRate}
                      onChange={e => updatePersistentSettings({ sampleRate: e.target.value })}
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="44100">44.1 kHz</option>
                      <option value="48000">48 kHz</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="channels">{t('settings.audio.channels')}</Label>
                    <select
                      id="channels"
                      value={channels}
                      onChange={e => updatePersistentSettings({ channels: e.target.value })}
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="stereo">{t('settings.audio.stereo')}</option>
                      <option value="mono">{t('settings.audio.mono')}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'video' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white">{t('settings.video.title')}</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="baseResolution">{t('settings.video.baseResolution')}</Label>
                    <select
                      id="baseResolution"
                      value={baseResolution}
                      onChange={e =>
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
                      <option value="custom">{t('settings.video.custom')}</option>
                    </select>
                  </div>

                  {baseResolution === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customWidth">{t('settings.video.width')}</Label>
                        <Input
                          id="customWidth"
                          type="number"
                          value={customWidth || ''}
                          onChange={e =>
                            updatePersistentSettings({
                              customWidth: e.target.value,
                            })
                          }
                          placeholder="1920"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customHeight">{t('settings.video.height')}</Label>
                        <Input
                          id="customHeight"
                          type="number"
                          value={customHeight || ''}
                          onChange={e =>
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
                    <Label htmlFor="outputResolution">{t('settings.video.outputResolution')}</Label>
                    <select
                      id="outputResolution"
                      value={outputResolution}
                      onChange={e =>
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
                      <option value="same">{t('settings.video.sameAsBase')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fps">{t('settings.video.fps')}</Label>
                    <select
                      id="fps"
                      value={fps}
                      onChange={e => updatePersistentSettings({ fps: e.target.value })}
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="24">24</option>
                      <option value="30">30</option>
                      <option value="60">60</option>
                      <option value="120">120</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scaleFilter">{t('settings.video.scaleFilter')}</Label>
                    <select
                      id="scaleFilter"
                      value={scaleFilter}
                      onChange={e =>
                        updatePersistentSettings({
                          scaleFilter: e.target.value,
                        })
                      }
                      className="flex h-8 w-full rounded border border-[#3e3e42] bg-[#1e1e1e] px-3 py-1 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                    >
                      <option value="bilinear">{t('settings.video.bilinear')}</option>
                      <option value="bicubic">{t('settings.video.bicubic')}</option>
                      <option value="lanczos">Lanczos</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-3 px-6 py-5 pr-8 border-t border-[#3e3e42] flex-shrink-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-8 py-3 text-sm rounded bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] transition-colors min-w-[90px]"
          >
            {t('dialog.cancel')}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-8 py-3 text-sm rounded bg-[#2a2a2a] text-white hover:bg-[#3a3a3a] transition-colors min-w-[90px]"
          >
            {t('dialog.apply')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-8 py-3 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors min-w-[90px]"
          >
            {t('dialog.confirm')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
