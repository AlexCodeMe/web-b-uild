import BlurPage from '@/components/blur-page'
import InfoBar from '@/components/infobar'
import Sidebar from '@/components/sidebar'
import Unauthorized from '@/components/unauthorized'
import { getNotificationsAndUser, verifyAndAcceptInvitation } from '@/lib/queries'
import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {
    children: React.ReactNode
    params: { agencyId: string }
}

export default async function AgencyIdLayout({ params, children }: Props) {
  const agencyId = await verifyAndAcceptInvitation()
  const user = await currentUser()

  if (!user) return redirect('/')
    if (!agencyId) return redirect('/agency')

    if (
      user.privateMetadata.role !== 'AGENCY_OWNER' &&
      user.privateMetadata.role !== 'AGENCY_ADMIN'
    ) {
      return <Unauthorized />
    }

    let allNoti: any = []
    const notifications = await getNotificationsAndUser(agencyId)
    if (notifications) allNoti = notifications

  return (
    <div className='h-screen overflow-hidden'>
        <Sidebar type='agency' id={params.agencyId} />
        <div className='md:pl-[300px]'>
            <InfoBar notifications={allNoti}
              role={allNoti.User?.role}/>
            <div className='relative'>
                <BlurPage>{children}</BlurPage>
            </div>
        </div>
    </div>
  )
}