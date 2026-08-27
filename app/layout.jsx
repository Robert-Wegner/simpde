import "../src/index.css";

export const metadata = {
    title: "PDE Simulator",
    description: "Explore partial differential equations and cellular automata in an interactive GPU-powered simulator.",
    openGraph: {
        title: "PDE Simulator",
        description: "Explore equations. Watch patterns emerge.",
        images: ["/social-preview.png"],
    },
    twitter: {
        card: "summary_large_image",
        title: "PDE Simulator",
        description: "Explore equations. Watch patterns emerge.",
        images: ["/social-preview.png"],
    },
};

export default function RootLayout({children}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
