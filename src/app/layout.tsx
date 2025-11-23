import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'CoupleConnect - Strengthen Your Relationship',
    description: 'A private relationship-strengthening platform for couples with emotional intelligence, habit tracking, and shared planning.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
