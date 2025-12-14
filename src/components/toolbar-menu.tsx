import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

interface MenuItem {
  label?: string
  onClick?: () => void
  divider?: boolean
}

interface ToolbarMenuProps {
  label: string
  items: MenuItem[]
}

export function ToolbarMenu({ label, items }: ToolbarMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="px-3 py-1.5 text-sm text-gray-300 hover:bg-[#3e3e42] hover:text-white transition-colors data-[state=open]:bg-[#3e3e42] data-[state=open]:text-white"
        >
          {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-[180px] bg-[#2d2d30] border-[#3e3e42] rounded-md shadow-xl"
        align="start"
        sideOffset={2}
      >
        {items.map((item, index) =>
          item.divider ? (
            <DropdownMenuSeparator
              key={`divider-${index}`}
              className="bg-[#3e3e42]"
            />
          ) : (
            <DropdownMenuItem
              key={item.label || `item-${index}`}
              onClick={item.onClick}
              className="text-sm text-gray-300 hover:bg-[#3e3e42] hover:text-white focus:bg-[#3e3e42] focus:text-white cursor-pointer"
            >
              {item.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
