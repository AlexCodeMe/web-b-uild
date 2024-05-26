'use server'

import { clerkClient, currentUser } from "@clerk/nextjs/server"
import { db } from "./db"
import { redirect } from "next/navigation"
import { Agency, Lane, Plan, Prisma, Role, SubAccount, Ticket, User } from "@prisma/client"
import { v4 } from "uuid"
import { CreateFunnelFormSchema, CreateMediaType } from "./types"
import { z } from "zod"

export async function getAuthUserDetails() {
    const user = await currentUser()
    if (!user) return

    const userData = await db.user.findUnique({
        where: {
            email: user.emailAddresses[0].emailAddress,
        },
        include: {
            Agency: {
                include: {
                    SidebarOption: true,
                    SubAccount: {
                        include: {
                            SidebarOption: true,
                        }
                    }
                }
            },
            Permissions: true,
        }
    })

    return userData
}

export async function createTeamUser(agencyId: string, user: User) {
    if (user.role === 'AGENCY_OWNER') return null

    const response = await db.user.create({ data: { ...user } })

    return response
}

export async function saveActivityLogsNotification({
    agencyId,
    description,
    subaccountId,
}: {
    agencyId?: string
    description: string
    subaccountId?: string
}) {
    const authUser = await currentUser()
    let userData
    if (!authUser) {
        const response = await db.user.findFirst({
            where: {
                Agency: {
                    SubAccount: {
                        some: { id: subaccountId },
                    },
                },
            },
        })
        if (response) {
            userData = response
        }
    } else {
        userData = await db.user.findUnique({
            where: { email: authUser?.emailAddresses[0].emailAddress },
        })
    }

    if (!userData) {
        console.log('Could not find a user')
        return
    }

    let foundAgencyId = agencyId
    if (!foundAgencyId) {
        if (!subaccountId) {
            throw new Error(
                'You need to provide atleast an agency Id or subaccount Id'
            )
        }
        const response = await db.subAccount.findUnique({
            where: { id: subaccountId },
        })
        if (response) foundAgencyId = response.agencyId
    }
    if (subaccountId) {
        await db.notification.create({
            data: {
                notification: `${userData.name} | ${description}`,
                User: {
                    connect: {
                        id: userData.id,
                    },
                },
                Agency: {
                    connect: {
                        id: foundAgencyId,
                    },
                },
                SubAccount: {
                    connect: { id: subaccountId },
                },
            },
        })
    } else {
        await db.notification.create({
            data: {
                notification: `${userData.name} | ${description}`,
                User: {
                    connect: {
                        id: userData.id,
                    },
                },
                Agency: {
                    connect: {
                        id: foundAgencyId,
                    },
                },
            },
        })
    }
}

