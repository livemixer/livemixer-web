import githubIcon from '../assets/github_white.svg';
import { ToolbarMenu } from './toolbar-menu';

interface ToolbarProps {
  data: ProtocolData;
  updateData: (data: ProtocolData) => void;
}

export function Toolbar({ data, updateData }: ToolbarProps) {
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

          // 验证导入的数据结构
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
      a.download = `livemixer-config-${new Date().getTime()}.json`;
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
    // TODO: 实现检查更新功能
  };

  const handleAbout = () => {
    console.log('关于');
    // TODO: 显示关于对话框
  };

  return (
    <div className="flex items-center gap-4 flex-1">
      <ToolbarMenu
        label="编辑"
        items={[
          { label: '撤销', onClick: () => console.log('撤销') },
          { label: '重做', onClick: () => console.log('重做') },
          { divider: true },
          { label: '复制', onClick: () => console.log('复制') },
          { label: '粘贴', onClick: () => console.log('粘贴') },
          { label: '删除', onClick: () => console.log('删除') },
        ]}
      />

      <ToolbarMenu
        label="视图"
        items={[
          { label: '全屏', onClick: () => console.log('全屏') },
          { divider: true },
          { label: '显示网格', onClick: () => console.log('显示网格') },
          { label: '显示参考线', onClick: () => console.log('显示参考线') },
        ]}
      />

      <ToolbarMenu
        label="配置"
        items={[
          { label: '导入', onClick: handleImport },
          { label: '导出', onClick: handleExport },
        ]}
      />

      <ToolbarMenu
        label="工具"
        items={[
          { label: '音频混合器', onClick: () => console.log('音频混合器') },
          { label: '场景过渡', onClick: () => console.log('场景过渡') },
          { divider: true },
          { label: '插件管理', onClick: () => console.log('插件管理') },
        ]}
      />

      <ToolbarMenu
        label="帮助"
        items={[
          { label: '检查更新', onClick: handleCheckUpdate },
          { divider: true },
          { label: '使用文档', onClick: () => console.log('使用文档') },
          { label: '关于', onClick: handleAbout },
        ]}
      />

      {/* GitHub 链接 */}
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
