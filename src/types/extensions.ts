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
  * @param data - Current layout configuration data
  * @returns Promise resolved on successful save
   */
  onSaveLayout?: (data: ProtocolData) => Promise<void>

  /**
   * Optional layout load callback
   * Called when the user triggers load, used to load the layout from the cloud
   * 
  * @returns Promise<ProtocolData | null> returning loaded layout data, or null when none
   */
  onLoadLayout?: () => Promise<ProtocolData | null>

  /**
   * Optional layout share callback
   * Called when the user triggers share, used to generate share links
   * 
  * @param data - Layout configuration data to share
  * @param options - Share options (e.g., password, expiry)
  * @returns Promise<string> containing the share link
   */
  onShareLayout?: (
    data: ProtocolData,
    options?: { password?: string; expiresIn?: number }
  ) => Promise<string>

  /**
   * Optional permission check function
   * Used to check user permissions before executing certain features
   * 
  * @param feature - Feature identifier
  * @returns Promise<boolean> where true means permitted
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