export async function verifyAndAcceptInvitation() {
    const user = await currentUser()
    if (!user) return redirect('/sign-in')

    const invitationExists = await db.invitation.findUnique({
        where: {
            email: user.emailAddresses[0].emailAddress,
            status: 'PENDING'
        }
    })

    if (invitationExists) {
        const userDetails = await createTeamUser(invitationExists.agencyId, {
            email: invitationExists.email,
            agencyId: invitationExists.agencyId,
            avatarUrl: user.imageUrl,
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            role: invitationExists.role,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        await saveActivityLogsNotification({
            agencyId: invitationExists?.agencyId,
            description: 'Joined',
            subaccountId: undefined,
        })

        if (userDetails) {
            await clerkClient.users.updateUserMetadata(user.id, {
                privateMetadata: {
                    role: userDetails.role || 'SUBACCOUNT_USER',
                }
            })

            await db.invitation.delete({
                where: { email: userDetails.email },
            })

            return userDetails.agencyId
        } else return null
    } else {
        const agency = await db.user.findUnique({
            where: {
                email: user.emailAddresses[0].emailAddress,
            }
        })

        return agency ? agency.agencyId : null
    }
}

export async function deleteAgency(agencyId: string) {
    const response = await db.agency.delete({
        where: { id: agencyId }
    })

    return response
}

export async function initUser(newUser: Partial<User>) {
    const user = await currentUser()
    if (!user) return

    const userData = await db.user.upsert({
        where: {
            email: user.emailAddresses[0].emailAddress,
        },
        update: newUser,
        create: {
            id: user.id,
            avatarUrl: user.imageUrl,
            email: user.emailAddresses[0].emailAddress,
            name: `${user.firstName} ${user.lastName}`,
            role: newUser.role || 'SUBACCOUNT_USER',
        },
    })

    await clerkClient.users.updateUserMetadata(user.id, {
        privateMetadata: {
            role: newUser.role || 'SUBACCOUNT_USER',
        }
    })

    return userData
}

export async function upsertAgency(agency: Agency, price?: Plan) {
    if (!agency.companyEmail) return null

    try {
        const agencyDetails = await db.agency.upsert({
            where: {
                id: agency.id,
            },
            update: agency,
            create: {
                users: {
                    connect: { email: agency.companyEmail },
                },
                ...agency,
                SidebarOption: {
                    create: [
                        {
                            name: 'Dashboard',
                            icon: 'category',
                            link: `/agency/${agency.id}`,
                        },
                        {
                            name: 'Launchpad',
                            icon: 'clipboardIcon',
                            link: `/agency/${agency.id}/launchpad`,
                        },
                        {
                            name: 'Billing',
                            icon: 'payment',
                            link: `/agency/${agency.id}/billing`,
                        },
                        {
                            name: 'Settings',
                            icon: 'settings',
                            link: `/agency/${agency.id}/settings`,
                        },
                        {
                            name: 'Sub Accounts',
                            icon: 'person',
                            link: `/agency/${agency.id}/all-subaccounts`,
                        },
                        {
                            name: 'Team',
                            icon: 'shield',
                            link: `/agency/${agency.id}/team`,
                        },
                    ],
                },
            },
        })

        return agencyDetails
    } catch (error) {
        console.log('queries -> upsertAgency', error)
    }
}

export async function upsertSubAccount(subAccount: SubAccount) {
    if (!subAccount.companyEmail) return null

    const agencyOwner = await db.user.findFirst({
        where: {
            Agency: {
                id: subAccount.agencyId,
            },
            role: 'AGENCY_OWNER',
        }
    })

    if (!agencyOwner) return console.log('🔴 Could not create subaccount')

    const permissionId = v4()

    const response = await db.subAccount.upsert({
        where: { id: subAccount.id },
        update: subAccount,
        create: {
            ...subAccount,
            Permissions: {
                create: {
                    access: true,
                    email: agencyOwner.email,
                    id: permissionId
                },
                connect: {
                    subAccountId: subAccount.id,
                    id: permissionId
                },
            },
            Pipeline: {
                create: { name: 'Lead Cycle' },
            },
            SidebarOption: {
                create: [
                    {
                        name: 'Launchpad',
                        icon: 'clipboardIcon',
                        link: `/subaccount/${subAccount.id}/launchpad`
                    },
                    {
                        name: 'Settings',
                        icon: 'settings',
                        link: `/subaccount/${subAccount.id}/settings`
                    },
                    {
                        name: 'Funnels',
                        icon: 'pipelines',
                        link: `/subaccount/${subAccount.id}/funnels`
                    },
                    {
                        name: 'Media',
                        icon: 'database',
                        link: `/subaccount/${subAccount.id}/media`
                    },
                    {
                        name: 'Automations',
                        icon: 'chip',
                        link: `/subaccount/${subAccount.id}/automations`
                    },
                    {
                        name: 'Pipelines',
                        icon: 'flag',
                        link: `/subaccount/${subAccount.id}/pipelines`
                    },
                    {
                        name: 'Contacts',
                        icon: 'person',
                        link: `/subaccount/${subAccount.id}/contacts`
                    },
                    {
                        name: 'Dashboard',
                        icon: 'category',
                        link: `/subaccount/${subAccount.id}`
                    },
                ]
            }
        }
    })

    return response
}

export async function getNotificationsAndUser(agencyId: string) {
    try {
        const response = await db.notification.findMany({
            where: { agencyId },
            include: { User: true },
            orderBy: { createdAt: 'desc' }
        })

        return response
    } catch (error) {
        console.log('GETNOTIFICATIONANDUSER', error)
    }
}

export async function getUserPermissions(userId: string) {
    const response = await db.user.findUnique({
        where: { id: userId },
        select: {
            Permissions: {
                include: { SubAccount: true }
            }
        }
    })

    return response
}

export async function changeUserPermissions(
    permissionId: string | undefined,
    userEmail: string,
    subAccountId: string,
    permission: boolean
) {
    const response = await db.permissions.upsert({
        where: { id: permissionId },
        update: { access: permission },
        create: {
            access: permission,
            email: userEmail,
            subAccountId: subAccountId,
        }
    })

    return response
}

export async function updateUser(user: Partial<User>) {
    const response = await db.user.update({
        where: { email: user.email },
        data: { ...user },
    })

    await clerkClient.users.updateUserMetadata(response.id, {
        privateMetadata: {
            role: user.role || 'SUBACCOUNT_USER',
        }
    })

    return response
}

export async function getSubaccountDetails(subaccountId: string) {
    const response = await db.subAccount.findUnique({
        where: {
            id: subaccountId,
        },
    })
    return response
}

export async function deleteSubAccount(subaccountId: string) {
    const response = await db.subAccount.delete({
        where: {
            id: subaccountId,
        },
    })
    return response
}

export async function deleteUser(userId: string) {
    await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
            role: undefined,
        },
    })
    const deletedUser = await db.user.delete({ where: { id: userId } })

    return deletedUser
}

