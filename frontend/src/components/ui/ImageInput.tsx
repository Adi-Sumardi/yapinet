import { useRef, useState, type ReactNode } from 'react'
import { api } from '../../lib/api'
import { UploadIcon, XIcon } from '../icons'
import Button from './Button'
import { useToast } from './Toast'

/** Upload gambar (PNG/JPG/WEBP ≤ 512 KB) ke /api/admin/uploads/image. */
export default function ImageInput({
  label,
  value,
  onChange,
  hint,
  error,
}: {
  label?: ReactNode
  value: string | null
  onChange: (url: string | null) => void
  hint?: ReactNode
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const toast = useToast()

  const upload = async (file: File) => {
    setUploading(true)
    try {
      onChange(await api.admin.uploadImage(file))
      toast.success('Gambar diunggah')
    } catch (e) {
      toast.error('Gagal mengunggah gambar', { description: e instanceof Error ? e.message : undefined })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      {label && <p className="mb-1.5 text-xs font-semibold text-ink-soft">{label}</p>}
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line-soft bg-surface-soft">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <UploadIcon className="text-ink-faint" />
          )}
        </div>
        <Button variant="secondary" size="sm" loading={uploading} onClick={() => inputRef.current?.click()}>
          {value ? 'Ganti gambar' : 'Unggah gambar'}
        </Button>
        {value && (
          <Button variant="ghost" size="sm" icon={<XIcon size={14} />} onClick={() => onChange(null)}>
            Hapus
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])}
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-crit">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>
      )}
    </div>
  )
}
