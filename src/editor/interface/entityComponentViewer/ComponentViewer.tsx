import React, { ReactElement, useState } from 'react'
import { LuBoxSelect } from 'react-icons/lu'
import { MdKeyboardArrowDown, MdKeyboardArrowLeft } from 'react-icons/md'

type Props = {
  title: string
  children: ReactElement | ReactElement[]
  icon?: JSX.Element
}

export function ComponentViewer({ title, children, icon = <LuBoxSelect /> }: Props) {
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
      <div hidden={!expanded} className="m-3">
        {children}
      </div>
    </div>
  )
}
