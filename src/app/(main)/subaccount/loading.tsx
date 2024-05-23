import { Loader } from '@/components/loader'
import React from 'react'

export default function LoadingAgencyPage() {
  return (
    <div className="h-screen w-screen flex justify-center items-center">
        <Loader />
    </div>
  )
}
