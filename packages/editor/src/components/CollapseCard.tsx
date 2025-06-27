import { ReactNode, useState } from "react"
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md"

type Props = {
  icon?: ReactNode
  title: ReactNode
  action?: ReactNode
  children?: ReactNode
  defaultExpanded?: boolean
}

export function CollapseCard({ icon, title, action, children, defaultExpanded = false }: Props) {
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded)

  return (
    <div className="flex flex-col">
      <div className="collapse rounded-none grow">
        <input type="checkbox" checked={expanded} onChange={(event) => setExpanded(event.target.checked)} />
        <div className="collapse-title py-0 font-semibold text-sm join join-horizontal justify-between items-center">
          {expanded ? <MdKeyboardArrowDown /> : <MdKeyboardArrowRight />}
          <div className="join grow items-center">
            <span className="mr-3">{icon}</span>
            {title}
          </div>
          {action}
        </div>
        <div className="collapse-content text-sm min-h-0 flex">{children}</div>
      </div>
    </div>
  )
}