export async function getUser(id: string) {
    const user = await db.user.findUnique({
        where: {
            id,
        },
    })

    return user
}

export async function sendInvitation(
    role: Role,
    email: string,
    agencyId: string
) {
    const resposne = await db.invitation.create({
        data: { email, agencyId, role },
    })

    try {
        const invitation = await clerkClient.invitations.createInvitation({
            emailAddress: email,
            redirectUrl: process.env.NEXT_PUBLIC_URL,
            publicMetadata: {
                throughInvitation: true,
                role,
            },
        })
    } catch (error) {
        console.log(error)
        throw error
    }

    return resposne
}

export async function getMedia(subaccountId: string) {
    const mediafiles = await db.subAccount.findUnique({
        where: {
            id: subaccountId,
        },
        include: { Media: true },
    })

    return mediafiles
}

export async function createMedia(
    subaccountId: string,
    mediaFile: CreateMediaType
) {
    try {
        const existingMedia = await db.media.findUnique({
            where: {
                link: mediaFile.link,
            },
        });

        if (existingMedia) {
            throw new Error(`Media with the link "${mediaFile.link}" already exists.`);
        }
        const response = await db.media.create({
            data: {
                link: mediaFile.link,
                name: mediaFile.name,
                subAccountId: subaccountId,
            },
        })

        return response
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                throw new Error('Unique constraint failed. A media file with the same link already exists.');
            }
        }
        throw error
    }
}

export async function deleteMedia(mediaId: string) {
    const response = await db.media.delete({
        where: {
            id: mediaId,
        },
    })
    return response
}

export async function getPipelineDetails(pipelineId: string) {
    const response = await db.pipeline.findUnique({
        where: {
            id: pipelineId,
        },
    })

    return response
}

export async function getLanesWithTicketAndTags(pipelineId: string) {
    const response = await db.lane.findMany({
        where: {
            pipelineId,
        },
        orderBy: { order: 'asc' },
        include: {
            Tickets: {
                orderBy: {
                    order: 'asc',
                },
                include: {
                    Tags: true,
                    Assigned: true,
                    Customer: true,
                },
            },
        },
    })

    return response
}

export async function upsertPipeline(pipeline: Prisma.PipelineUncheckedCreateWithoutLaneInput) {
    const response = await db.pipeline.upsert({
        where: { id: pipeline.id || v4() },
        update: pipeline,
        create: pipeline,
    })

    return response
}

export async function upsertFunnel(
    subaccountId: string,
    funnel: z.infer<typeof CreateFunnelFormSchema> & { liveProducts: string },
    funnelId: string
) {
    const response = await db.funnel.upsert({
        where: { id: funnelId },
        update: funnel,
        create: {
            ...funnel,
            id: funnelId || v4(),
            subAccountId: subaccountId,
        },
    })

    return response
}

export async function upsertLane(lane: Prisma.LaneUncheckedCreateInput) {
    let order: number

    if (!lane.order) {
        const lanes = await db.lane.findMany({
            where: {
                pipelineId: lane.pipelineId,
            },
        })

        order = lanes.length
    } else {
        order = lane.order
    }

    const response = await db.lane.upsert({
        where: { id: lane.id || v4() },
        update: lane,
        create: { ...lane, order },
    })

    return response
}

export async function getTicketsWithTags(pipelineId: string) {
    const response = await db.ticket.findMany({
        where: {
            Lane: {
                pipelineId,
            },
        },
        include: { Tags: true, Assigned: true, Customer: true },
    })
    return response
}

export async function updateLanesOrder(lanes: Lane[]) {
    try {
        const updateTrans = lanes.map((lane) =>
            db.lane.update({
                where: {
                    id: lane.id,
                },
                data: {
                    order: lane.order,
                },
            })
        )

        await db.$transaction(updateTrans)
        console.log('🟢 Done reordered 🟢')
    } catch (error) {
        console.log(error, 'ERROR UPDATE LANES ORDER')
    }
}

export async function updateTicketsOrder(tickets: Ticket[]) {
    try {
        const updateTrans = tickets.map((ticket) =>
            db.ticket.update({
                where: {
                    id: ticket.id,
                },
                data: {
                    order: ticket.order,
                    laneId: ticket.laneId,
                },
            })
        )

        await db.$transaction(updateTrans)
        console.log('🟢 Done reordered 🟢')
    } catch (error) {
        console.log(error, '🔴 ERROR UPDATE TICKET ORDER')
    }
}

export async function deleteLane(laneId: string) {
    const resposne = await db.lane.delete({
        where:
        {
            id: laneId
        }
    })

    return resposne
}

export async function deletePipeline(pipelineId: string) {
    const response = await db.pipeline.delete({
        where: {
            id: pipelineId,
        }
    })

    return response
}