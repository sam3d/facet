import { PropsWithChildren } from "react";
import "tailwindcss/tailwind.css";

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
