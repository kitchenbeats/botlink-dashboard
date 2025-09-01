import { cache } from 'react'
import { getTeamIdFromSegment } from './get-team-id-from-segment'

const getTeamIdFromSegmentMemo = cache(getTeamIdFromSegment)

export default getTeamIdFromSegmentMemo
