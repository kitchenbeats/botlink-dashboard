import { initBotId } from 'botid/client/core'
import { USE_BOT_ID } from './configs/flags'

if (USE_BOT_ID) {
  initBotId({
    protect: [
      {
        path: '/sign-up',
        method: 'POST',
      },
    ],
  })
}
