'use client'

import { deleteSubAccount, getSubaccountDetails, saveActivityLogsNotification } from '@/lib/queries'
import { useRouter } from 'next/navigation'
import React from 'react'

export default function DeleteButton({ subaccountId }: { subaccountId: string}) {
    const router = useRouter()

    async function handleClick() {
        const response = await getSubaccountDetails(subaccountId)

        await saveActivityLogsNotification({
            agencyId: undefined,
            description: `Deleted a subaccount | ${response?.name}`,
            subaccountId,
        })

        await deleteSubAccount(subaccountId)
        router.refresh()
    }

  return (
    <div className='text-white' onClick={handleClick}>
        Delete Sub Account
    </div>
  )
}
