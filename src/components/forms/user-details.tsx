'use client'

import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { v4 } from 'uuid'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Agency, SubAccount, User } from '@prisma/client'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { useToast } from '../ui/use-toast'
import { Input } from '../ui/input'
import FileUpload from '../file-upload'
import { Switch } from '../ui/switch'
import { Button } from '../ui/button'
import { Loader } from '../loader'
import { changeUserPermissions, deleteAgency, getAuthUserDetails, getUserPermissions, initUser, saveActivityLogsNotification, updateUser, upsertAgency, upsertSubAccount } from '@/lib/queries'
import { useModal } from '@/providers/modal-provider'
import { AuthUserWithAgencySigebarOptionsSubAccounts, UserWithPermissionsAndSubAccounts } from '@/lib/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Separator } from '../ui/separator'

const FormSchema = z.object({
    name: z.string(),
    companyEmail: z.string().min(1),
    companyPhone: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    zipCode: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
    subAccountLogo: z.string(),
})

const userDataSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    avatarUrl: z.string(),
    role: z.enum([
        'AGENCY_OWNER',
        'AGENCY_ADMIN',
        'SUBACCOUNT_USER',
        'SUBACCOUNT_GUEST',
    ])
})

type Props = {
    //TODO: add the sub account to the agency
    id: string | null
    type: 'agency' | 'subaccount'
    userData?: Partial<User>
    subAccounts?: SubAccount[]
}

