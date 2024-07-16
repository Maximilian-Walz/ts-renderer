import React, { useContext } from 'react'
import { EditorContext } from './Editor'

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function Viewport({ canvasRef }: Props) {
  const editor = useContext(EditorContext)
  const isTrackPad = (event: React.WheelEvent<HTMLCanvasElement>) => {
    const { deltaY } = event
    if (deltaY && !Number.isInteger(deltaY)) {
      return false
    }
    return true
  }

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // TODO: Implement behaviour with mouse
  }

  const handleCanvasWheelMove = (event: React.WheelEvent<HTMLCanvasElement>) => {
    if (isTrackPad(event)) {
      if (event.shiftKey) {
        editor?.applyCameraPan(-event.deltaX, -event.deltaY)
      } else {
        editor?.applyCameraRotation(-event.deltaX, -event.deltaY)
      }
    } else {
      // TODO: Implement behaviour with mouse
    }
  }
  return <canvas onMouseMove={(event) => handleCanvasMouseMove(event)} onWheel={(event) => handleCanvasWheelMove(event)} className="h-full w-full" ref={canvasRef}></canvas>
}
