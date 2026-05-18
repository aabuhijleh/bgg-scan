import { createFileRoute } from "@tanstack/react-router";
import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Hello World</CardTitle>
          <ThemeToggle />
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your TanStack Start app is ready.
          </p>
          <Button className="mt-4">Get Started</Button>
        </CardContent>
      </Card>
    </div>
  );
}
