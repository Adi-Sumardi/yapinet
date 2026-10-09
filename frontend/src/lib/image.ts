/**
 * Perkecil gambar di browser sebelum diunggah (logo/ikon tidak butuh resolusi
 * besar). Sisi terpanjang maks `maxSize` px, disimpan sebagai WEBP (atau PNG
 * bila browser tidak bisa encode WEBP, mis. Safari). Transparansi tetap terjaga.
 */
export async function shrinkImage(file: File, maxSize = 512): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))

  // Sudah kecil — tidak perlu diproses ulang.
  if (scale === 1 && file.size <= 300 * 1024) {
    bitmap.close()
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9))
  if (!blob) return file

  const ext = blob.type === 'image/webp' ? 'webp' : 'png'
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.${ext}`, { type: blob.type })
}
