import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface MenuItem {
  label?: string;
  onClick?: () => void;
  divider?: boolean;
  disabled?: boolean;
  shortcut?: string;
  checked?: boolean;
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
          className="px-3 py-1.5 text-sm text-[var(--lm-muted)] hover:bg-[var(--lm-hover)] hover:text-[var(--lm-fg)] transition-all rounded-md data-[state=open]:bg-[var(--lm-hover)] data-[state=open]:text-[var(--lm-fg)]"
        >
          {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-[180px] bg-[var(--lm-surface-3)] border-[var(--lm-border)] rounded-lg shadow-xl"
        align="start"
        sideOffset={2}
      >
        {items.map((item, index) =>
          item.divider ? (
            <DropdownMenuSeparator
              key={`divider-${item.label || index}`}
              className="bg-[var(--lm-border)]"
            />
          ) : item.checked !== undefined ? (
            <DropdownMenuCheckboxItem
              key={item.label || `item-${index}`}
              onCheckedChange={item.onClick}
              checked={item.checked}
              disabled={item.disabled}
              className="text-sm text-[var(--lm-muted)] hover:bg-[var(--lm-hover)] hover:text-[var(--lm-fg)] focus:bg-[var(--lm-hover)] focus:text-[var(--lm-fg)] cursor-pointer data-[disabled]:cursor-default data-[disabled]:text-[var(--lm-muted-2)] data-[disabled]:hover:bg-transparent data-[disabled]:hover:text-[var(--lm-muted-2)]"
            >
              {item.label}
              {item.shortcut && (
                <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
              )}
            </DropdownMenuCheckboxItem>
          ) : (
            <DropdownMenuItem
              key={item.label || `item-${index}`}
              onClick={item.onClick}
              disabled={item.disabled}
              className="text-sm text-[var(--lm-muted)] hover:bg-[var(--lm-hover)] hover:text-[var(--lm-fg)] focus:bg-[var(--lm-hover)] focus:text-[var(--lm-fg)] cursor-pointer data-[disabled]:cursor-default data-[disabled]:text-[var(--lm-muted-2)] data-[disabled]:hover:bg-transparent data-[disabled]:hover:text-[var(--lm-muted-2)]"
            >
              {item.label}
              {item.shortcut && (
                <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
