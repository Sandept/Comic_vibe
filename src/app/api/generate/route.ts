import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { pusherServer } from '@/lib/pusherServer';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfApiKey) {
      return NextResponse.json({ error: 'Hugging Face API key not configured' }, { status: 500 });
    }

    // Enhance the prompt for a comic book style
    const enhancedPrompt = `A comic book panel showing: ${prompt}, vibrant colors, retro comic book art style, high quality, sharp lines, detailed, graphic novel style`;

    let base64Image: string;

    // Using Pollinations AI because Vercel's strict 10-second timeout kills Hugging Face requests.
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=800&height=800&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`AI Generation Error: ${await response.text()}`);
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    base64Image = `data:${blob.type};base64,${buffer.toString('base64')}`;

    return NextResponse.json({ 
      panel: {
        id: 'staging-' + Date.now(), // Temporary ID for the staging area
        created_at: new Date().toISOString(),
        text: prompt,
        image_url: base64Image
      } 
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
