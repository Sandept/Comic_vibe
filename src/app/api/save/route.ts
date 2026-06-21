import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { pusherServer } from '@/lib/pusherServer';

export async function POST(request: Request) {
  try {
    const { text, image_url } = await request.json();

    if (!text || !image_url) {
      return NextResponse.json({ error: 'Text and image_url are required' }, { status: 400 });
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('panels')
      .insert([
        { text, image_url }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: 'Failed to save to database' }, { status: 500 });
    }

    // Trigger Pusher event with just the ID
    await pusherServer.trigger('comic-vibe', 'new-panel', { id: data.id });

    return NextResponse.json({ panel: data });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
