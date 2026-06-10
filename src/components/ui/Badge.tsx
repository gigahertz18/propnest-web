import { UserRole } from "@/types"

const ROLE_STYLES: Record<UserRole, string> = {
  admin:   "bg-[#EEEDFE] text-[#3C3489]",
  manager: "bg-[#E1F5EE] text-[#085041]",
  user:    "bg-[#F1EFE8] text-[#444441]",
}

const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`${base} ${ROLE_STYLES[role]} capitalize`}>
      {role}
    </span>
  )
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`${base} ${
        active
          ? "bg-[#E1F5EE] text-[#085041]"
          : "bg-[#FCEBEB] text-[#791F1F]"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  )
}
