
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/db'
import { CheckCircleIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  params: {
    agencyId: string
  }
  searchParams: { code: string }
}

export default async function LaunchpadPage({ params, searchParams }: Props) {
  const agencyDetails = await db.agency.findUnique({
    where: {
      id: params.agencyId
    }
  })

  if (!agencyDetails) return

  const allDetailsExist =
    agencyDetails.address &&
    agencyDetails.agencyLogo &&
    agencyDetails.city &&
    agencyDetails.companyEmail &&
    agencyDetails.companyPhone &&
    agencyDetails.country &&
    agencyDetails.name &&
    agencyDetails.state &&
    agencyDetails.zipCode

  const stripeOAuthLink = ''

  let connectedStripeAccount = false

  if (searchParams.code) {
    if (!agencyDetails.connectAccountId) {
      try {
        // TODO: Stripe
      } catch (error) {
        console.log('🔴 Could not connect stripe account', error)
      }
    }
  }

  return (
    <div className='flex flex-col justify-center items-center'>
      <div className='size-full max-w-[800px]'>
        <Card className='border-none'>
          <CardHeader>
            <CardTitle>Let&apos;s begin!</CardTitle>
            <CardDescription>
              Follow the steps to proceed with your account setup.
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-4'>
            <div className='flex justify-between items-center w-full border p-4 rounded-lg gap-2'>
              <div className='flex md:items-center gap-4 flex-col md:!flex-row'>
                <Image src='/appstore.png' alt='app logo'
                  width={80} height={80}
                  className='rounded-md object-contain' />
                <p>Save the website as a shortcut on your mobile</p>
              </div>
              <Button>Start</Button>
            </div>
            <div className='flex justify-between items-center w-full border p-4 rounded-lg gap-2'>
              <div className='flex md:items-center gap-4 flex-col md:!flex-row'>
                <Image src='/stripelogo.png' alt='app logo'
                  width={80} height={80}
                  className='rounded-md object-contain' />
                <p>Connect your stripe account to accept payments and view your Dashboard</p>
              </div>
              {agencyDetails.connectAccountId || connectedStripeAccount ? (
                <CheckCircleIcon className='text-primary p-2 flex-shrink-0'
                  size={50} />
              ) : (
                <Link href={stripeOAuthLink}
                  className='bg-primary py-2 px-4 rounded-md text-white'>
                  Start
                </Link>
              )}
            </div>
            <div className='flex justify-between items-center w-full border p-4 rounded-lg gap-2'>
              <div className='flex md:items-center gap-4 flex-col md:!flex-row'>
                <Image src={agencyDetails.agencyLogo} alt='agency logo'
                  width={80} height={80}
                  className='rounded-md object-contain' />
                <p>Include in your business details</p>
              </div>
              {allDetailsExist ? (
                <CheckCircleIcon className='text-primary p-2 flex-shrink-0'
                  size={50} />
              ) : (
                <Link href={`/agency/${params.agencyId}/settings`}
                  className='bg-primary py-2 px-4 rounded-md text-white'>
                  Start
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
