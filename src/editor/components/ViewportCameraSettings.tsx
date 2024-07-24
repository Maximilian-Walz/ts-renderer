import React from 'react'
import { LuLaptop2, LuMouse } from 'react-icons/lu'
import { InputMode } from './Viewport'

type Props = {
  currentInputMode: InputMode
  setInputMode: React.Dispatch<React.SetStateAction<InputMode>>
}

export function ViewportCameraSettings({ currentInputMode, setInputMode }: Props) {
  const modes = [
    {
      mode: InputMode.MOUSE,
      icon: <LuMouse height={1} />,
    },
    {
      mode: InputMode.TRACKPAD,
      icon: <LuLaptop2 height={1} />,
    },
  ]

  return (
    <div className="mb-2">
      <span className="label-text inline self-center pr-3">Input mode</span>
      <div className="join">
        {modes.map((mode) => {
          const active = mode.mode === currentInputMode
          return (
            <button
              key={mode.mode}
              className={`btn join-item ${active ? 'bg-primary-500 text-gray-900' : 'bg-gray-700'}`}
              aria-label={mode.mode}
              onClick={() => setInputMode(mode.mode)}
            >
              {mode.icon}
            </button>
          )
        })}
      </div>
    </div>
  )
}
