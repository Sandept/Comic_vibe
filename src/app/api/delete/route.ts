import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { pusherServer } from '@/lib/pusherServer';

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Delete from Supabase
    const { error } = await supabase
      .from('panels')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase Delete Error:', error);
      return NextResponse.json({ error: 'Failed to delete from database' }, { status: 500 });
    }

    // Trigger Pusher event to notify clients to remove this panel
    await pusherServer.trigger('comic-vibe', 'delete-panel', { id });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
