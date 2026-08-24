"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
const COMMON_NGRAMS = ["QUE", "DE", "LA", "EL", "EN", "ES", "LOS", "DEL", "LAS", "UN", "CON", "POR"];
const chartConfig = {
  count: {
    label: "Frecuencia",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function normalizeText(value: string) {
  return value
    .toUpperCase()
    .replaceAll("Ñ", "{ENYE}")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("{ENYE}", "Ñ")
    .split("")
    .filter((character) => ALPHABET.includes(character))
    .join("");
}

function calculateIc(text: string) {
  if (text.length < 2) return 0;
  const frequencies = new Map<string, number>();
  for (const character of text) frequencies.set(character, (frequencies.get(character) ?? 0) + 1);
  const numerator = [...frequencies.values()].reduce((sum, frequency) => sum + frequency * (frequency - 1), 0);
  return numerator / (text.length * (text.length - 1));
}

function decryptCaesar(text: string, shift: number) {
  return text
    .split("")
    .map((character) => {
      const position = ALPHABET.indexOf(character);
      return ALPHABET[(position - shift + ALPHABET.length) % ALPHABET.length];
    })
    .join("");
}

function scoreCandidate(text: string) {
  return COMMON_NGRAMS.reduce(
    (score, ngram) => score + (text.match(new RegExp(ngram, "g"))?.length ?? 0),
    0,
  );
}

export default function Home() {
  const [rawText, setRawText] = useState("");
  const [selectedShift, setSelectedShift] = useState<number | null>(null);
  const [isBruteForceOpen, setIsBruteForceOpen] = useState(false);
  const normalizedText = useMemo(() => normalizeText(rawText), [rawText]);
  const ic = useMemo(() => calculateIc(normalizedText), [normalizedText]);
  const frequencies = useMemo(() => {
    const counts = new Map<string, number>();
    for (const character of normalizedText) counts.set(character, (counts.get(character) ?? 0) + 1);
    return [...ALPHABET].map((character) => ({ character, count: counts.get(character) ?? 0 }));
  }, [normalizedText]);
  const candidates = useMemo(
    () => Array.from({ length: 27 }, (_, shift) => {
      const text = decryptCaesar(normalizedText, shift);
      return { shift, text, score: scoreCandidate(text) };
    }).sort((first, second) => second.score - first.score),
    [normalizedText],
  );
  const selectedCandidate = candidates.find(({ shift }) => shift === selectedShift);

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Proyecto 1 / Criptoanálisis</p>
          <h1 className="text-3xl font-semibold tracking-tight">Cifrado César</h1>
          <p className="max-w-2xl text-muted-foreground">Normaliza el criptograma, calcula su índice de coincidencia y prueba los 27 desplazamientos.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Criptograma</CardTitle>
            <CardDescription>Se conservarán únicamente las letras del alfabeto español: A-Z y Ñ.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="min-h-44 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="Pega aquí el texto cifrado..."
              value={rawText}
              onChange={(event) => { setRawText(event.target.value); setSelectedShift(null); }}
              aria-label="Texto del criptograma"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className={normalizedText.length >= 400 ? "text-green-700" : "text-amber-700"}>
                {normalizedText.length} caracteres normalizados{normalizedText.length < 400 && " (mínimo recomendado: 400)"}
              </span>
              <span className="font-medium">Alfabeto: 27 caracteres</span>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico</CardTitle>
              <CardDescription>Índice de coincidencia del texto normalizado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-4xl font-semibold tabular-nums">{ic.toFixed(4)}</p>
                <p className="mt-1 text-sm text-muted-foreground">Fórmula: Σ fi(fi - 1) / N(N - 1)</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">Interpretación</p>
                <p className="mt-1 text-muted-foreground">
                  {ic >= 0.06 ? "Compatible con una sustitución monoalfabética." : ic >= 0.03 ? "IC bajo: conviene revisar si el cifrado es polialfabético." : "Introduce un texto más largo para obtener un diagnóstico fiable."}
                </p>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Frecuencias locales</p>
                <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                  {frequencies.map(({ character, count }) => (
                    <div key={character} className="rounded border border-border px-1 py-1.5">
                      <span className="block font-semibold">{character}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Collapsible open={isBruteForceOpen} onOpenChange={setIsBruteForceOpen}>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <CardTitle>Fuerza bruta</CardTitle>
                    <CardDescription>27 candidatos ordenados por coincidencias de n-gramas frecuentes.</CardDescription>
                  </div>
                  <CollapsibleTrigger
                    className="inline-flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    aria-label={isBruteForceOpen ? "Ocultar candidatos" : "Mostrar candidatos"}
                  >
                      {isBruteForceOpen ? "Ocultar" : "Ver candidatos"}
                      <ChevronDown className={`transition-transform ${isBruteForceOpen ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isBruteForceOpen && candidates[0] && (
                  <div className="flex items-start gap-3 rounded-lg border border-foreground/30 bg-muted/30 p-3">
                    <Button variant="default" size="sm" onClick={() => setSelectedShift(candidates[0].shift)}>b = {candidates[0].shift}</Button>
                    <p className="min-w-0 flex-1 break-all font-mono text-xs leading-5 line-clamp-3">{candidates[0].text || "..."}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{candidates[0].score} pts</span>
                  </div>
                )}
                <CollapsibleContent className="space-y-3">
                  {candidates.map(({ shift, text, score }) => (
                    <div key={shift} className={`flex items-start gap-3 rounded-lg border p-3 ${selectedShift === shift ? "border-foreground" : "border-border"}`}>
                      <Button variant={selectedShift === shift ? "default" : "outline"} size="sm" onClick={() => setSelectedShift(shift)}>b = {shift}</Button>
                      <p className="min-w-0 flex-1 break-all font-mono text-xs leading-5">{text || "..."}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{score} pts</span>
                    </div>
                  ))}
                </CollapsibleContent>
              </CardContent>
            </Card>
          </Collapsible>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Gráfica de frecuencias</CardTitle>
            <CardDescription>Distribución local de las letras del criptograma normalizado.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart accessibilityLayer data={frequencies} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="character" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {selectedCandidate && (
          <Card>
            <CardHeader>
              <CardTitle>Texto descifrado</CardTitle>
              <CardDescription>Clave utilizada: desplazamiento b = {selectedCandidate.shift}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="break-all rounded-lg bg-muted p-4 font-mono text-sm leading-6">{selectedCandidate.text}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
