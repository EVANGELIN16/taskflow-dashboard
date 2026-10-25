import { useEffect } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  KanbanSquare,
  Users,
  Settings,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const navigation = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Projects",
    path: "/projects",
    icon: FolderKanban,
  },
  {
    name: "My Tasks",
    path: "/tasks",
    icon: ListTodo,
  },
  {
    name: "Kanban Board",
    path: "/kanban",
    icon: KanbanSquare,
  },
  {
    name: "Team",
    path: "/team",
    icon: Users,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

function Sidebar({ isOpen, onClose }: SidebarProps) {
  // Allow users to close the mobile menu with Escape.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile background overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        id="taskflow-sidebar"
        aria-label="Main navigation"
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-64 flex-col
          border-r border-border bg-surface
          shadow-lg transition-transform duration-200
          md:translate-x-0 md:shadow-none
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo and close button */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-border px-6">
          <NavLink
            to="/"
            onClick={onClose}
            className="text-2xl font-bold text-primary"
          >
            TaskFlow
          </NavLink>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-2 text-text-secondary hover:bg-background md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3
                   text-sm font-medium transition-colors
                   ${
                     isActive
                       ? "bg-primary/10 text-primary"
                       : "text-text-secondary hover:bg-background hover:text-primary"
                   }`
                }
              >
                <Icon size={20} className="shrink-0" />

                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="shrink-0 border-t border-border px-6 py-4">
          <p className="text-xs font-medium text-text-secondary">TaskFlow</p>

          <p className="mt-1 text-xs text-text-secondary">
            Project Management Dashboard
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
