import { Link as LinkIcon, Upload } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import type { SourceType } from './add-source-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ConfigureSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceType: SourceType | null;
  onConfirm: (config: SourceConfig) => void;
}

export interface SourceConfig {
  url?: string;
  file?: File;
  content?: string;
}

export function ConfigureSourceDialog({
  open,
  onOpenChange,
  sourceType,
  onConfirm,
}: ConfigureSourceDialogProps) {
  const { t } = useI18n();
  const [inputMethod, setInputMethod] = useState<'file' | 'url'>('file');
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState<File | null>(null);

  const getTitle = () => {
    switch (sourceType) {
      case 'image':
        return t('configureSource.imageTitle');
      case 'media':
        return t('configureSource.mediaTitle');
      default:
        return t('configureSource.defaultTitle');
    }
  };

  const getDescription = () => {
    switch (sourceType) {
      case 'image':
        return t('configureSource.imageDescription');
      case 'media':
        return t('configureSource.mediaDescription');
      default:
        return t('configureSource.defaultDescription');
    }
  };

  const getAcceptTypes = () => {
    switch (sourceType) {
      case 'image':
        return 'image/*';
      case 'media':
        return 'video/*,audio/*';
      default:
        return '*/*';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileData(file);
      setFileName(file.name);
    }
  };

  const handleConfirm = () => {
    const config: SourceConfig = {};

    if (inputMethod === 'url' && url.trim()) {
      config.url = url.trim();
    } else if (inputMethod === 'file' && fileData) {
      // Create local URL for preview
      config.url = URL.createObjectURL(fileData);
      config.file = fileData;
    }

    if (config.url || config.file) {
      onConfirm(config);
      handleClose();
    }
  };

  const handleClose = () => {
    setUrl('');
    setFileName('');
    setFileData(null);
    setInputMethod('file');
    onOpenChange(false);
  };

  const isValid = () => {
    if (inputMethod === 'url') {
      return url.trim().length > 0;
    }
    return fileData !== null;
  };

  // Return null if this source type needs no configuration
  if (!sourceType || !['image', 'media'].includes(sourceType)) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#252526] border-[#3e3e42] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">{getTitle()}</DialogTitle>
          <DialogDescription className="text-gray-400">{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* 输入方式选择 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInputMethod('file')}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors flex items-center justify-center gap-2 ${inputMethod === 'file'
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-[#1e1e1e] border-[#3e3e42] text-gray-300 hover:bg-[#2d2d30]'
                }`}
            >
              <Upload className="w-4 h-4" />
              <span>{t('property.localFile')}</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMethod('url')}
              className={`flex-1 px-4 py-2 rounded-lg border transition-colors flex items-center justify-center gap-2 ${inputMethod === 'url'
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-[#1e1e1e] border-[#3e3e42] text-gray-300 hover:bg-[#2d2d30]'
                }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>{t('configureSource.urlAddress')}</span>
            </button>
          </div>

          {/* 文件上传 */}
          {inputMethod === 'file' && (
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="text-gray-300">
                {t('property.selectFile')}
              </Label>
              <div className="relative">
                <Input
                  id="file-upload"
                  type="file"
                  accept={getAcceptTypes()}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg cursor-pointer hover:bg-[#2d2d30] transition-colors"
                >
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{fileName || t('configureSource.clickToSelectFile')}</span>
                </label>
              </div>
              {fileName && <p className="text-xs text-gray-500">{t('configureSource.selected')}: {fileName}</p>}
            </div>
          )}

          {/* URL 输入 */}
          {inputMethod === 'url' && (
            <div className="space-y-2">
              <Label htmlFor="url-input" className="text-gray-300">
                {t('configureSource.urlAddress')}
              </Label>
              <Input
                id="url-input"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="bg-[#1e1e1e] border-[#3e3e42] text-white placeholder:text-gray-500"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-[#1e1e1e] hover:bg-[#2d2d30] text-white rounded-lg transition-colors border border-[#3e3e42]"
          >
            {t('dialog.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('dialog.confirm')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
