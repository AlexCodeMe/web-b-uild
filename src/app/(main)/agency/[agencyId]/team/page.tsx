import { db } from "@/lib/db"
import { currentUser } from "@clerk/nextjs"
import { Plus } from "lucide-react"
import { columns } from "./columns"
import DataTable from "./data-table"
import SendInvitation from "@/components/forms/send-invitation"

type Props = {
  params: {
    agencyId: string
  }
}

export default async function TeamPage({ params }: Props) {
  const authUser = await currentUser()
  if (!authUser) return null

  const teamMembers = await db.user.findMany({
    where: {
      Agency: {
        id: params.agencyId,
      }
    },
    include: {
      Agency: {
        include: {
          SubAccount: true
        }
      },
      Permissions: {
        include: {
          SubAccount: true
        }
      }
    }
  })

  const agencyDetails = await db.agency.findUnique({
    where: {
      id: params.agencyId,
    },
    include: {
      SubAccount: true
    }
  })
  if (!agencyDetails) return

  return <DataTable actionButtonText={
    <>
      <Plus size={15} />
      Add
    </>
  }
    modalChildren={<SendInvitation agencyId={agencyDetails.id} />}
    filterValue="name"
    columns={columns}
    data={teamMembers} />
}
