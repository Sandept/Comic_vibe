import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { pusherServer } from '@/lib/pusherServer';

export async function POST() {
  try {
    // Delete all panels using a filter that matches everything
    const { error } = await supabase
      .from('panels')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Supabase Delete Error:', error);
      return NextResponse.json({ error: 'Failed to clear database' }, { status: 500 });
    }

    // Trigger Pusher event to notify all connected clients
    await pusherServer.trigger('comic-vibe', 'clear-panels', {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
