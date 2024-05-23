import React from 'react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='bg-blue-50 h-full flex items-center justify-center flex-col gap-y-6'>
        <h1 className='text-zinc-800 text-6xl font-bold'>Welcome to Web(b)uild!</h1>
        <p className='text-zinc-800/70 text-2xl font-semibold'>Please Login or Register</p>
        {children}
    </div>
  )
}
