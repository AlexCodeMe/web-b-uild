'use client'

import { Agency, AgencySidebarOption, SubAccount, SubAccountSidebarOption } from '@prisma/client'
import React, { useEffect, useMemo, useState } from 'react'
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '../ui/sheet'
import { Button } from '../ui/button'
import { ChevronsUpDown, Compass, Menu, PlusCircleIcon } from 'lucide-react'
import clsx from 'clsx'
import { AspectRatio } from '../ui/aspect-ratio'
import Image from 'next/image'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command'
import Link from 'next/link'
import { Separator } from '../ui/separator'
import { icons } from '@/lib/constants'
import { useModal } from '@/providers/modal-provider'
import CustomModal from '../custom-modal'
import SubAccountDetails from '../forms/subaccount-details'

type Props = {
    defaultOpen?: boolean
    subAccounts: SubAccount[]
    sidebarOpt: AgencySidebarOption[] | SubAccountSidebarOption[]
    sidebarLogo: string
    details: any
    user: any
    id: string
}

export default function MenuOptions({
    details,
    id,
    sidebarLogo,
    sidebarOpt,
    subAccounts,
    user,
    defaultOpen,
}: Props) {
    const { setOpen } = useModal()

    const [isMounted, setIsMounted] = useState(false)

    const openState = useMemo(() => (
        defaultOpen ? { open: true } : {}
    ), [defaultOpen])

    useEffect(() => { setIsMounted(true) }, [])

    return isMounted ? (
        <Sheet {...openState} modal={false}>
            <SheetTrigger asChild className='absolute left-4 top-4 z-[100] md:!hidden flex'>
                <Button variant='outline' size='icon'>
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent showX={!defaultOpen} side='left'
                className={clsx(
                    'bg-background/80 backdrop-blur-xl fixed top-0 border-r-[1px] p-6',
                    defaultOpen ? 'hidden md:inline-block z-0 w-[300px]'
                        : 'inline-block md:hidden z-[100] w-full'
                )}>
                <div>
                    <AspectRatio ratio={16 / 5}>
                        <Image src={sidebarLogo} alt='logo'
                            fill className='rounded-md object-contain' />
                    </AspectRatio>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant='ghost'
                                className='w-full my-4 flex items-center justify-between py-8'>
                                <div className='flex items-center text-left gap-2'>
                                    <Compass />
                                    <div className='flex flex-col'>
                                        {details.name}
                                        <span className='text-muted-foreground'>
                                            {details.address}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <ChevronsUpDown size={16} className='text-muted-foreground' />
                                </div>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className='size-80 mt-4 z-[200]'>
                            <Command className='rounded-lg'>
                                <CommandInput placeholder='Search accounts...' />
                                <CommandList className='pb-16'>
                                    <CommandEmpty>No results found</CommandEmpty>
                                    {(user?.role === 'AGENCY_OWNER' || user?.role === 'AGENCY_ADMIN') && (
                                        <CommandGroup heading='Agency'>
                                            <CommandItem className=''>
                                                {defaultOpen ? (
                                                    <Link href={`/agency/${user?.Agency?.id}`}
                                                        className='flex gap-4 size-full'>
                                                        <div className='relative w-16'>
                                                            <Image src={user?.Agency?.agencyLogo} alt='logo'
                                                                fill className='rounded-md object-contain' />
                                                        </div>
                                                        <div className='flex flex-col flex-1'>
                                                            {user?.Agency?.name}
                                                            <span className='text-muted-foreground'>
                                                                {user?.Agency?.address}
                                                            </span>
                                                        </div>
                                                    </Link>
                                                ) : (
                                                    <SheetClose asChild>
                                                        <Link href={`/agency/${user?.Agency?.id}`}
                                                            className='flex gap-4 size-full'>
                                                            <div className='relative w-16'>
                                                                <Image src={user?.Agency?.agencyLogo} alt='logo'
                                                                    fill className='rounded-md object-contain' />
                                                            </div>
                                                            <div className='flex flex-col flex-1'>
                                                                {user?.Agency?.name}
                                                                <span className='text-muted-foreground'>
                                                                    {user?.Agency?.address}
                                                                </span>
                                                            </div>
                                                        </Link>
                                                    </SheetClose>
                                                )}
                                            </CommandItem>
                                        </CommandGroup>
                                    )}
                                    <CommandGroup heading='Accounts'>
                                        {!!subAccounts ? subAccounts.map((subaccount) => (
                                            <CommandItem key={subaccount.id}>
                                                {defaultOpen ? (
                                                    <Link href={`/subaccount/${subaccount.id}`}>
                                                        <div className='relative w-16'>
                                                            <Image src={subaccount.subAccountLogo}
                                                                alt='logo'
                                                                className='rounded-md object-contain'
                                                                fill />
                                                        </div>
                                                        <div className='flex flex-col flex-1'>
                                                            {subaccount.name}
                                                            <span className='text-muted-foreground'>
                                                                {subaccount.address}
                                                            </span>
                                                        </div>
                                                    </Link>
                                                ) : (
                                                    <SheetClose asChild>
                                                        <Link href={`/subaccount/${subaccount.id}`}
                                                            className='flex gap-4 size-full'>
                                                            <div className='relative w-16'>
                                                                <Image src={subaccount.subAccountLogo}
                                                                    alt='logo'
                                                                    className='rounded-md object-contain'
                                                                    fill />
                                                            </div>
                                                            <div className='flex flex-col flex-1'>
                                                                {subaccount.name}
                                                                <span className='text-muted-foreground'>
                                                                    {subaccount.address}
                                                                </span>
                                                            </div>
                                                        </Link>
                                                    </SheetClose>
                                                )}
                                            </CommandItem>
                                        )) : 'No Accounts'}
                                    </CommandGroup>
                                </CommandList>
                                {(user?.role === 'AGENCY_OWNER' || user?.role === 'AGENCY_ADMIN') && (
                                    <SheetClose>
                                        <Button className='w-full flex gap-2'
                                            onClick={() => {
                                                setOpen(
                                                    <CustomModal title='Create a subaccount'
                                                        subheading='You may switch from agency account to subaccount from the sidebar'>
                                                        <SubAccountDetails agencyDetails={user?.Agency as Agency}
                                                            userId={user?.id as string}
                                                            userName={user?.name}
                                                        />
                                                    </CustomModal>
                                                )
                                            }}>
                                            <PlusCircleIcon size={15} />
                                            Create a Sub Account
                                        </Button>
                                    </SheetClose>
                                )}
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <p className='text-muted-foreground text-xs mb-2'>
                        Menu Links
                    </p>
                    <Separator className='mb-4' />
                    <nav className='relative'>
                        <Command className='rounded-lg overflow-visible bg-transparent'>
                            <CommandInput placeholder='Search...' />
                            <CommandList className='py-4 overflow-visible'>
                                <CommandEmpty>No results found</CommandEmpty>
                                <CommandGroup className='overflow-visible'>
                                    {sidebarOpt.map((options) => {
                                        let val
                                        const result = icons.find((icon) => icon.value === options.icon)

                                        if (result) val = <result.path />

                                        return (
                                            <CommandItem key={options.id}
                                                className='md:w-[320px] w-full'>
                                                <Link href={options.link}
                                                    className='flex items-center gap-2 hover:bg-transparent rounded-md transition-all md:w-full w-[320px]'>
                                                    {val}
                                                    <span>{options.name}</span>
                                                </Link>
                                            </CommandItem>
                                        )
                                    })}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </nav>
                </div>
            </SheetContent>
        </Sheet>
    ) : null
}