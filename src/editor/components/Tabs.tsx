import React from 'react'

type Props = {
  tabs: Tab[]
  className?: string
  tabStyle?: string
}

export type Tab = {
  id: string
  displayName: string
  content: JSX.Element
}

export function Tabs({ tabs, className, tabStyle }: Props) {
  const [activeTabIndex, setActiveTabIndex] = React.useState<number>(0)

  return (
    <div className={className}>
      <div role="tablist" className={`${tabStyle || 'tabs-boxed'} tabs mx-auto my-2`}>
        {tabs.map((tab, index) => (
          <button role="tab" key={tab.id} className={`tab m-auto ${index == activeTabIndex && 'tab-active'} `} onClick={() => setActiveTabIndex(index)}>
            {tab.displayName}
          </button>
        ))}
      </div>
      {tabs[activeTabIndex].content}
    </div>
  )
}
