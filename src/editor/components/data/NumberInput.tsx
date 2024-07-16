import { useClickAway, useHover } from '@uidotdev/usehooks'
import React, { FocusEvent, MutableRefObject, useEffect, useRef, useState } from 'react'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md'

type Props = {
  initialValue: number
  onChange: (value: number) => void
  label?: string
  labelContained?: boolean
  precision?: number
  step?: number
}

export function NumberInput({ initialValue, onChange, label, labelContained = false, precision = 2, step = 1 }: Props) {
  const [value, setValue] = useState<string>(initialValue.toString())
  const [valid, setValid] = useState<boolean>(true)
  const [editing, setEditing] = useState<boolean>(false)
  const [inputRef, hovering] = useHover()

  const numberInputRef: MutableRefObject<HTMLDivElement> = useClickAway(() => {
    setEditing(false)
    window.getSelection()?.empty()
  })

  useEffect(() => {
    if (!editing) {
      setValue(initialValue.toFixed(precision).toString())
    }
  }, [initialValue])

  const parse = (value: string) => Number.parseFloat(value == '' ? '0' : value)

  const handleChange = (value: string) => {
    const number = parse(value)
    if (!isNaN(number)) {
      setValid(true)
      onChange(number)
      setValue(number.toFixed(precision))
    } else {
      setValid(false)
      setValue(value)
    }
  }

  const handleUpdate = (value: string) => {
    setValid(!isNaN(parse(value)))
    setValue(value)
  }

  const startEditing = (event: FocusEvent<HTMLInputElement>) => {
    setEditing(true)
    event.target.select()
  }

  const handleSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key == 'Enter') {
      event.currentTarget.blur()
    }
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    setEditing(false)
    handleChange(event.target.value)
  }

  const handleStep = (event: React.MouseEvent<HTMLButtonElement>, amount: number) => {
    let scaledAmount = amount
    if (event.shiftKey) {
      scaledAmount /= 10
    } else if (event.ctrlKey) {
      scaledAmount *= 10
    }
    handleChange((Number.parseFloat(value) + scaledAmount).toString())
  }

  const wheelTimeout = useRef<number | boolean>()

  const handleWheel = (event: React.WheelEvent<HTMLInputElement>) => {
    let scaledAmount = (step * (event.deltaX + event.deltaY)) / 100
    if (event.shiftKey) {
      scaledAmount /= 10
    } else if (event.ctrlKey) {
      scaledAmount *= 10
    }
    handleChange((Number.parseFloat(value) + scaledAmount).toString())

    // While wheel is moving, do not release the lock
    clearTimeout(wheelTimeout.current as number)

    // Flag indicating to lock page scrolling (setTimeout returns a number)
    wheelTimeout.current = setTimeout(() => {
      wheelTimeout.current = false
    }, 300)
  }

  const handleMouseDown = (event: React.PointerEvent<HTMLInputElement>) => {
    event.preventDefault()
    event.currentTarget.requestPointerLock()
  }

  const handleMouseMove = (event: React.PointerEvent<HTMLInputElement>) => {
    if (event.buttons == 1) {
      let scaledAmount = (step * (event.movementX + event.movementY)) / 100
      if (event.shiftKey) {
        scaledAmount /= 10
      } else if (event.ctrlKey) {
        scaledAmount *= 10
      }
      handleChange((Number.parseFloat(value) + scaledAmount).toString())
    }
  }

  const handleMouseUp = (event: React.PointerEvent<HTMLInputElement>) => {
    document.exitPointerLock()
    if (event.detail > 0) {
      setEditing(true)
      event.currentTarget.focus()
    }
  }

  const handleDragStart = (event: React.DragEvent<HTMLInputElement>) => {
    event.currentTarget.requestPointerLock()
    event.stopPropagation()
    event.preventDefault()
  }

  // Block the body from scrolling (or any other element)
  useEffect(() => {
    const cancelWheel = (event: WheelEvent) => wheelTimeout.current && event.preventDefault()
    document.body.addEventListener('wheel', cancelWheel, { passive: false })
    return () => document.body.removeEventListener('wheel', cancelWheel)
  }, [])

  return (
    <div className="form-control indicator join join-horizontal self-end" ref={numberInputRef}>
      {!labelContained && <span className="label-text inline self-center pr-3">{label}</span>}
      {!valid && <span className="badge indicator-item badge-error">!</span>}
      <div className="join join-horizontal mr-auto bg-gray-700" ref={inputRef}>
        <button
          tabIndex={-1}
          className="btn btn-xs self-center rounded-r-none border-none bg-inherit px-1 hover:bg-gray-600"
          style={{ visibility: hovering ? 'visible' : 'hidden' }}
          onClick={(event) => handleStep(event, -step)}
        >
          <MdKeyboardArrowLeft />
        </button>
        <div className="relative">
          {labelContained && !editing && <span className="label-text absolute bottom-0 top-0 self-center pl-1">{label}</span>}
          <input
            type="text"
            className={`input input-xs self-center rounded-none border-none bg-inherit pr-1 align-top hover:cursor-ew-resize hover:bg-gray-600 focus:outline-none ${editing && 'text-start'} ${!editing && (labelContained ? 'text-end' : 'text-center')}`}
            value={value}
            onChange={(event) => handleUpdate(event.target.value)}
            onKeyDown={handleSubmit}
            onFocus={startEditing}
            onBlur={handleBlur}
            onWheel={handleWheel}
            onDragStart={handleDragStart}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
        </div>
        <button
          tabIndex={-1}
          className="btn btn-xs rounded-l-none border-none bg-inherit px-1 hover:bg-gray-600"
          style={{ visibility: hovering ? 'visible' : 'hidden' }}
          onClick={(event) => handleStep(event, step)}
        >
          <MdKeyboardArrowRight />
        </button>
      </div>
    </div>
  )
}
