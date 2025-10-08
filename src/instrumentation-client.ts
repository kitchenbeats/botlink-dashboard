import { initBotId } from 'botid/client/core'

initBotId({
  protect: [
    {
      path: '/sign-up',
      method: 'POST',
    },
  ],
})
