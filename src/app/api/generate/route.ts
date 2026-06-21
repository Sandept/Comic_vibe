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

    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        headers: {
          Authorization: `Bearer ${hfApiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: enhancedPrompt }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Hugging Face API Error";
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.error.includes("currently loading")) {
          errorMessage = `The AI Model is waking up! Please wait ${Math.ceil(errorJson.estimated_time || 20)} seconds and hit DRAW again.`;
        } else {
          errorMessage = errorJson.error || errorText;
        }
      } catch (e) {
        errorMessage = errorText;
      }
      throw new Error(errorMessage);
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
