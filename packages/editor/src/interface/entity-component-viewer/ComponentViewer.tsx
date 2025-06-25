import { ReactElement, useState } from "react"
import { LuBox } from "react-icons/lu"
import { MdKeyboardArrowDown, MdKeyboardArrowLeft } from "react-icons/md"

type Props = {
  title: string
  contentKey: string
  children?: ReactElement | ReactElement[]
  icon?: ReactElement
}

export function ComponentViewer({ title, contentKey, children, icon = <LuBox /> }: Props) {
  const [expanded, setExpanded] = useState<boolean>(false)

  return (
    <div className="flex flex-col">
      <div
        className="join join-horizontal grow cursor-pointer items-center justify-between rounded-none bg-gray-800 p-3 px-6 align-middle text-sm font-medium hover:bg-gray-700"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="join grow items-center">
          <span className="mr-3">{icon}</span>
          {title}
        </div>
        {expanded ? <MdKeyboardArrowDown /> : <MdKeyboardArrowLeft />}
      </div>
      <div hidden={!expanded} className="m-3" key={contentKey}>
        {children}
      </div>
    </div>
  )
}
