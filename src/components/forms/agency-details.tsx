'use client'

import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { v4 } from 'uuid'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Agency } from '@prisma/client'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { useToast } from '../ui/use-toast'
import { Input } from '../ui/input'
import FileUpload from '../file-upload'
import { Switch } from '../ui/switch'
import { Button } from '../ui/button'
import { Loader } from '../loader'
import { deleteAgency, initUser, upsertAgency } from '@/lib/queries'

const FormSchema = z.object({
    name: z.string().min(2, { message: 'Agency name must be atleast 2 chars.' }),
    companyEmail: z.string().min(1),
    companyPhone: z.string().min(1),
    whiteLabel: z.boolean(),
    address: z.string().min(1),
    city: z.string().min(1),
    zipCode: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
    agencyLogo: z.string().min(1),
})

export default function AgencyDetails({ data }: { data?: Partial<Agency> }) {
    const { toast } = useToast()
    const router = useRouter()

    const [deletingAgency, setDeletingAgency] = useState(false)

    const form = useForm<z.infer<typeof FormSchema>>({
        mode: 'onChange',
        resolver: zodResolver(FormSchema),
        defaultValues: {
            name: data?.name,
            companyEmail: data?.companyEmail,
            companyPhone: data?.companyPhone,
            whiteLabel: data?.whiteLabel || false,
            address: data?.address,
            city: data?.city,
            zipCode: data?.zipCode,
            state: data?.state,
            country: data?.country,
            agencyLogo: data?.agencyLogo,
        }
    })

    const isLoading = form.formState.isSubmitting

    useEffect(() => {
        if (data) form.reset(data)
    }, [data])

    async function handleSubmit(values: z.infer<typeof FormSchema>) {
        try {
            let newUserData
            let custId

            if (!data?.id) {
                const bodyData = {
                    email: values.companyEmail,
                    name: values.name,
                    shipping: {
                        address: {
                            city: values.city,
                            country: values.country,
                            line1: values.address,
                            postal_code: values.zipCode,
                            state: values.zipCode,
                        },
                        name: values.name,
                    },
                    address: {
                        city: values.city,
                        country: values.country,
                        line1: values.address,
                        postal_code: values.zipCode,
                        state: values.zipCode,
                    },
                }
            }

            newUserData = await initUser({ role: 'AGENCY_OWNER' })

            // if (!data?.id) return

            const response = await upsertAgency({
                id: data?.id ? data.id : v4(),
                customerId: data?.customerId || '',
                address: values.address,
                agencyLogo: values.agencyLogo,
                city: values.city,
                companyPhone: values.companyPhone,
                country: values.country,
                name: values.name,
                state: values.state,
                whiteLabel: values.whiteLabel,
                zipCode: values.zipCode,
                createdAt: new Date(),
                updatedAt: new Date(),
                companyEmail: values.companyEmail,
                connectAccountId: '',
                goal: 5,
            })


            toast({ title: 'Created Agency' })

            // if (data?.id) return router.refresh()

            if (response) return router.refresh()
        } catch (error) {
            console.log('agency-details handleSubmit', error)
            toast({
                variant: 'destructive',
                title: 'Oopsies!',
                description: 'Could not create your agency'
            })
        }
    }

    async function handleDeleteAgency() {
        if (!data?.id) return

        setDeletingAgency(true)
        //TODO: Discontinue Subscription
        try {
            const response = await deleteAgency(data.id)

            toast({
                title: 'Deleted agency',
                description: 'Deleted your agency and all subaccounts',
            })
        } catch (error) {
            console.log(error)
            toast({
                variant: 'destructive',
                title: 'Oopsies!',
                description: 'could not delete your agency',
            })
        }
    }

    return (
        <AlertDialog>
            <Card className='w-full'>
                <CardHeader>
                    <CardTitle>Agency Information</CardTitle>
                    <CardDescription>
                        Let&apos;s create an agency for your business. You can edit settings later from the agency settings tab.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)}
                            className='space-y-4'>
                            <FormField name='agencyLogo'
                                control={form.control} disabled={isLoading}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Agency Logo</FormLabel>
                                        <FormControl>
                                            <FileUpload apiEndpoint="agencyLogo"
                                                onChange={field.onChange}
                                                value={field.value} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            <div className='flex md:flex-row gap-4'>
                                <FormField name='name'
                                    control={form.control} disabled={isLoading}
                                    render={({ field }) => (
                                        <FormItem className='flex-1'>
                                            <FormLabel>Agency Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder='Your agency name' />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                <FormField name='companyEmail'
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem className='flex-1'>
                                            <FormLabel>Agency Email</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder='Your agency email' />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                            </div>
                            <div className="flex md:flex-row gap-4">
                                <FormField name='companyPhone'
                                    control={form.control} disabled={isLoading}
                                    render={({ field }) => (
                                        <FormItem className='flex-1'>
                                            <FormLabel>Agency Phone</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder='Your agency phone' />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                            </div>

                            <FormField name='whiteLabel'
                                control={form.control} disabled={isLoading}
                                render={({ field }) => (
                                    <FormItem className='flex-1'>
                                        <div>
                                            <FormLabel>Whitelabel Agency</FormLabel>
                                            <FormDescription>
                                                Turning on whilelabel mode will show your agency logo
                                                to all sub accounts by default. You can overwrite this
                                                functionality through sub account settings.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value}
                                                onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            <FormField name='address'
                                control={form.control} disabled={isLoading}
                                render={({ field }) => (
                                    <FormItem className='flex-1'>
                                        <FormLabel>Agency Address</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder='123 S. Street...' />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            <div className='flex md:flex-row gap-4'>
                                <FormField name='city'
                                    control={form.control} disabled={isLoading}
                                    render={({ field }) => (
                                        <FormItem className='flex-1'>
                                            <FormLabel>City</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder='City' />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                <FormField name='state'
                                    control={form.control} disabled={isLoading}
                                    render={({ field }) => (
                                        <FormItem className='flex-1'>
                                            <FormLabel>State</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder='State' />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                <FormField name='zipCode'
                                    control={form.control} disabled={isLoading}
                                    render={({ field }) => (
                                        <FormItem className='flex-1'>
                                            <FormLabel>Zipcode</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder='zipcode' />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                            </div>
                            <FormField name='country'
                                control={form.control} disabled={isLoading}
                                render={({ field }) => (
                                    <FormItem className='flex-1'>
                                        <FormLabel>Country</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder='Country' />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            {data?.id && (
                                <div className='flex flex-col gap-2'>
                                    <FormLabel>Make a Goal</FormLabel>
                                    <FormDescription>
                                        ✨ Make a goal for your agency. As your business grows, your goals grow, too!<br />
                                        Set the bar higher! 🚀
                                    </FormDescription>
                                    <p>NumberInput</p>
                                </div>
                            )}
                            <Button type='submit' disabled={isLoading}>
                                {isLoading ? <Loader /> : 'Save Agency Info'}
                            </Button>
                        </form>
                    </Form>

                    {data?.id && (
                        <div className="flex flex-row items-center justify-between rounded-lg border border-destructive gap-4 p-4 mt-4">
                            <div>
                                <div>Danger Zone</div>
                            </div>
                            <div className="text-muted-foreground">
                                Deleting your agency cannpt be undone. This will also delete all
                                sub accounts and all data related to your sub accounts. Sub
                                accounts will no longer have access to funnels, contacts etc.
                            </div>
                            <AlertDialogTrigger
                                disabled={isLoading || deletingAgency}
                                className="text-red-600 p-2 text-center mt-2 rounded-md hove:bg-red-600 hover:text-white whitespace-nowrap border border-white px-2"
                            >
                                {deletingAgency ? 'Deleting...' : 'Delete Agency'}
                            </AlertDialogTrigger>
                        </div>
                    )}
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className='text-left'>
                                Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription className='text-left'>
                                This action cannot be undone. This will permanently delete the
                                Agency account and all related sub accounts.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className='flex items-center'>
                            <AlertDialogCancel className='mb-2'>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={() => { }}
                                disabled={deletingAgency}
                                className='bg-destructive hover:bg-destructive/80'>
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </CardContent>
            </Card>
        </AlertDialog>
    )
}
