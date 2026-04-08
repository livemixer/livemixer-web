import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface MenuItem {
  label?: string;
  onClick?: () => void;
  divider?: boolean;
}

interface ToolbarMenuProps {
  label: string;
  items: MenuItem[];
}

export function ToolbarMenu({ label, items }: ToolbarMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-700/50 hover:text-white transition-all rounded-md data-[state=open]:bg-neutral-700/50 data-[state=open]:text-white"
        >
          {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-[180px] bg-neutral-800/95 border-neutral-700/50 rounded-lg shadow-xl"
        align="start"
        sideOffset={2}
      >
        {items.map((item, index) =>
          item.divider ? (
            <DropdownMenuSeparator
              key={`divider-${item.label || index}`}
              className="bg-neutral-700/30"
            />
          ) : (
            <DropdownMenuItem
              key={item.label || `item-${index}`}
              onClick={item.onClick}
              className="text-sm text-neutral-300 hover:bg-neutral-700/50 hover:text-white focus:bg-neutral-700/50 focus:text-white cursor-pointer"
            >
              {item.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
