import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET() {
  try {
    // Get all keys matching the analysis pattern
    const keys = await kv.keys('analysis:*');
    
    // Get all analyses in parallel
    const analyses = await Promise.all(
      keys.map(async (key) => {
        const analysis = await kv.get(key);
        return analysis;
      })
    );

    // Sort by timestamp descending (most recent first)
    const sortedAnalyses = analyses
      .filter(Boolean)
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, 9); // Get last 9 analyses

    return NextResponse.json(sortedAnalyses);
  } catch (error) {
    console.error('Error fetching recent analyses:', error);
    return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
  }
}

export const runtime = 'edge';