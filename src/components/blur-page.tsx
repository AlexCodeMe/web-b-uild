import React from 'react'

export default function BlurPage({ children }: { children: React.ReactNode }) {
  return (
    <div id='blur-page' 
        className='h-screen overflow-scroll backdrop-blur-[35px] dark:bg-muted/40 bg-muted/60 dark:shadow-2xl dark:shadow-black  mx-auto pt-24 p-4 absolute top-0 right-0 left-0 botton-0 z-[11]'
    >
        {children}
    </div>
  )
}
