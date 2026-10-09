import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '../../lib/api'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Input, Switch } from '../../components/ui/Field'
import { useToast } from '../../components/ui/Toast'
import { adminUserKeys } from './useAdminUsers'

export default function AddUserModal({ onClose }: { onClose: () => void }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const queryClient = useQueryClient()
  const toast = useToast()

  const create = useMutation({
    mutationFn: () =>
      api.admin.createUser({ full_name: fullName.trim(), primary_email: email.trim(), is_admin: isAdmin }),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.all })
      toast.success('Pengguna ditambahkan', {
        description: `${user.full_name} sekarang bisa masuk dengan Google (${user.primary_email}).`,
      })
      onClose()
    },
  })

  const fieldError = (name: string) => (create.error instanceof ApiError ? create.error.field(name) : undefined)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate()
  }

  return (
    <Modal
      title="Tambah pengguna"
      description="Pengguna hanya bisa masuk dengan akun Google yang emailnya sama persis."
      onClose={onClose}
    >
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Nama lengkap"
          required
          autoFocus
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={fieldError('full_name')}
        />
        <Input
          label="Email Google"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@gmail.com"
          error={fieldError('primary_email')}
        />
        <Switch
          checked={isAdmin}
          onChange={setIsAdmin}
          label="Jadikan Admin"
          description="Admin bisa mengelola menu, pengguna, dan pengaturan, serta melihat semua menu."
        />
        {create.error && !(create.error instanceof ApiError && create.error.status === 422) && (
          <p className="rounded-xl bg-crit-soft px-3.5 py-2.5 text-sm text-crit">{create.error.message}</p>
        )}
        <div className="mt-2 flex justify-end gap-2.5">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" loading={create.isPending}>
            Tambah pengguna
          </Button>
        </div>
      </form>
    </Modal>
  )
}
