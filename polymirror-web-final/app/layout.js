import "./globals.css";

export const metadata = {
  title: "PolyMirror",
  description: "Mobile-friendly URL mirror dashboard"
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}