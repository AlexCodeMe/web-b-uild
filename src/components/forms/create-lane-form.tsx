'use client'

import { Lane } from '@prisma/client'
import React from 'react'

type Props = {
    defaultData?: Lane
  pipelineId: string
}

export default function CreateLaneForm({
    defaultData,
    pipelineId
}: Props) {
  return (
    <div>CreateLaneForm</div>
  )
}