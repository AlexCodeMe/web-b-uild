import React from 'react'

export default function AgencyIdPage({ params }: {
    params: { agencyId: string }
}) {
  return (
    <div>{params.agencyId}</div>
  )
}
