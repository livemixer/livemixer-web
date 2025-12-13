import { useState, useRef, useEffect } from 'react'

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
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleItemClick = (item: MenuItem) => {
        item.onClick?.()
        setIsOpen(false)
    }

    return (
        <div ref={menuRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    px-3 py-1.5 text-sm transition-colors
                    ${isOpen ? 'bg-[#3e3e42] text-white' : 'text-gray-300 hover:bg-[#3e3e42] hover:text-white'}
                `}
            >
                {label}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-0.5 min-w-[180px] bg-[#2d2d30] border border-[#3e3e42] rounded-md shadow-xl z-50 py-1">
                    {items.map((item, index) => (
                        item.divider ? (
                            <div key={index} className="my-1 border-t border-[#3e3e42]" />
                        ) : (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleItemClick(item)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#3e3e42] hover:text-white transition-colors"
                            >
                                {item.label}
                            </button>
                        )
                    ))}
                </div>
            )}
        </div>
    )
}
