import { Bell, Menu, Search, UserCircle } from "lucide-react";

type HeaderProps = {
  onMenuClick: () => void;
};

function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-20 items-center justify-between gap-4 border-b border-border bg-surface px-4 md:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="rounded-lg p-2 hover:bg-background md:hidden"
        >
          <Menu size={24} />
        </button>

        <h2 className="text-lg font-semibold md:text-xl">Workspace</h2>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <div className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 sm:flex">
          <Search size={18} className="text-text-secondary" />
          <input
            type="search"
            placeholder="Search..."
            aria-label="Search workspace"
            className="w-32 bg-transparent text-sm outline-none lg:w-56"
          />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="rounded-lg p-2 hover:bg-background"
        >
          <Bell size={20} />
        </button>

        <UserCircle size={30} className="text-primary" />
      </div>
    </header>
  );
}

export default Header;
