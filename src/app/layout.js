import './globals.css'; 
import Navbar from '../components/Navbar'; 
import { Noto_Sans_Thai } from 'next/font/google'
 
const noto_sans_thai = Noto_Sans_Thai({
  subsets: ['thai'],
})

export const metadata = {
  title: 'FaceFindr App',
  description: 'Search for your faces.',
  openGraph: {
    images: 'https://img5.pic.in.th/file/secure-sv1/490975309_4031757217040578_1587258288662906038_n.th.jpg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={noto_sans_thai.className}>
      <body>
        <Navbar />
        <main className="p-6 max-w-5xl mx-auto py-8">
          {children}
        </main>
      </body>
    </html>
  );
}