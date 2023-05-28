import * as React from 'react'

export default function App() {
  const [authenticated, setAuthenticated] = React.useState<string | false>(false)
  const [loading, setLoading] = React.useState(false)
  const [uploads, setUploads] = React.useState<any[]>([])

  React.useEffect(() => {
    ;(async () => {
      const { data } = await fetch(import.meta.env.VITE_SERVER_URL, {
        credentials: 'include',
      }).then((res) => res.json())
      if (!data) {
        return setAuthenticated(false)
      }
      setAuthenticated(data.displayName)
      setUploads([...data.uploads])
    })()
  }, [])

  const handleFileUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    event.currentTarget.reset()
    const { data } = await fetch(`${import.meta.env.VITE_SERVER_URL}/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then((res) => res.json())
    if (data) {
      setUploads([...uploads, data])
    }
    setLoading(false)
  }

  return (
    <>
      {authenticated ? (
        <>
          <nav className="mb-4 flex justify-between">
            <header className="flex-1 rounded-full bg-blue-100 px-4 py-2">{authenticated}</header>
            <button className="rounded-full bg-black px-4 py-2 text-white outline-offset-4 outline-black">
              Sign Out
            </button>
          </nav>
          <form onSubmit={handleFileUpload}>
            <input
              type="file"
              name="file"
              className="w-full rounded-full shadow-[inset_0_0_0_1px_black] file:mr-4 file:rounded-full file:border-none file:bg-black file:px-4 file:py-2 file:text-white"
              required
              disabled={loading}
            />
            <button
              type="submit"
              className="w-full rounded-full bg-indigo-600 px-4 py-2 text-white"
              disabled={loading}
            >
              Upload
            </button>
          </form>
          <ul className="mt-4">
            {uploads.map((upload, idx) => (
              <li key={idx} className="rounded-full bg-slate-100 hover:bg-yellow-200">
                <a
                  className="flex justify-between rounded-full px-4 py-2"
                  href={`${import.meta.env.VITE_SERVER_URL}/download/${upload.fileId}`}
                  target="_blank"
                >
                  <span>{upload.fileName}</span>
                  <span>{(upload.fileSize / 1000000).toFixed(2)} MB</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <form action={`${import.meta.env.VITE_SERVER_URL}/auth/google`} method="get">
          <button className="w-full rounded-full bg-blue-600 px-4 py-2 text-white">
            Sign In with Google
          </button>
        </form>
      )}
    </>
  )
}
