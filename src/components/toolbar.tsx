import { useCallback, useState } from 'react';
import githubIcon from '../assets/github_white.svg';
import { useI18n } from '../hooks/useI18n';
import { useSettingsStore } from '../store/setting';
import type { ProtocolData } from '../types/protocol';
import { AboutDialog } from './about-dialog';
import { ToolbarMenu } from './toolbar-menu';

interface EditActions {
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canCopy: boolean;
  canPaste: boolean;
  canDelete: boolean;
}

interface ViewActions {
  onToggleFullscreen: () => void;
  onToggleGrid: () => void;
  onToggleGuides: () => void;
  showGrid: boolean;
  showGuides: boolean;
}

interface ToolbarProps {
  data: ProtocolData;
  updateData: (data: ProtocolData) => void;
  editActions?: EditActions;
  viewActions?: ViewActions;
}

export function Toolbar({ data, updateData, editActions, viewActions }: ToolbarProps) {
  const { t } = useI18n();
  const [aboutOpen, setAboutOpen] = useState(false);
  const { showGrid, showGuides, updatePersistentSettings } = useSettingsStore();

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  }, []);

  const handleToggleGrid = useCallback(() => {
    updatePersistentSettings({ showGrid: !showGrid });
  }, [showGrid, updatePersistentSettings]);

  const handleToggleGuides = useCallback(() => {
    updatePersistentSettings({ showGuides: !showGuides });
  }, [showGuides, updatePersistentSettings]);

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const importedData = JSON.parse(content) as ProtocolData;

          // Validate imported data structure
          if (
            !importedData.version ||
            !importedData.scenes ||
            !importedData.canvas
          ) {
            alert(t('toolbar.importInvalidFormat'));
            return;
          }

          updateData(importedData);
          console.log('Config imported successfully');
        } catch (error) {
          console.error('Import failed:', error);
          alert(t('toolbar.importFailed'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExport = () => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `livemixer-config-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      console.log('Config exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      alert(t('toolbar.exportFailed'));
    }
  };

  const handleCheckUpdate = () => {
    console.log('Check for updates');

    // TODO: Implement update check
  };

  const handleAbout = () => {
    setAboutOpen(true);
  };

  return (
    <div className="flex items-center gap-4 flex-1">
      <ToolbarMenu
        label={t('toolbar.edit')}
        items={[
          {
            label: t('toolbar.undo'),
            onClick: editActions?.onUndo,
            disabled: !editActions?.canUndo,
            shortcut: 'Ctrl+Z',
          },
          {
            label: t('toolbar.redo'),
            onClick: editActions?.onRedo,
            disabled: !editActions?.canRedo,
            shortcut: 'Ctrl+Y',
          },
          { divider: true },
          {
            label: t('toolbar.copy'),
            onClick: editActions?.onCopy,
            disabled: !editActions?.canCopy,
            shortcut: 'Ctrl+C',
          },
          {
            label: t('toolbar.paste'),
            onClick: editActions?.onPaste,
            disabled: !editActions?.canPaste,
            shortcut: 'Ctrl+V',
          },
          {
            label: t('toolbar.delete'),
            onClick: editActions?.onDelete,
            disabled: !editActions?.canDelete,
            shortcut: 'Del',
          },
        ]}
      />

      <ToolbarMenu
        label={t('toolbar.view')}
        items={[
          {
            label: t('toolbar.fullscreen'),
            onClick: viewActions?.onToggleFullscreen || handleToggleFullscreen,
            shortcut: 'F11',
          },
          { divider: true },
          {
            label: t('toolbar.showGrid'),
            onClick: viewActions?.onToggleGrid || handleToggleGrid,
            checked: viewActions?.showGrid ?? showGrid,
            shortcut: 'Ctrl+G',
          },
          {
            label: t('toolbar.showGuides'),
            onClick: viewActions?.onToggleGuides || handleToggleGuides,
            checked: viewActions?.showGuides ?? showGuides,
            shortcut: 'Ctrl+Shift+G',
          },
        ]}
      />

      <ToolbarMenu
        label={t('toolbar.config')}
        items={[
          { label: t('toolbar.import'), onClick: handleImport },
          { label: t('toolbar.export'), onClick: handleExport },
        ]}
      />

      <ToolbarMenu
        label={t('toolbar.tools')}
        items={[
          {
            label: t('toolbar.audioMixer'),
            onClick: () => console.log('audio mixer'),
          },
          {
            label: t('toolbar.sceneTransition'),
            onClick: () => console.log('scene transition'),
          },
          { divider: true },
          {
            label: t('toolbar.pluginManager'),
            onClick: () => console.log('plugin manager'),
          },
        ]}
      />

      <ToolbarMenu
        label={t('toolbar.help')}
        items={[
          { label: t('toolbar.checkUpdate'), onClick: handleCheckUpdate },
          { divider: true },
          {
            label: t('toolbar.documentation'),
            onClick: () => console.log('documentation'),
          },
          { label: t('toolbar.about'), onClick: handleAbout },
        ]}
      />

      {/* GitHub link */}
      <div className="flex-1" />
      <a
        href="https://github.com/livemixer/livemixer-web"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-[#3e3e42] transition-colors rounded"
        title={t('toolbar.visitGitHub')}
      >
        <img src={githubIcon} alt="GitHub" className="w-5 h-5" />
      </a>

      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  );
}
