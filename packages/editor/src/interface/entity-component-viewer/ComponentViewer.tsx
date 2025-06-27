import { ReactNode } from "react"
import { LuBox } from "react-icons/lu"
import { CollapseCard } from "../../components/CollapseCard"

type Props = {
  title: string
  contentKey: string
  children?: ReactNode | ReactNode[]
  icon?: ReactNode
}

export function ComponentViewer({ title, contentKey, children, icon = <LuBox /> }: Props) {
  return (
    <CollapseCard title={title} icon={icon} key={contentKey}>
      {children}
    </CollapseCard>
  )
}
