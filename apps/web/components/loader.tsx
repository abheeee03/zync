"use client"

import { useState, useEffect } from "react"
import { EncryptedText } from "./enc-txt"
import { DotmSquare8 } from "./ui/dotm-square-8"

const MESSAGES = [
  "hold up, connecting the vibes",
  "Connecting the dots...",
  "sending packets, no cap",
  "speedrunning your workflow",
]

function Loader() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % MESSAGES.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center gap-3">
        <DotmSquare8 />
        <EncryptedText
          key={MESSAGES[index]}
          text={MESSAGES[index]}
          revealDelayMs={10}
        />
    </div>
  )
}

export default Loader