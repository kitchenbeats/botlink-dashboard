import { getUser } from '@/server/auth/get-user'
import { cache } from 'react'

const getUserMemo = cache(getUser)

export default getUserMemo
