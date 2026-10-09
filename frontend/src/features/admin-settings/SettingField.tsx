import type { SettingItem } from '../../lib/types'
import ColorInput from '../../components/ui/ColorInput'
import ImageInput from '../../components/ui/ImageInput'
import { Input, Select, Switch, Textarea } from '../../components/ui/Field'

/** Memilih input sesuai `type` definisi pengaturan (config/settings.php). */
export default function SettingField({
  item,
  value,
  error,
  onChange,
}: {
  item: SettingItem
  value: unknown
  error?: string
  onChange: (value: unknown) => void
}) {
  switch (item.type) {
    case 'bool':
      return <Switch checked={Boolean(value)} onChange={onChange} label={item.label} />
    case 'text':
      return (
        <Textarea
          label={item.label}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      )
    case 'int':
      return (
        <Input
          label={item.label}
          type="number"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          error={error}
          wrapperClassName="max-w-[220px]"
        />
      )
    case 'color':
      return <ColorInput label={item.label} value={String(value ?? '')} onChange={onChange} error={error} />
    case 'image':
      return (
        <ImageInput
          label={item.label}
          value={(value as string | null) ?? null}
          onChange={onChange}
          error={error}
          hint="Kosongkan untuk memakai logo bawaan."
        />
      )
    case 'enum':
      return (
        <Select
          label={item.label}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          options={Object.entries(item.options ?? {}).map(([v, label]) => ({ value: v, label }))}
          error={error}
          wrapperClassName="max-w-[260px]"
        />
      )
    default:
      return (
        <Input
          label={item.label}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          error={error}
        />
      )
  }
}
