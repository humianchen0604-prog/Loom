import { StackedDeck } from './components/StackedDeck';

export default function App() {
  return (
    <div className="min-h-screen font-sans antialiased flex flex-col items-center justify-center p-8 overflow-hidden relative">
      <div className="relative w-full">
        <StackedDeck />
      </div>
    </div>
  );
}
