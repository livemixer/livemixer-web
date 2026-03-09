import githubIcon from '../assets/github_white.svg';
import { useI18n } from '../hooks/useI18n';
import type { ProtocolData } from '../types/protocol';
import { ToolbarMenu } from './toolbar-menu';

interface ToolbarProps {
  data: ProtocolData;
  updateData: (data: ProtocolData) => void;
}

export function Toolbar({ data, updateData }: ToolbarProps) {
  const { t } = useI18n();

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = event => {
        try {
          const content = event.target?.result as string;
          const importedData = JSON.parse(content) as ProtocolData;

          // Validate imported data structure
          if (!importedData.version || !importedData.scenes || !importedData.canvas) {
            alert('无效的配置文件格式');
            return;
          }

          updateData(importedData);
          console.log('成功导入配置');
        } catch (error) {
          console.error('导入失败:', error);
          alert('导入失败：文件格式错误');
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
      console.log('成功导出配置');
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败');
    }
  };

  const handleCheckUpdate = () => {
    console.log('检查更新');

    // TODO: Implement update check

  };

  const handleAbout = () => {
    console.log('关于');
    // TODO: Show About dialog

  };

  return (
    <div className="flex items-center gap-4 flex-1">
      <ToolbarMenu
        label={t('toolbar.edit')}
        items={[
          { label: t('toolbar.undo'), onClick: () => console.log('undo') },
          { label: t('toolbar.redo'), onClick: () => console.log('redo') },
          { divider: true },
          { label: t('toolbar.copy'), onClick: () => console.log('copy') },
          { label: t('toolbar.paste'), onClick: () => console.log('paste') },
          { label: t('toolbar.delete'), onClick: () => console.log('delete') },
        ]}
      />

      <ToolbarMenu
        label={t('toolbar.view')}
        items={[
          { label: t('toolbar.fullscreen'), onClick: () => console.log('fullscreen') },
          { divider: true },
          { label: t('toolbar.showGrid'), onClick: () => console.log('show grid') },
          { label: t('toolbar.showGuides'), onClick: () => console.log('show guides') },
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
          { label: t('toolbar.audioMixer'), onClick: () => console.log('audio mixer') },
          { label: t('toolbar.sceneTransition'), onClick: () => console.log('scene transition') },
          { divider: true },
          { label: t('toolbar.pluginManager'), onClick: () => console.log('plugin manager') },
        ]}
      />

      <ToolbarMenu
        label={t('toolbar.help')}
        items={[
          { label: t('toolbar.checkUpdate'), onClick: handleCheckUpdate },
          { divider: true },
          { label: t('toolbar.documentation'), onClick: () => console.log('documentation') },
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
        title="访问 GitHub 仓库"
      >
        <img src={githubIcon} alt="GitHub" className="w-5 h-5" />
      </a>
    </div>
  );
}