export default function UserDetails({
    id,
    type,
    userData,
    subAccounts
}: Props) {
    const router = useRouter()
    const { toast } = useToast()
    const { data, setClose } = useModal()

    const [roleState, setRoleState] = useState('')
    const [loadingPermissions, setLoadingPermissions] = useState(false)
    const [subAccountPermissions, setSubAccountPermissions] =
        useState<UserWithPermissionsAndSubAccounts | null>(null)
    const [authUserData, setAuthUserData] = useState<AuthUserWithAgencySigebarOptionsSubAccounts | null>(null)

    useEffect(() => {
        if (data.user) {
            const fetchDetails = async () => {
                const response = await getAuthUserDetails()
                if (response) setAuthUserData(response)
            }
            fetchDetails()
        }
    }, [data])

    const form = useForm<z.infer<typeof userDataSchema>>({
        mode: 'onChange',
        resolver: zodResolver(userDataSchema),
        defaultValues: {
            name: userData ? userData.name : data?.user?.name,
            email: userData ? userData.email : data?.user?.email,
            avatarUrl: userData ? userData.avatarUrl : data?.user?.avatarUrl,
            role: userData ? userData.role : data?.user?.role,
        }
    })

    useEffect(() => {
        if (!data.user) return

        const getPermissions = async () => {
            if (!data.user) return

            const permission = await getUserPermissions(data.user.id)

            setSubAccountPermissions(permission)
        }

        getPermissions()
    }, [data, form])

    useEffect(() => {
        if (data.user) form.reset(data.user)
        if (userData) form.reset(userData)
    }, [userData, data])

    async function onChangePermission(
        subAccountId: string,
        val: boolean,
        permissionId: string | undefined
    ) {
        if (!data.user?.email) return

        setLoadingPermissions(true)

        const response = await changeUserPermissions(
            permissionId ? permissionId : v4(),
            data.user.email,
            subAccountId,
            val
        )

        if (type === 'agency') {
            await saveActivityLogsNotification({
                agencyId: authUserData?.Agency?.id,
                description: `Gave ${userData?.name} access to |
                    ${subAccountPermissions?.Permissions.find(
                    p => p.subAccountId === subAccountId
                )?.SubAccount.name}`,
                subaccountId: subAccountPermissions?.Permissions.find(
                    p => p.subAccountId === subAccountId
                )?.SubAccount.id
            })
        }

        if (response) {
            toast({
                title: 'Success',
                description: 'The request was successfull'
            })

            if (subAccountPermissions) {
                subAccountPermissions.Permissions.find((p) => {
                    if (p.subAccountId === subAccountId) {
                        return { ...p, access: !p.access }
                    }

                    return p
                })
            }
        } else {
            toast({
                variant: 'destructive',
                title: 'Failed',
                description: 'Could not update permissions',
            })
        }

        router.refresh()
        setLoadingPermissions(false)
    }

    async function onSubmit(values: z.infer<typeof userDataSchema>) {
        if (!id) return

        if (userData || data?.user) {
            const updatedUser = await updateUser(values)

            authUserData?.Agency?.SubAccount.filter((subacc) => {
                authUserData.Permissions.find((p) => {
                    p.subAccountId === subacc.id && p.access
                })
            }).forEach(async (subaccount) => {
                await saveActivityLogsNotification({
                    agencyId: undefined,
                    description: `Updated ${userData?.name} information`,
                    subaccountId: subaccount.id,
                })
            })

            if (updatedUser) {
                toast({
                    title: 'Success',
                    description: 'Update User Information',
                })

                setClose()
                router.refresh()
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Oopsies!',
                    description: 'Failed to update user information'
                })
            }
        } else {
            console.log('[user-details] onSubmit: Error')
        }
    }

    const isLoading = form.formState.isSubmitting

    return (
        <Card className='w-full'>
            <CardHeader>
                <CardTitle>User Details</CardTitle>
                <CardDescription>
                    Add or update your information
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}
                        className='space-y-4'>
                        <FormField name='avatarUrl'
                            control={form.control} disabled={isLoading}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Profile Picture</FormLabel>
                                    <FormControl>
                                        <FileUpload apiEndpoint="avatar"
                                            onChange={field.onChange}
                                            value={field.value} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        <FormField name='name'
                            control={form.control} disabled={isLoading}
                            render={({ field }) => (
                                <FormItem className='flex-1'>
                                    <FormLabel>User Full Name</FormLabel>
                                    <FormControl>
                                        <Input required {...field} placeholder='Full name' />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        <FormField name='email'
                            control={form.control}
                            render={({ field }) => (
                                <FormItem className='flex-1'>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder='Your email'
                                            readOnly={
                                                userData?.role === 'AGENCY_OWNER' || isLoading
                                            } />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                        <FormField name='role'
                            control={form.control} disabled={isLoading}
                            render={({ field }) => (
                                <FormItem className='flex-1'>
                                    <FormLabel>User Role</FormLabel>
                                    <Select disabled={field.value === 'AGENCY_OWNER'}
                                        defaultValue={field.value}
                                        onValueChange={(value) => {
                                            if (value === 'SUBACCOUNT_USER' || value === 'SUBACCOUNT_GUEST') {
                                                setRoleState('You need subaccounts in order to assign team members access')
                                            } else {
                                                setRoleState('')
                                            }
                                            field.onChange(value)
                                        }}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder='Select user role...' />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value='AGENCY_ADMIN'>
                                                Agency Admin
                                            </SelectItem>
                                            {(data?.user?.role === 'AGENCY_OWNER' || userData?.role === 'AGENCY_OWNER') && (
                                                <SelectItem value='AGENCY_OWNER'>
                                                    Agency Owner
                                                </SelectItem>
                                            )}
                                            <SelectItem value='SUBACCOUNT_USER'>
                                                Sub Account User
                                            </SelectItem>
                                            <SelectItem value='SUBACCOUNT_GUEST'>
                                                Sub Account Guest
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className='text-muted-foreground'>{roleState}</p>
                                </FormItem>
                            )} />
                        <Button type='submit' disabled={isLoading}>
                            {isLoading ? <Loader /> : 'Save User Details'}
                        </Button>
                        {authUserData?.role === 'AGENCY_OWNER' && (
                            <>
                                <Separator className='my-4' />
                                <FormLabel>User Permissions</FormLabel>
                                <FormDescription className='mb-4'>
                                    You can give Sub Account access to team member by turning on
                                    access control for each Sub Account. This is only visible to
                                    agency owners
                                </FormDescription>
                                <div className='flex flex-col gap-4'>
                                    {subAccounts?.map((subacc) => {
                                        const subAccountPermissionsDetails =
                                            subAccountPermissions?.Permissions.find((p) => {
                                                p.subAccountId === subacc.id
                                            })

                                        return (
                                            <div className='flex items-center justify-between rounded-lg border p-4'
                                                key={subacc.id}>
                                                <div>
                                                    <p>{subacc.name}</p>
                                                </div>
                                                <Switch disabled={loadingPermissions}
                                                    checked={subAccountPermissionsDetails?.access}
                                                    onCheckedChange={(permission) => {
                                                        onChangePermission(
                                                            subacc.id,
                                                            permission,
                                                            subAccountPermissionsDetails?.id
                                                        )
                                                    }} />
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
