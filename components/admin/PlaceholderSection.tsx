import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function PlaceholderSection({
  title,
  description,
  etapa,
}: {
  title: string;
  description: string;
  etapa: string;
}) {
  return (
    <div className="max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {title}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">{description}</p>
      </header>
      <Card className="bg-white">
        <CardContent className="py-12 text-center">
          <Construction className="w-10 h-10 mx-auto mb-3 text-zinc-400" />
          <p className="text-sm text-zinc-500">{etapa}</p>
        </CardContent>
      </Card>
    </div>
  );
}
