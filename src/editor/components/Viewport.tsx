import { useMove, usePinch, useWheel } from '@use-gesture/react'
import React, { useContext } from 'react'
import { EditorContext } from './Editor'

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement>
  inputMode?: InputMode
}

export enum InputMode {
  MOUSE = 'Mouse',
  TRACKPAD = 'Trackpad',
}

export function Viewport({ canvasRef, inputMode = InputMode.TRACKPAD }: Props) {
  const editor = useContext(EditorContext)

  useMove(
    (state) => {
      if (state.buttons == 1) {
        if (state.shiftKey) {
          editor?.applyCameraPan(state.delta[0], state.delta[1])
        } else {
          editor?.applyCameraRotation(state.delta[0] * 5, state.delta[1] * 5)
        }
      }
    },
    {
      target: canvasRef,
    }
  )

  usePinch(
    (state) => {
      switch (inputMode) {
        case InputMode.TRACKPAD:
          editor?.applyCameraScale(state.delta[0])
          break
        case InputMode.MOUSE:
          break
      }
    },
    {
      preventDefault: true,
      target: canvasRef,
    }
  )

  useWheel(
    (state) => {
      switch (inputMode) {
        case InputMode.TRACKPAD:
          if (!state.ctrlKey) {
            if (state.shiftKey) {
              editor?.applyCameraPan(-state.delta[0], -state.delta[1])
            } else {
              editor?.applyCameraRotation(-state.delta[0], -state.delta[1])
            }
          }
          break
        case InputMode.MOUSE:
          editor?.applyCameraScale(-state.delta[1] / 1000)
          break
      }
    },
    {
      preventDefault: false,
      target: canvasRef,
    }
  )

  return <canvas className="h-full w-full" ref={canvasRef}></canvas>
}
