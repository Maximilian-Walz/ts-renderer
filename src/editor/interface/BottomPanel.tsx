import { useQueue } from '@uidotdev/usehooks'
import React, { useEffect, useRef } from 'react'
import { LuListX } from 'react-icons/lu'
import { LogEvent } from '../../engine/events/LogEvent'
import { useEditor } from '../state/EditorProvider'

export function BottomPanel() {
  const { add, remove, clear, first, last, size, queue } = useQueue<string>([])
  const scrollRef = useRef<HTMLUListElement>(null)

  const editor = useEditor()

  useEffect(() => {
    const listener = (e: LogEvent) => {
      add(e.message)
    }
    editor?.engine.eventManger.on('log', listener)
    return () => {
      editor?.engine.eventManger.off('log', listener)
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [queue])

  return (
    <div className="flex grow flex-col">
      <div className="row flex justify-between">
        <div className="m-1 text-sm">Log</div>
        <button className="m-1" onClick={() => clear()}>
          <LuListX />
        </button>
      </div>
      <ul ref={scrollRef} className="grow overflow-y-scroll">
        {queue.map((item, i) => (
          <li className="p-0.5 text-sm text-gray-500" key={i}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
