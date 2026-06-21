import Pusher from 'pusher-js';

// Ensure it's only initialized on the client to avoid SSR issues
export const pusherClient = typeof window !== 'undefined' 
  ? new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
    })
  : null;
