import type { ReactNode } from 'react';

interface MainLayoutProps {
  logo?: ReactNode;
  toolbar?: ReactNode;
  userSection?: ReactNode;
  canvas?: ReactNode;
  leftSidebar?: ReactNode;
  rightSidebar?: ReactNode;
  bottomBar?: ReactNode;
  statusBar?: ReactNode;
}

export function MainLayout({
  logo,
  toolbar,
  userSection,
  canvas,
  leftSidebar,
  rightSidebar,
  bottomBar,
  statusBar,
}: MainLayoutProps) {
  return (
    <div className="flex flex-col w-full h-full bg-linear-to-b from-neutral-900 via-neutral-850 to-neutral-950 text-white overflow-hidden">
      {/* Top toolbar */}
      <div className="px-4 h-14 shrink-0 bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-700/50 flex items-center gap-4 shadow-sm">
        {/* Logo area */}
        {logo && <div className="shrink-0">{logo}</div>}
        <div className="flex-1">{toolbar}</div>
        {/* User info area */}
        {userSection && <div className="shrink-0">{userSection}</div>}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left reserved area */}
        {leftSidebar && (
          <div className="w-80 shrink-0 bg-neutral-900/50 border-r border-neutral-700/30 flex flex-col overflow-hidden backdrop-blur-sm">
            {leftSidebar}
          </div>
        )}

        {/* Center canvas area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Canvas region */}
          <div className="flex-1 bg-linear-to-br from-neutral-900 via-neutral-850 to-neutral-900 flex items-center justify-center overflow-hidden min-h-0 relative">
            {/* 背景装饰 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-1/2 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl transform translate-x-1/3 translate-y-1/3"></div>
            </div>
            <div className="relative z-10">{canvas}</div>
          </div>
        </div>

        {/* Right sidebar */}
        {rightSidebar && (
          <div className="w-80 shrink-0 bg-neutral-900/50 border-l border-neutral-700/30 flex flex-col overflow-hidden backdrop-blur-sm">
            {rightSidebar}
          </div>
        )}
      </div>

      {/* Bottom area */}
      {bottomBar && (
        <div className="h-56 shrink-0 bg-neutral-900/80 border-t border-neutral-700/50 flex overflow-hidden backdrop-blur-sm shadow-lg">
          {bottomBar}
        </div>
      )}

      {/* Status bar */}
      {statusBar && statusBar}
    </div>
  );
}
