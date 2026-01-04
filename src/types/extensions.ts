import type { ProtocolData } from './protocol'

/**
 * user info interface
 */
export interface UserInfo {
    avatar?: string
    name?: string
    role?: 'anonymous' | 'free' | 'pro' | 'admin'
    email?: string
}

/**
 * LiveMixer extensions interface
 */
export interface LiveMixerExtensions {
    /**
     * Optional custom logo
     * Will be rendered in the top toolbar on the left side
     * @example
     * ```tsx
     * logo: <img src="/logo.svg" alt="Logo" className="w-10 h-10" />
     * ```
     */
    logo?: React.ReactNode

    /**
     * Optional user info component
     * Will be rendered in the top toolbar on the right side
     * @example
     * ```tsx
     * userComponent: <UserAvatar user={user} onLogin={...} onLogout={...} />
     * ```
     */
    userComponent?: React.ReactNode

    /**
     * Optional user info retrieval function
     * Used to obtain the current logged-in user info when needed
     */
    getUserInfo?: () => Promise<UserInfo | null>

    /**
     * Optional layout save callback
     * Called when the user triggers save, used to save the layout to the cloud
     * 
     * @param data - 当前的布局配置数据
     * @returns Promise，保存成功时 resolve
     */
    onSaveLayout?: (data: ProtocolData) => Promise<void>

    /**
     * Optional layout load callback
     * Called when the user triggers load, used to load the layout from the cloud
     * 
     * @returns Promise<ProtocolData | null>，返回加载的布局数据，无数据时返回 null
     */
    onLoadLayout?: () => Promise<ProtocolData | null>

    /**
     * Optional layout share callback
     * Called when the user triggers share, used to generate share links
     * 
     * @param data - 要分享的布局配置数据
     * @param options - 分享选项（如密码保护、有效期等）
     * @returns Promise<string>，返回分享链接
     */
    onShareLayout?: (
        data: ProtocolData,
        options?: { password?: string; expiresIn?: number }
    ) => Promise<string>

    /**
     * Optional permission check function
     * Used to check user permissions before executing certain features
     * 
     * @param feature - 功能标识符
     * @returns Promise<boolean>，true 表示有权限
     */
    checkPermission?: (feature: string) => Promise<boolean>

    /**
     * Optional custom toolbar menu items
     * Can add custom menus to the toolbar
     */
    customMenuItems?: Array<{
        label: string
        items: Array<{
            label: string
            onClick: () => void
            divider?: boolean
        }>
    }>
}
