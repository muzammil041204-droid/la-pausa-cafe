// Shrinks a photo picked on the phone to a light WebP (keeps transparency)
// so the menu stays fast on mobile data.
export async function compressImage(file, max = 900, quality = 0.82) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/webp', quality))
  if (!blob) throw new Error('Could not read this image. Try a JPG or PNG.')
  return blob
}
