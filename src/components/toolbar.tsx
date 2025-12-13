import { ToolbarMenu } from './toolbar-menu'

export function Toolbar() {
    const handleImport = () => {
        console.log('导入配置')
        // TODO: 实现导入功能
    }

    const handleExport = () => {
        console.log('导出配置')
        // TODO: 实现导出功能
    }

    const handleCheckUpdate = () => {
        console.log('检查更新')
        // TODO: 实现检查更新功能
    }

    const handleAbout = () => {
        console.log('关于')
        // TODO: 显示关于对话框
    }

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
                    { divider: true },
                    { label: '偏好设置', onClick: () => console.log('偏好设置') },
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
        </div>
    )
}
