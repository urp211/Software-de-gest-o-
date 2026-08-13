import "./globals.css";

export const metadata = {
  title: "MAKINA Software",
  description: "Software de Gestão Avançada para Oficinas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-AO">
      <body>{children}</body>
    </html>
  );
}
