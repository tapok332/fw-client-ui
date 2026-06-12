import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-3xl font-semibold text-foreground mb-4">404 - Page Not Found</h1>
      <p className="text-muted-foreground mb-4">
        The page you are looking for does not exist.
      </p>
      <Link href="/" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
        Go Home
      </Link>
    </div>
  );
}
