import React, { ReactElement } from "react"

type Props = {
  tabs: Tab[]
  className?: string
  tabStyle?: string
}

export type Tab = {
  id: string
  displayName: string
  content: ReactElement
}

export function Tabs({ tabs, className, tabStyle }: Props) {
  const [activeTabIndex, setActiveTabIndex] = React.useState<number>(0)

  return (
    <div className="flex h-0 grow flex-col">
      <div className={`${tabStyle || "tabs-boxed"} tabs mx-auto my-2`}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            className={`tab m-auto ${index == activeTabIndex && "tab-active"} `}
            onClick={() => setActiveTabIndex(index)}
          >
            {tab.displayName}
          </button>
        ))}
      </div>
      <div className="flex h-0 grow flex-row">{tabs[activeTabIndex].content}</div>
    </div>
  )
}
