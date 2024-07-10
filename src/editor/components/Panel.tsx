import React, { ReactElement } from 'react'

type Props = {
  children: ReactElement | ReactElement[] | null
  className: string
  title: string
}

export function Panel({ children, className, title }: Props) {
  return (
    <div className={'collapse ' + className}>
      <div className="text-md collapse-title font-medium">{title}</div>
      {children && <input defaultChecked type="checkbox" />}
      {children && <div className="collapse-content">{children}</div>}
    </div>
  )
}
