import React, { FocusEvent, useEffect, useState } from "react"

type Props = {
  initialValue: string
  onChange: (value: string) => void
  label?: string
  labelContained?: boolean
}

export function LabelInput({ initialValue, onChange, label, labelContained = false }: Props) {
  const [value, setValue] = useState<string>(initialValue)
  const [editing, setEditing] = useState<boolean>(false)

  useEffect(() => {
    if (!editing) {
      setValue(initialValue)
    }
  }, [initialValue])

  const handleChange = (value: string) => {
    onChange(value)
    setValue(value)
  }

  const handleUpdate = (value: string) => {
    setValue(value)
  }

  const startEditing = (event: FocusEvent<HTMLInputElement>) => {
    setEditing(true)
    event.target.select()
  }

  const handleSubmit = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key == "Enter") {
      event.currentTarget.blur()
    }
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    setEditing(false)
    handleChange(event.target.value)
  }

  return (
    <div className="form-control indicator join join-horizontal self-end">
      {!labelContained && <span className="label-text inline self-center pr-3">{label}</span>}
      <div className="relative mr-auto">
        {labelContained && !editing && (
          <span className="label-text absolute bottom-0 top-0 self-center pl-6">{label}</span>
        )}
        <input
          type="text"
          className={`input input-xs self-center border-none bg-gray-700 px-[25px] align-top hover:bg-gray-600 focus:outline-none ${
            editing && "text-start"
          } ${!editing && (labelContained ? "text-end" : "text-start")}`}
          value={value}
          onChange={(event) => handleUpdate(event.target.value)}
          onKeyDown={handleSubmit}
          onFocus={startEditing}
          onBlur={handleBlur}
        />
      </div>
    </div>
  )
}
