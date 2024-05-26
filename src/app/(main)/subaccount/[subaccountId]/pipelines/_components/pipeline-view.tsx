'use client'

import CustomModal from '@/components/custom-modal'
import { LaneDetail, PipelineDetailsWithLanesCardsTagsTickets, TicketAndTags } from '@/lib/types'
import { useModal } from '@/providers/modal-provider'
import { Lane, Ticket } from '@prisma/client'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

type Props = {
    lanes: LaneDetail[]
    pipelineId: string
    subaccountId: string
    pipelineDetails: PipelineDetailsWithLanesCardsTagsTickets
    updateLanesOrder: (lanes: Lane[]) => Promise<void>
    updateTicketsOrder: (tickets: Ticket[]) => Promise<void>
}

export default function PipelineView({
    lanes,
    pipelineDetails,
    pipelineId,
    subaccountId,
    updateLanesOrder,
    updateTicketsOrder,
}: Props) {
    const { setOpen } = useModal()
    const router = useRouter()
    const [allLanes, setAllLanes] = useState<LaneDetail[]>([])

    useEffect(() => {
        setAllLanes(lanes)
    }, [lanes])

    const ticketsFromAllLanes: TicketAndTags[] = []

    lanes.forEach((lane) => {
        lane.Tickets.forEach((ticket) => {
            ticketsFromAllLanes.push(ticket)
        })
    })

    const [allTickets, setAllTickets] = useState(ticketsFromAllLanes)

    const handleAddLane = () => {
        setOpen(
            <CustomModal title='Create a Lane'
                subheading='Lanes allow you to group tickets'>
                LaneForm pipelineId={pipelineId}
            </CustomModal>
        )
    }
    return (
        <div>PipelineView</div>
    )
}