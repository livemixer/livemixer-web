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
    <div className="flex flex-col w-full h-full bg-[#1e1e1e] text-white overflow-hidden">
      {/* Top toolbar */}
      <div className="h-12 flex-shrink-0 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center px-4 gap-4">
        {/* Logo area */}
        {logo && <div className="flex-shrink-0">{logo}</div>}
        <div className="flex-1">{toolbar}</div>
        {/* User info area */}
        {userSection && <div className="flex-shrink-0">{userSection}</div>}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left reserved area */}
        {leftSidebar && (
          <div className="w-80 flex-shrink-0 bg-[#252526] border-r border-[#3e3e42] flex flex-col overflow-hidden">
            {leftSidebar}
          </div>
        )}

        {/* Center canvas area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Canvas region */}
          <div className="flex-1 bg-[#1e1e1e] flex items-center justify-center overflow-hidden min-h-0">
            {canvas}
          </div>
        </div>

        {/* Right sidebar */}
        {rightSidebar && (
          <div className="w-80 flex-shrink-0 bg-[#252526] border-l border-[#3e3e42] flex flex-col overflow-hidden">
            {rightSidebar}
          </div>
        )}
      </div>

      {/* Bottom area */}
      {bottomBar && (
        <div className="h-56 flex-shrink-0 bg-[#2d2d30] border-t border-[#3e3e42] flex overflow-hidden">
          {bottomBar}
        </div>
      )}

      {/* Status bar */}
      {statusBar && statusBar}
    </div>
  );
}
