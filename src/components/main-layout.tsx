import type { ReactNode } from 'react'

interface MainLayoutProps {
  logo?: ReactNode
  toolbar?: ReactNode
  canvas?: ReactNode
  leftSidebar?: ReactNode
  rightSidebar?: ReactNode
  bottomBar?: ReactNode
  statusBar?: ReactNode
}

export function MainLayout({
  logo,
  toolbar,
  canvas,
  leftSidebar,
  rightSidebar,
  bottomBar,
  statusBar,
}: MainLayoutProps) {
  return (
    <div className="flex flex-col w-full h-full bg-[#1e1e1e] text-white overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="h-12 flex-shrink-0 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center px-4 gap-4">
        {/* Logo 区域 */}
        {logo && <div className="flex-shrink-0">{logo}</div>}
        <div className="flex-1">{toolbar}</div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 左侧预留区域 */}
        {leftSidebar && (
          <div className="w-80 flex-shrink-0 bg-[#252526] border-r border-[#3e3e42] flex flex-col overflow-hidden">
            {leftSidebar}
          </div>
        )}

        {/* 中间画布区域 */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* 画布区域 */}
          <div className="flex-1 bg-[#1e1e1e] flex items-center justify-center overflow-hidden min-h-0">
            {canvas}
          </div>
        </div>

        {/* 右侧边栏 */}
        {rightSidebar && (
          <div className="w-80 flex-shrink-0 bg-[#252526] border-l border-[#3e3e42] flex flex-col overflow-hidden">
            {rightSidebar}
          </div>
        )}
      </div>

      {/* 底部区域 */}
      {bottomBar && (
        <div className="h-56 flex-shrink-0 bg-[#2d2d30] border-t border-[#3e3e42] flex overflow-hidden">
          {bottomBar}
        </div>
      )}

      {/* 状态栏 */}
      {statusBar && statusBar}
    </div>
  )
}
