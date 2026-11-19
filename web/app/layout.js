import "./globals.css";

export const metadata = {
  title: "Fakestore Demo",
  description: "Login and product list powered by fakestoreapi.com",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
