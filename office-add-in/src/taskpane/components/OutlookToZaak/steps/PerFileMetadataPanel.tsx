/*
 * SPDX-FileCopyrightText: 2025 INFO.nl
 * SPDX-License-Identifier: EUPL-1.2+
 */

import React from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { CommonDocumentFields } from '../../CommonDocumentFields'
import { useZaak } from '../../../../provider/ZaakProvider'
import { documentstatus } from '../../../../hooks/useAddDocumentToZaak'
import { getPerFileValues, setPerFileValues } from '../hooks/usePerFileFormCache'

export function PerFileMetadataPanel({
  fileId,
  onValidityChange,
}: {
  fileId: string
  onValidityChange: (_id: string, _isValid: boolean) => void
}) {
  const { zaak } = useZaak()

  const cached = getPerFileValues(fileId)
  const form = useForm({
    mode: 'onChange',
    defaultValues: cached ?? {
      auteur: '',
      informatieobjecttype: '',
      vertrouwelijkheidaanduiding: 'openbaar',
      creatiedatum: new Date(),
      status: documentstatus.at(0) || '',
    },
  })

  const zio = zaak?.data?.zaakinformatieobjecten || []

  const computeValid = React.useCallback((vals: any) => {
    return !!vals?.auteur && !!vals?.informatieobjecttype && !!vals?.status && !!vals?.creatiedatum
  }, [])

  React.useEffect(() => {
    const initValid = computeValid(form.getValues())
    onValidityChange(fileId, initValid)
    setPerFileValues(fileId, form.getValues())
  }, [fileId])

  React.useEffect(() => {
    const sub = form.watch(() => {
      const vals = form.getValues()
      setPerFileValues(fileId, vals)
      onValidityChange(fileId, computeValid(vals))
    })
    return () => {
      setPerFileValues(fileId, form.getValues())
      sub.unsubscribe?.()
    }
  }, [form, fileId, computeValid, onValidityChange])

  return (
    <FormProvider {...form}>
      <CommonDocumentFields zaakinformatieobjecten={zio} statuses={documentstatus} />
    </FormProvider>
  )
}
