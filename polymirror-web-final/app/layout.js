import "./globals.css";


export const metadata = {
  title: "PolyMirror",
  description:
    "Automated authorized media mirroring dashboard"
};


export default function RootLayout({
  children
}) {

  return (
    <html lang="en">

      <body>
        {children}
      </body>

    </html>
  );
}
