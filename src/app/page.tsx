import ChordifyApp from "@/components/chordify-app";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background py-6 flex flex-col items-center justify-center">
      <ChordifyApp />
    </main>
  );
}
