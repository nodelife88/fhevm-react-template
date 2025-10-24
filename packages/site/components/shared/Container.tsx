import type React from "react"
import classNames from "classnames"

interface ContainerProps {
  children: React.ReactNode
  className?: string
}

const Container: React.FC<ContainerProps> = ({ children, className, ...rest }) => {
  return (
    <div {...rest} className={classNames("flex flex-col h-full", className)}>
      {children}
    </div>
  )
}

export default Container
