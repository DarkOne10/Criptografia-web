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
const COMMON_NGRAMS = [
  "DE", "LA", "EL", "EN", "ES", "OS", "AS", "ER", "AR", "RA", "RE", "ON", "AN", "NO", "AL", "UN", "SE", "TE", "CO", "ME", "LO", "LE", "QUE", "LOS", "DEL", "LAS", "CON", "POR", "PAR", "DES", "COM", "EST", "ENT", "RES", "ION", "UNA", "ADO", "GUE", "CIA", "PRO", "MEN", "ERA", "SEG", "DESC", "ANAL", "FREC", "LETR", "COMU", "IDIO", "PERM", "ROMP", "CIFR", "MONO", "ALFA", "RELA", "DESCR", "ANALI", "FRECU", "LETRA", "COMUN", "IDIOM", "PERMI", "ROMPE", "CIFRA", "MONOA", "RELAT", "FACIL",
];
const COPRIME_VALUES = [1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20, 22, 23, 25, 26];
const SPANISH_FREQUENCIES = [12.53, 1.42, 4.68, 5.86, 13.68, 0.69, 1.01, 0.7, 6.25, 0.44, 0.02, 4.97, 3.15, 6.71, 0.31, 8.68, 2.51, 6.87, 7.98, 4.63, 3.93, 0.9, 0.01, 0.22, 0.9, 0.22, 0.01];
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

function modularInverse(value: number) {
  return COPRIME_VALUES.find((candidate) => (value * candidate) % ALPHABET.length === 1) ?? 0;
}

function decryptAffine(text: string, a: number, b: number) {
  const inverse = modularInverse(a);
  return text
    .split("")
    .map((character) => {
      const position = ALPHABET.indexOf(character);
      return ALPHABET[((inverse * (position - b)) % ALPHABET.length + ALPHABET.length) % ALPHABET.length];
    })
    .join("");
}

function scoreCandidate(text: string) {
  return COMMON_NGRAMS.reduce(
    (score, ngram) => score + (text.match(new RegExp(ngram, "g"))?.length ?? 0) * Math.max(1, ngram.length - 1),
    0,
  );
}

function decryptVigenere(text: string, key: number[]) {
  return text.split("").map((character, index) => {
    const position = ALPHABET.indexOf(character);
    return ALPHABET[(position - key[index % key.length] + ALPHABET.length) % ALPHABET.length];
  }).join("");
}

function findRepeatedSequences(text: string) {
  const repetitions: { sequence: string; positions: number[]; distance: number }[] = [];
  for (let length = 3; length <= 5; length += 1) {
    const occurrences = new Map<string, number[]>();
    for (let index = 0; index <= text.length - length; index += 1) {
      const sequence = text.slice(index, index + length);
      occurrences.set(sequence, [...(occurrences.get(sequence) ?? []), index]);
    }
    for (const [sequence, positions] of occurrences) {
      if (positions.length < 2) continue;
      for (let index = 1; index < positions.length; index += 1) {
        repetitions.push({ sequence, positions, distance: positions[index] - positions[index - 1] });
      }
    }
  }
  return repetitions;
}

function getFactors(value: number) {
  const factors: number[] = [];
  for (let factor = 2; factor <= 30; factor += 1) {
    if (value % factor === 0) factors.push(factor);
  }
  return factors;
}

function averageColumnIc(text: string, keyLength: number) {
  const columnIcs = Array.from({ length: keyLength }, (_, columnIndex) => {
    const column = [...text].filter((_, index) => index % keyLength === columnIndex).join("");
    return calculateIc(column);
  });
  return columnIcs.reduce((sum, value) => sum + value, 0) / keyLength;
}

function columnChiSquare(column: string, shift: number) {
  const decrypted = decryptCaesar(column, shift);
  const counts = [...ALPHABET].map((character) => decrypted.split(character).length - 1);
  return counts.reduce((score, count, index) => {
    const expected = column.length * (SPANISH_FREQUENCIES[index] / 100);
    return score + (expected > 0 ? ((count - expected) ** 2) / expected : 0);
  }, 0);
}

function solveVigenere(text: string, keyLength: number) {
  const key = Array.from({ length: keyLength }, (_, columnIndex) => {
    const column = [...text].filter((_, index) => index % keyLength === columnIndex).join("");
    return Array.from({ length: ALPHABET.length }, (_, shift) => ({
      shift,
      score: columnChiSquare(column, shift),
    })).sort((first, second) => first.score - second.score)[0].shift;
  });
  // Refina cada columna usando la coherencia de todo el texto, no solo su frecuencia local.
  for (let pass = 0; pass < 4; pass += 1) {
    for (let columnIndex = 0; columnIndex < keyLength; columnIndex += 1) {
      const bestShift = Array.from({ length: ALPHABET.length }, (_, shift) => {
        const trialKey = [...key];
        trialKey[columnIndex] = shift;
        const trialText = decryptVigenere(text, trialKey);
        return { shift, score: scoreCandidate(trialText) };
      }).sort((first, second) => second.score - first.score)[0].shift;
      key[columnIndex] = bestShift;
    }
  }
  return { key: key.map((shift) => ALPHABET[shift]).join(""), text: decryptVigenere(text, key) };
}

