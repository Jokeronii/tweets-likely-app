'use client';

import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { MoonIcon, SunIcon } from 'lucide-react';

export default function ModeToggle() {
  const { theme, setTheme } = useTheme();

  function changeTheme() {
    setTheme(theme == 'dark' ? 'light' : 'dark');
  }

  return (
    <>
      <div>
        <Button onClick={changeTheme} size={'icon'} variant={'outline'}>
          <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </>
  );
}
