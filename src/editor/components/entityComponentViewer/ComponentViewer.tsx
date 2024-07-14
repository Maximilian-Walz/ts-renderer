import React, { ReactElement, useState } from 'react'
import { LuBoxSelect } from 'react-icons/lu'
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md'

type Props = {
  title: string
  children: ReactElement | ReactElement[]
  icon?: JSX.Element
}

export function ComponentViewer({ title, children, icon = <LuBoxSelect /> }: Props) {
  const [expanded, setExpanded] = useState<boolean>(false)

  return (
    <div className="collapse bg-gray-800">
      <input type="checkbox" hidden readOnly checked={expanded}></input>
      <div
        className="join join-horizontal cursor-pointer items-center justify-between bg-gray-800 p-3 px-6 align-middle text-sm font-medium hover:bg-gray-900"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="join items-center">
          <span className="mr-3">{icon}</span>
          {title}
        </div>
        {expanded ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
      </div>
      <div className="collapse-content">
        <div className="mt-3">{children}</div>
      </div>
    </div>
  )
}
