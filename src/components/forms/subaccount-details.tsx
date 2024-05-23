'use client'

import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { v4 } from 'uuid'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Agency, SubAccount } from '@prisma/client'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { useToast } from '../ui/use-toast'
import { Input } from '../ui/input'
import FileUpload from '../file-upload'
import { Switch } from '../ui/switch'
import { Button } from '../ui/button'
import { Loader } from '../loader'
import { deleteAgency, initUser, saveActivityLogsNotification, upsertAgency, upsertSubAccount } from '@/lib/queries'
import { useModal } from '@/providers/modal-provider'

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

type Props = {
    //TODO: add the sub account to the agency
    agencyDetails: Agency
    details?: Partial<SubAccount>
    userId: string
    userName: string
}

export default function SubAccountDetails({
    agencyDetails,
    details,
    userId,
    userName
}: Props) {
    const { toast } = useToast()
    const { setClose } = useModal()
    const router = useRouter()

    const form = useForm<z.infer<typeof FormSchema>>({
        mode: 'onChange',
        resolver: zodResolver(FormSchema),
        defaultValues: {
            name: details?.name,
            companyEmail: details?.companyEmail,
            companyPhone: details?.companyPhone,
            address: details?.address,
            city: details?.city,
            zipCode: details?.zipCode,
            state: details?.state,
            country: details?.country,
            subAccountLogo: details?.subAccountLogo,
        }
    })

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        try {
            const response = await upsertSubAccount({
                id: details?.id ? details.id : v4(),
                address: values.address,
                subAccountLogo: values.subAccountLogo,
                city: values.city,
                companyPhone: values.companyPhone,
                country: values.country,
                name: values.name,
                state: values.state,
                zipCode: values.zipCode,
                createdAt: new Date(),
                updatedAt: new Date(),
                companyEmail: values.companyEmail,
                agencyId: agencyDetails.id,
                connectAccountId: '',
                goal: 5000,
            })

            if (!response) throw new Error('No response from server')

            await saveActivityLogsNotification({
                agencyId: response.agencyId,
                description: `${userName} | updated sub account | ${response.name}`,
                subaccountId: response.id
            })

            toast({
                title: 'Subaccount details saved',
                description: 'subaccount details saved successfully.',
            })

            setClose()
            router.refresh()
        } catch (error) {
            console.log('subaccount-details handleSubmit', error)
            toast({
                variant: 'destructive',
                title: 'Oopsies!',
                description: 'Could not save your sub account'
            })
        }
    }

    useEffect(() => {
        if (details) form.reset(details)
    }, [])

    const isLoading = form.formState.isSubmitting

    return (
        <Card className='w-full'>
            <CardHeader>
                <CardTitle>Sub Account Information</CardTitle>
                <CardDescription>
                    Please enter your business details
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}
                        className='space-y-4'>
                        <FormField name='subAccountLogo'
                            control={form.control} disabled={isLoading}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Account Logo</FormLabel>
                                    <FormControl>
                                        <FileUpload apiEndpoint="subaccountLogo"
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
                                        <FormLabel>Account Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder='Your sub account name' />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            <FormField name='companyEmail'
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className='flex-1'>
                                        <FormLabel>Account Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder='Your sub account email' />
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
                                        <FormLabel>Account Phone</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder='Your sub account phone' />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                        </div>

                        <FormField name='address'
                            control={form.control} disabled={isLoading}
                            render={({ field }) => (
                                <FormItem className='flex-1'>
                                    <FormLabel>Address</FormLabel>
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
                        <Button type='submit' disabled={isLoading}>
                            {isLoading ? <Loader /> : 'Save Sub Account Info'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
