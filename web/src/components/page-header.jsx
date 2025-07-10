const PageHeader = ({ title, children }) => {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 lg:gap-2">
        <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        <div className="ml-auto flex items-center gap-2">{children}</div>
      </div>
    </header>
  )
}

export { PageHeader }
