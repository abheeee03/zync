"use client"
import { Button } from './ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Moon02Icon, Sun01Icon } from '@hugeicons/core-free-icons'
import { useTheme } from 'next-themes'

function ThemeSwitcher() {
    const {theme, setTheme} = useTheme()
  return (
    <Button 
    onClick={()=>{
        setTheme(theme == "dark" ? "light" : "dark")
    }}
    variant={"outline"}>
        {
            theme == "dark" ? 
            <HugeiconsIcon
            icon={Sun01Icon}
            />
            : <HugeiconsIcon
            icon={Moon02Icon}
            /> 
        }
    </Button>
  )
}

export default ThemeSwitcher