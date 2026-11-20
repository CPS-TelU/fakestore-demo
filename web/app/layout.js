import "./globals.css";

export const metadata = {
  title: "Fakestore Demo",
  description: "Sign in and browse products in one simple store.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
