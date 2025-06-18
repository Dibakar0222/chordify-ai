
'use server';
/**
 * @fileOverview Fetches a backing track URL for a given song name.
 *
 * - fetchBackingTrack - A function that handles fetching the backing track URL.
 * - FetchBackingTrackInput - The input type for the fetchBackingTrack function.
 * - FetchBackingTrackOutput - The return type for the fetchBackingTrack function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FetchBackingTrackInputSchema = z.object({
  songName: z.string().describe('The name of the song to fetch the backing track for.'),
});
export type FetchBackingTrackInput = z.infer<typeof FetchBackingTrackInputSchema>;

const FetchBackingTrackOutputSchema = z.object({
  audioUrl: z.string().optional().describe('The URL of the backing track audio.'),
});
export type FetchBackingTrackOutput = z.infer<typeof FetchBackingTrackOutputSchema>;

export async function fetchBackingTrack(input: FetchBackingTrackInput): Promise<FetchBackingTrackOutput> {
  return fetchBackingTrackFlow(input);
}

const fetchBackingTrackFlow = ai.defineFlow(
  {
    name: 'fetchBackingTrackFlow',
    inputSchema: FetchBackingTrackInputSchema,
    outputSchema: FetchBackingTrackOutputSchema,
  },
  async (input) => {
    try {
      const response = await fetch('http://127.0.0.1/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ song: input.songName }),
      });

      if (!response.ok) {
        let errorBody = '';
        try {
            errorBody = await response.text();
        } catch (e) {
            // Ignore if can't read body
        }
        console.error(`Error fetching backing track: ${response.status} ${response.statusText}. Body: ${errorBody}`);
        return { audioUrl: undefined };
      }

      const data = await response.json();
      
      if (typeof data === 'string') {
        return { audioUrl: data };
      } else if (data && typeof data.url === 'string') {
        return { audioUrl: data.url };
      } else if (data && typeof data.audioUrl === 'string') {
        return { audioUrl: data.audioUrl };
      } else {
        console.warn('Backing track API response format not as expected. Expected a string URL or an object with an "url" or "audioUrl" field. Response:', data);
        return { audioUrl: undefined };
      }

    } catch (error) {
      console.error('Failed to fetch backing track:', error instanceof Error ? error.message : String(error));
      return { audioUrl: undefined };
    }
  }
);
