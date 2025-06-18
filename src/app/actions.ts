
'use server';

import { fetchSongData, type FetchSongDataInput, type FetchSongDataOutput } from '@/ai/flows/fetch-song-data';
import { fetchBackingTrack, type FetchBackingTrackInput, type FetchBackingTrackOutput } from '@/ai/flows/fetch-backing-track-flow';
import { z } from 'zod';

const FormSchema = z.object({
  songName: z.string().min(1, "Song name is required."),
  contentType: z.enum(['tabs', 'chords', 'lyrics']),
});

export interface SongDataState {
  data?: FetchSongDataOutput | null;
  backingTrackUrl?: string | null;
  error?: string | null;
  message?: string | null;
  inputContentType?: 'tabs' | 'chords' | 'lyrics' | null;
}

export async function getSongDetailsAction(prevState: SongDataState, formData: FormData): Promise<SongDataState> {
  const validatedFields = FormSchema.safeParse({
    songName: formData.get('songName'),
    contentType: formData.get('contentType'),
  });

  if (!validatedFields.success) {
    return {
      error: "Invalid input: " + (validatedFields.error.flatten().fieldErrors.songName?.join(", ") || validatedFields.error.flatten().fieldErrors.contentType?.join(", ")),
      data: null,
      backingTrackUrl: null,
      inputContentType: null,
    };
  }

  const inputContentType = validatedFields.data.contentType;
  const songName = validatedFields.data.songName;

  try {
    const [songDetailsResult, backingTrackResult] = await Promise.all([
      fetchSongData({ songName, contentType: inputContentType } as FetchSongDataInput),
      fetchBackingTrack({ songName } as FetchBackingTrackInput)
    ]);
    
    let primaryContentFound = false;
    if (inputContentType === 'lyrics' && songDetailsResult.lyrics) primaryContentFound = true;
    else if (inputContentType === 'chords' && songDetailsResult.chords) primaryContentFound = true;
    else if (inputContentType === 'tabs' && songDetailsResult.tabs) primaryContentFound = true;

    const anySongDetailsFound = songDetailsResult.lyrics || songDetailsResult.chords || songDetailsResult.tabs;
    
    let message: string | null = null;

    if (!anySongDetailsFound && !backingTrackResult.audioUrl) {
      message = `No data (lyrics, chords, tabs, or backing track) found for "${songName}".`;
    } else if (!primaryContentFound && anySongDetailsFound) {
      // This implies the requested type (e.g. tabs) wasn't found, but other details (e.g. lyrics) were.
      // The backing track status will be handled by a separate toast in the UI if no general message is set.
      message = `Could not find ${inputContentType} for "${songName}". Other song content might be available.`;
    } else if (!anySongDetailsFound && backingTrackResult.audioUrl) {
      // Only backing track was found, no other song details.
      message = `Found a backing track for "${songName}", but no lyrics, chords, or tabs.`;
    }
    
    return { 
        data: songDetailsResult, 
        backingTrackUrl: backingTrackResult.audioUrl,
        message: message,
        error: null, 
        inputContentType 
    };

  } catch (e) {
    console.error("Error in getSongDetailsAction: ", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
    return { 
        error: `An unexpected error occurred while fetching data: ${errorMessage}. Please try again.`, 
        data: null, 
        backingTrackUrl: null,
        inputContentType 
    };
  }
}
