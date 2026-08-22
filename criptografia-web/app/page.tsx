import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Proyecto 1</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Hello, world!</p>
        </CardContent>
      </Card>
    </main>
  );
}
