'use client'

import React from 'react'
import { useToast } from '../ui/use-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { saveActivityLogsNotification, sendInvitation } from '@/lib/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Button } from '../ui/button'
import { Loader } from '../loader'

export default function SendInvitation({ agencyId }: { agencyId: string }) {
    const { toast } = useToast()

    const userDataSchema = z.object({
        email: z.string().email(),
        role: z.enum(['AGENCY_ADMIN', 'SUBACCOUNT_USER', 'SUBACCOUNT_GUEST']),
    })

    const form = useForm<z.infer<typeof userDataSchema>>({
        resolver: zodResolver(userDataSchema),
        mode: 'onChange',
        defaultValues: {
            email: '',
            role: 'SUBACCOUNT_USER',
        },
    })

    async function onSubmit(values: z.infer<typeof userDataSchema>) {
        try {
            const res = await sendInvitation(values.role, values.email, agencyId)

            await saveActivityLogsNotification({
                agencyId: agencyId,
                description: `Invited ${res.email}`,
                subaccountId: undefined,
            })

            toast({
                title: 'Success',
                description: 'Created and sent invitation',
            })
        } catch (error) {
            console.log('send-invitation onSubmit', error)
            toast({
                variant: 'destructive',
                title: 'Oopsies!',
                description: 'Could not send invitation',
            })
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Invitation</CardTitle>
                <CardDescription>
                    An invitation will be sent to the user. Users who have an invitation sent to their email will not receive another.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}
                        className='flex flex-col gap-6'
                    >
                        <FormField name='email'
                            disabled={form.formState.isSubmitting}
                            control={form.control}
                            render={({ field }) => (
                                <FormItem className='flex-1'>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder='email'
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        <FormField name='role'
                            disabled={form.formState.isSubmitting}
                            control={form.control}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel>User role</FormLabel>
                                    <Select onValueChange={(value) => field.onChange(value)}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select user role..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="AGENCY_ADMIN">Agency Admin</SelectItem>
                                            <SelectItem value="SUBACCOUNT_USER">
                                                Sub Account User
                                            </SelectItem>
                                            <SelectItem value="SUBACCOUNT_GUEST">
                                                Sub Account Guest
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        <Button type='submit'
                            disabled={form.formState.isSubmitting}
                        >  
                            {form.formState.isSubmitting ? <Loader /> : 'Send Invitation'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
