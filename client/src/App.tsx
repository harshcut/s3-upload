import * as React from 'react'

export default function App() {
  const [authenticated, setAuthenticated] = React.useState<string | false>(false)

  React.useEffect(() => {
    ;(async () => {
      const { data } = await fetch('http://localhost:4000/', { credentials: 'include' }).then(
        (res) => res.json()
      )
      if (!data) {
        return setAuthenticated(false)
      }
      setAuthenticated(data.displayName)
    })()
  }, [])

  return (
    <>
      {authenticated ? (
        <nav className="flex justify-between">
          <header className="flex-1 rounded-full bg-blue-100 px-4 py-2">{authenticated}</header>
          <button className="rounded-full bg-black px-4 py-2 text-white outline-offset-4 outline-black">
            Sign Out
          </button>
        </nav>
      ) : (
        <form action="http://localhost:4000/auth/google" method="get">
          <button className="w-full rounded-full bg-blue-600 px-4 py-2 text-white">
            Sign In with Google
          </button>
        </form>
      )}
    </>
  )
}
