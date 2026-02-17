import { useEffect, useState } from 'react'
import { GoDotFill } from 'react-icons/go'

export default function NotFoundPage() {
  const [imageSize, setImageSize] = useState<number>(0)

  useEffect(() => {
    fetch('/clouds.jpg', { method: 'HEAD' })
      .then((response) => {
        const contentLength = response.headers.get('Content-Length')
        if (contentLength) {
          setImageSize(Number.parseInt(contentLength, 10))
        }
      })
      .catch((error) => {
        console.error('Failed to fetch clouds image size:', error)
      })
  }, [])

  return (
    <div className="selection:bg-select-background selection:text-select-foreground flex h-screen items-center justify-center">
      <div className="crt-filter flex flex-col">
        <div className={`bg-brig relative flex aspect-square h-[512px] flex-col justify-center bg-[url("/clouds_1.jpeg")] bg-contain p-4 text-white brightness-125`}>
          <h1 className="flex items-center text-4xl font-semibold">
            <img src="https://malgow.net/images/Windows%20XP%20Simulator.png" className="mr-2 h-9 w-9" />
            Error 404
          </h1>
          <h4 className="mb-5 text-xl font-semibold">Page cannot be found</h4>
          <p>The page you are looking for may have been deleted, moved, or is temporarily unavailable.</p>
          <p>ページは削除されたか、移動されたか、一時的に利用できない可能性があります。</p>
          <p>Страница, которую вы ищете, могла быть удалена, перемещена или временно недоступна.</p>
          <span className="mt-10 font-semibold">HTTP 404 - Not found</span>
        </div>
        <div className="flex justify-end select-none">
          <div className="font-ibm-mono flex items-center gap-8 px-4 py-1 text-sm text-amber-600 font-stretch-expanded">
            <span className="border border-amber-600 px-0.5">{(imageSize / 1024).toFixed(2)} KB</span>
            <GoDotFill />
            <span>/404_CLOUDS.JPG</span>
          </div>
        </div>
      </div>
    </div>
  )
}
