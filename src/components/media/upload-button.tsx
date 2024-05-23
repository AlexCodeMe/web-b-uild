'use client'

import { useModal } from '@/providers/modal-provider'
import React from 'react'
import { Button } from '../ui/button'
import CustomModal from '../custom-modal'
import UploadMediaForm from '../forms/upload-media'

export default function MediaUploadButton({ subaccountId }: {
    subaccountId: string
}) {
    const { isOpen, setOpen, setClose } = useModal()
    
  return (
    <Button onClick={() => {
      setOpen(
        <CustomModal title='Upload Media'
          subheading='Upload a file to your media bucket'
        >
          <UploadMediaForm subaccountId={subaccountId} />
        </CustomModal>
      )
    }}>
      Upload
    </Button>
  )
}
