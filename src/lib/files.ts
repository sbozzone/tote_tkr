export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Could not read file'))
    }

    reader.onerror = () => {
      reject(new Error('Could not read file'))
    }

    reader.readAsDataURL(file)
  })
}
