import React, { useEffect, useRef } from 'react'
import { useEditor } from '../state/EditorProvider'
import { BottomPanel } from './BottomPanel'
import { LeftPanel } from './LeftPanel'
import { RightPanel } from './RightPanel'

export function Viewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const editor = useEditor()

  useEffect(() => {
    if (canvasRef.current) {
      editor!.setEditorRenderTarget(canvasRef.current)
    }
    return () => editor?.engine.abort()
  }, [canvasRef, editor])

  return (
    <div className="flex grow">
      <div className="basis-2/12">
        <LeftPanel />
      </div>
      <div className="flex grow basis-7/12 flex-col">
        <canvas className="min-h-0 min-w-0 grow rounded-xl" ref={canvasRef}></canvas>
        <div className="flex min-h-0 grow-0 basis-2/12">
          <BottomPanel />
        </div>
      </div>
      <div className="flex grow basis-3/12 flex-col">
        <RightPanel />
      </div>
    </div>
  )
}
