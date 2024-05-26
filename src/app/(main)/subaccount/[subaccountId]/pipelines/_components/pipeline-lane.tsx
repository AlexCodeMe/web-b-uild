'use client'

import CustomModal from '@/components/custom-modal'
import CreateLaneForm from '@/components/forms/create-lane-form'
import TicketForm from '@/components/forms/ticket-form'
import { deleteLane, saveActivityLogsNotification } from '@/lib/queries'
import { LaneDetail, TicketWithTags } from '@/lib/types'
import { useModal } from '@/providers/modal-provider'
import { useRouter } from 'next/navigation'
import React, { Dispatch, SetStateAction, useMemo } from 'react'

type Props = {
    setAllTickets: Dispatch<SetStateAction<TicketWithTags>>
    allTickets: TicketWithTags
    tickets: TicketWithTags
    pipelineId: string
    laneDetails: LaneDetail
    subaccountId: string
    index: number
}

export default function PipelineLane({
    setAllTickets,
    tickets,
    pipelineId,
    laneDetails,
    subaccountId,
    allTickets,
    index,
}: Props) {
    const { setOpen } = useModal()
    const router = useRouter()

    const amt = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
    })

    const laneAmt = useMemo(() => {
        return tickets.reduce(
            (sum, ticket) => sum + (Number(ticket?.value) || 0),
            0
        )
    }, [tickets])

    const randomColor = `#${Math.random().toString(16).slice(2, 8)}`

    function addNewTicket(ticket: TicketWithTags[0]) {
        setAllTickets([...allTickets, ticket])
    }

    function handleCreateTicket() {
        setOpen(
            <CustomModal
                title="Create A Ticket"
                subheading="Tickets are a great way to keep track of tasks"
            >
                <TicketForm
                    getNewTicket={addNewTicket}
                    laneId={laneDetails.id}
                    subaccountId={subaccountId}
                />
            </CustomModal>
        )
    }

    function handleEditLane() {
        setOpen(
            <CustomModal
                title="Edit Lane Details"
                subheading=""
            >
                <CreateLaneForm
                    pipelineId={pipelineId}
                    defaultData={laneDetails}
                />
            </CustomModal>
        )
    }

    async function handleDeleteLane() {
        try {
            const response = await deleteLane(laneDetails.id)
            await saveActivityLogsNotification({
                agencyId: undefined,
                description: `Deleted a lane | ${response?.name}`,
                subaccountId,
            })
            router.refresh()
        } catch (error) {
            console.log('[handleDeleteLane]', error)
        }
    }

    return (
        <div>PipelineLane</div>
    )
}