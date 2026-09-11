import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const enhanced = encodeURIComponent(
      `${prompt}, cinematic 35mm photography, 2.39:1 anamorphic frame, hyperdetailed, film grain, dramatic lighting, 8k, photorealistic, cinematic composition`
    );

    const imageUrl = `https://image.pollinations.ai/prompt/${enhanced}?width=1280&height=540&nologo=true&enhance=true`;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Frame generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate frame', fallback: true },
      { status: 500 }
    );
  }
}
