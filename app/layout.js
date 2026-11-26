import './globals.css';
export const metadata = { title: 'Team Task Board', description: 'Daily task progress for the whole team' };
export default function RootLayout({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
