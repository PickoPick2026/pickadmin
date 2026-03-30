export type Session = {
  id: string
  userID: string
  username: string

  name:string
  companyID:string
  companyName:string

  role: string
  loggedIn: boolean
  
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null

  const sessionStr = localStorage.getItem('session')
  return sessionStr ? JSON.parse(sessionStr) : null
}

export function logout() {
  localStorage.removeItem('session')
}


