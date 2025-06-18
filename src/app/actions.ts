'use server';

import { fetchSongData, type FetchSongDataInput, type FetchSongDataOutput } from '@/ai/flows/fetch-song-data';
import { z } from 'zod';

const FormSchema = z.object({
  songName: z.string().min(1, "Song name is required."),
  contentType: z.enum(['tabs', 'chords', 'lyrics']),
});

export interface SongDataState {
  data?: FetchSongDataOutput | null;
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
      error: "Invalid input: " + validatedFields.error.flatten().fieldErrors.songName?.join(", ") || validatedFields.error.flatten().fieldErrors.contentType?.join(", "),
      data: null,
      inputContentType: null,
    };
  }

  const inputContentType = validatedFields.data.contentType;

  try {
    const result = await fetchSongData(validatedFields.data as FetchSongDataInput);
    
    let contentFound = false;
    if (inputContentType === 'lyrics' && result.lyrics) contentFound = true;
    else if (inputContentType === 'chords' && result.chords) contentFound = true;
    else if (inputContentType === 'tabs' && result.tabs) contentFound = true;

    // Check if any data was returned at all, even if not the primary requested type
    const anyDataReturned = result.lyrics || result.chords || result.tabs;

    if (!anyDataReturned) {
        return { data: result, message: `No data (lyrics, chords, or tabs) found for "${validatedFields.data.songName}".`, error: null, inputContentType };
    }
    if (!contentFound) {
      return { data: result, message: `Could not find ${inputContentType} for "${validatedFields.data.songName}". Other content might be available.`, error: null, inputContentType };
    }
    
    return { data: result, error: null, inputContentType };
  } catch (e) {
    console.error("Error in getSongDetailsAction: ", e);
    return { error: "An unexpected error occurred while fetching song data. Please try again.", data: null, inputContentType };
  }
}