export default function Home() {
  const [rawText, setRawText] = useState("");
  const [selectedShift, setSelectedShift] = useState<number | null>(null);
  const [isBruteForceOpen, setIsBruteForceOpen] = useState(false);
  const [affineA, setAffineA] = useState("5");
  const [affineB, setAffineB] = useState("7");
  const [affineInputText, setAffineInputText] = useState<string | null>(null);
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
  const bestAffineCandidate = useMemo(() => {
    if (!normalizedText) return null;

    return COPRIME_VALUES.flatMap((a) =>
      Array.from({ length: ALPHABET.length }, (_, b) => {
        const text = decryptAffine(normalizedText, a, b);
        return { a, b, text, score: scoreCandidate(text) };
      }),
    ).sort((first, second) => second.score - first.score)[0];
  }, [normalizedText]);
  const kasiskiAnalysis = useMemo(() => {
    if (!normalizedText) return { repetitions: [], candidates: [], best: null };
    const repetitions = findRepeatedSequences(normalizedText);
    const factorCounts = new Map<number, number>();
    for (const repetition of repetitions) {
      for (const factor of getFactors(repetition.distance)) {
        factorCounts.set(factor, (factorCounts.get(factor) ?? 0) + 1);
      }
    }
    const maximumKeyLength = Math.min(30, Math.max(2, Math.floor(normalizedText.length / 10)));
    const maximumFactorScore = Math.max(1, ...factorCounts.values());
    const candidates = Array.from({ length: maximumKeyLength - 1 }, (_, index) => index + 2)
      .map((length) => {
        const factorScore = factorCounts.get(length) ?? 0;
        const normalizedFactorScore = factorScore / maximumFactorScore;
        const columnIc = averageColumnIc(normalizedText, length);
        const solved = solveVigenere(normalizedText, length);
        const icScore = Math.max(0, 1 - Math.abs(columnIc - 0.077) / 0.077);
        const columnSizeScore = Math.min(1, normalizedText.length / (length * 12));
        const normalizedPlaintextScore = scoreCandidate(solved.text) / normalizedText.length;
        return {
          length,
          score: factorScore,
          columnIc,
          plaintextScore: normalizedPlaintextScore,
          key: solved.key,
          text: solved.text,
          ranking: normalizedFactorScore * 10 + icScore * 100 + normalizedPlaintextScore * 100 * columnSizeScore,
        };
      })
      .sort((first, second) => second.ranking - first.ranking);
    const best = candidates[0];
    return {
      repetitions: repetitions.slice(0, 8),
      candidates,
      best: best ? { length: best.length, key: best.key, text: best.text } : null,
    };
  }, [normalizedText]);
  const identifiedCipher = bestAffineCandidate
    ? ic >= 0.03 && ic <= 0.055
      ? "Vigenère"
      : bestAffineCandidate.a === 1
      ? "César"
      : "Afín"
    : null;
  const displayedAffineA = affineInputText === normalizedText
    ? affineA
    : identifiedCipher === "Afín" && bestAffineCandidate
      ? String(bestAffineCandidate.a)
      : "";
  const displayedAffineB = affineInputText === normalizedText
    ? affineB
    : identifiedCipher === "Afín" && bestAffineCandidate
      ? String(bestAffineCandidate.b)
      : "";
  const affineAValue = Number(displayedAffineA);
  const affineBValue = Number(displayedAffineB);
  const isAffineKeyValid = Number.isInteger(affineAValue)
    && COPRIME_VALUES.includes(affineAValue)
    && Number.isInteger(affineBValue)
    && affineBValue >= 0
    && affineBValue < ALPHABET.length;
  const manualAffineText = isAffineKeyValid
    ? decryptAffine(normalizedText, affineAValue, affineBValue)
    : "";

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-8">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Proyecto / Criptoanálisis</p>
          <h1 className="text-3xl font-semibold tracking-tight">Desencriptar</h1>
          <p className="max-w-2xl text-muted-foreground">Normaliza el criptograma, calcula su IC e identifica si corresponde a César, Afín o Vigenère.</p>
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
              <span className="text-green-700">
                {normalizedText.length} caracteres normalizados
              </span>
              <span className="font-medium">Alfabeto: 27 caracteres</span>
            </div>
          </CardContent>
        </Card>

        <section className="grid items-start gap-6 lg:grid-cols-[0.8fr_1.2fr_1.4fr]">
          <div className="flex flex-col gap-6">
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
              <div className={`rounded-lg border p-4 ${identifiedCipher === "César" ? "border-blue-300 bg-blue-50" : identifiedCipher === "Afín" ? "border-emerald-300 bg-emerald-50" : "border-border bg-muted"}`}>
                <p className="text-base font-semibold">Interpretación</p>
                <p className="mt-2 text-base leading-7 text-muted-foreground">
                  {identifiedCipher
                    ? (
                      <>
                        Cifrado identificado:{" "}
                        <span className={`inline-flex rounded-md px-2.5 py-0.5 text-lg font-bold ${identifiedCipher === "César" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"}`}>
                          {identifiedCipher}
                        </span>
                        <span className="ml-1">
                          {identifiedCipher === "Vigenère"
                            ? `. Longitud estimada: L = ${kasiskiAnalysis.best?.length}, clave: ${kasiskiAnalysis.best?.key}.`
                            : `. Mejor clave encontrada: a = ${bestAffineCandidate?.a}, b = ${bestAffineCandidate?.b}.`}
                        </span>
                      </>
                    )
                    : ic >= 0.03
                      ? "IC bajo: conviene revisar si el cifrado es polialfabético."
                      : "Introduce un criptograma para identificar el tipo de cifrado."}
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

          </div>

          <div className="flex flex-col gap-6">
            {identifiedCipher === "César" && (
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
            )}

            {identifiedCipher === "Afín" && (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1.5">
                    <CardTitle>Cifrado Afín</CardTitle>
                    <CardDescription>
                      Introduce la clave para descifrar el mensaje con análisis de frecuencias.
                    </CardDescription>
                  </div>
                  <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Clave a</span>
                      <input
                        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:w-24"
                        type="number"
                        min="0"
                        max="26"
                        step="1"
                        value={displayedAffineA}
                        onChange={(event) => { setAffineInputText(normalizedText); setAffineA(event.target.value); }}
                        aria-label="Valor a de la clave afín"
                      />
                    </label>
                    <label className="space-y-1 text-sm">
                      <span className="font-medium">Clave b</span>
                      <input
                        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:w-24"
                        type="number"
                        min="0"
                        max="26"
                        step="1"
                        value={displayedAffineB}
                        onChange={(event) => { setAffineInputText(normalizedText); setAffineB(event.target.value); }}
                        aria-label="Valor b de la clave afín"
                      />
                    </label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  Fórmula de cifrado: C = ((a × m) + b) mod 27. Los valores posibles de a son coprimos con 27.
                </div>
                <div className={`rounded-lg border p-4 text-sm ${isAffineKeyValid ? "border-border" : "border-red-300 bg-red-50 text-red-700"}`}>
                  {isAffineKeyValid
                    ? `Clave válida: a = ${affineAValue}, b = ${affineBValue}. Se aplica la fórmula inversa para descifrar.`
                    : "Clave no válida: a debe ser coprimo con 27 y b debe estar entre 0 y 26."}
                </div>
                <div className="rounded-lg border border-foreground/30 bg-muted/30 p-4">
                  <p className="text-sm font-medium">Mensaje descifrado con la clave introducida</p>
                  <p className="mt-2 break-all font-mono text-sm leading-6">{manualAffineText || "..."}</p>
                </div>
              </CardContent>
            </Card>
            )}

            {identifiedCipher === "Vigenère" && (
            <Card>
              <CardHeader>
                <CardTitle>Ataque Kasiski</CardTitle>
                <CardDescription>Busca secuencias repetidas para estimar la longitud de la clave Vigenère.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {kasiskiAnalysis.best ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-violet-700">Longitud estimada</p>
                        <p className="mt-1 text-2xl font-semibold text-violet-950">L = {kasiskiAnalysis.best.length}</p>
                      </div>
                      <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-violet-700">Clave recuperada</p>
                        <p className="mt-1 text-2xl font-semibold tracking-widest text-violet-950">{kasiskiAnalysis.best.key}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Factores detectados: {kasiskiAnalysis.candidates.filter(({ score }) => score > 0).slice(0, 5).map(({ length, score }) => `L=${length} (${score})`).join(", ") || "sin coincidencias repetidas"}.
                    </p>
                    <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-4">
                      <p className="text-sm font-medium">Texto descifrado con Kasiski</p>
                      <p className="mt-2 break-all font-mono text-sm leading-6">{kasiskiAnalysis.best.text}</p>
                    </div>
                    {kasiskiAnalysis.repetitions.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Secuencias repetidas: {kasiskiAnalysis.repetitions.map(({ sequence, distance }) => `${sequence} (${distance})`).join(", ")}.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Introduce un criptograma para ejecutar Kasiski.</p>
                )}
              </CardContent>
            </Card>
            )}
          </div>

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
        </section>

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
