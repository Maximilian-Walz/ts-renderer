import React, { useEffect, useRef } from 'react'
import { useEditor } from '../state/EditorProvider'
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
    <div>
      <div className="flex flex-row">
        <div className="basis-1/6">
          <LeftPanel />
        </div>
        <canvas className="min-h-0 min-w-0 grow rounded-xl" ref={canvasRef}></canvas>
        <div className="basis-1/4 overflow-scroll">
          <RightPanel />
        </div>
      </div>
      <div className="flex-row text-center">Bottom Panel</div>
    </div>
  )
}
