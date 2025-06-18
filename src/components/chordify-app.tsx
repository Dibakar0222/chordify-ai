'use client';

import { useActionState } from 'react'; // Changed from 'react-dom'
import { useFormStatus } from 'react-dom'; // useFormStatus remains in react-dom
import { getSongDetailsAction, type SongDataState, type FetchSongDataOutput } from '@/app/actions';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Music, FileText, Guitar } from 'lucide-react';

const initialState: SongDataState = {
  data: null,
  error: null,
  message: null,
  inputContentType: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
      {pending ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Fetching...
        </>
      ) : (
        <>
          <Search className="mr-2 h-4 w-4" /> Fetch Song Data
        </>
      )}
    </Button>
  );
}

function ResultsDisplay({ state }: { state: SongDataState }) {
  const { pending } = useFormStatus();
  const { data, inputContentType } = state;

  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!pending) {
      setInitialLoad(false);
    }
  }, [pending]);


  if (pending) {
    return (
      <div className="space-y-8 mt-8">
        {[1, 2].map((i) => (
          <Card key={i} className="shadow-lg animate-pulse">
            <CardHeader>
              <Skeleton className="h-7 w-1/3 rounded" />
              <Skeleton className="h-4 w-1/2 rounded mt-1" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (initialLoad && !data && !state.error && !state.message) {
     return (
        <div className="mt-8 text-center py-10">
          <Music className="mx-auto h-16 w-16 text-muted-foreground opacity-50 mb-4" />
          <p className="text-muted-foreground text-lg">Enter a song and choose content type to get started.</p>
        </div>
      );
  }

  if (!data || (!data.lyrics && !data.chords && !data.tabs)) {
    if (state.message && !state.error) { // Only show "No content found" if there's a specific message for it
         // Message is handled by toast
    }
    return null; // Toasts will display messages/errors
  }


  const { lyrics, chords, tabs } = data;
  let contentDisplayed = false;

  return (
    <div className="space-y-8 mt-8">
      {lyrics && inputContentType === 'lyrics' && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center text-primary"><FileText className="mr-3 h-7 w-7" /> Lyrics</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="font-body text-base whitespace-pre-wrap p-2 bg-secondary/30 rounded-md">{lyrics}</pre>
            {(() => {contentDisplayed = true; return null;})()}
          </CardContent>
        </Card>
      )}
      {chords && inputContentType === 'chords' && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center text-primary"><Guitar className="mr-3 h-7 w-7" /> Chords</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="font-code text-sm bg-muted p-4 rounded-md overflow-x-auto">{chords}</pre>
            {(() => {contentDisplayed = true; return null;})()}
          </CardContent>
        </Card>
      )}
      {tabs && inputContentType === 'tabs' && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 lucide lucide-align-justify"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg>
                Tabs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="font-code text-sm bg-muted p-4 rounded-md overflow-x-auto">{tabs}</pre>
            {(() => {contentDisplayed = true; return null;})()}
          </CardContent>
        </Card>
      )}
      {!contentDisplayed && state.message && !state.error && (
         <div className="mt-8 text-center py-10">
             {/* Message already handled by toast */}
         </div>
      )}
    </div>
  );
}


export default function ChordifyApp() {
  const [state, formAction] = useActionState(getSongDetailsAction, initialState); // Changed useFormState to useActionState
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        title: "Error",
        description: state.error,
        variant: "destructive",
      });
    }
    if (state.message) {
        toast({
            title: "Information",
            description: state.message,
            variant: "default", 
        });
    }
  }, [state.error, state.message, toast]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center justify-center bg-primary text-primary-foreground p-3 rounded-full mb-4 shadow-md">
            <Music className="h-10 w-10" />
        </div>
        <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary">
          ChordifyAI
        </h1>
        <p className="text-muted-foreground text-md sm:text-lg mt-2">
          Discover lyrics, chords, and tabs for any song, powered by AI.
        </p>
      </header>

      <form action={formAction} className="space-y-8">
        <Card className="shadow-xl border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="font-headline text-xl sm:text-2xl text-primary">Find Your Song</CardTitle>
            <CardDescription className="text-base">
              Enter the song name and select the content type you're looking for.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="songName" className="font-headline text-lg block mb-1.5">Song Name</Label>
              <Input
                id="songName"
                name="songName"
                type="text"
                placeholder="e.g., Yesterday by The Beatles"
                required
                className="mt-1 text-base py-3 px-4 border-input focus:ring-primary focus:border-primary"
                aria-label="Song Name"
              />
            </div>

            <div>
              <Label className="font-headline text-lg mb-2.5 block">Content Type</Label>
              <RadioGroup name="contentType" defaultValue="lyrics" className="flex flex-col sm:flex-row gap-x-6 gap-y-3">
                {[
                  { value: 'lyrics', label: 'Lyrics', icon: FileText },
                  { value: 'chords', label: 'Chords', icon: Guitar },
                  { value: 'tabs', label: 'Tabs', icon: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 lucide lucide-align-justify"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg> },
                ].map(item => (
                  <div key={item.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={item.value} id={item.value} className="border-primary text-primary focus:ring-primary" />
                    <Label htmlFor={item.value} className="font-body text-base flex items-center cursor-pointer hover:text-primary transition-colors">
                      <item.icon className="mr-2 h-5 w-5 text-accent" /> {item.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <SubmitButton />
          </CardContent>
        </Card>
        
        <ResultsDisplay state={state} />
      </form>
    </div>
  );
}
