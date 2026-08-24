"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";

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

function encryptCaesar(plaintext: string, shift: number) {
  return plaintext
    .split("")
    .map((character) => {
      const position = ALPHABET.indexOf(character);
      return ALPHABET[(position + shift) % ALPHABET.length];
    })
    .join("");
}

export default function EncriptacionPage() {
  const [rawText, setRawText] = useState("");
  const [cipherMethod, setCipherMethod] = useState("cesar");
  const [shift, setShift] = useState(0);

  const normalizedText = useMemo(() => normalizeText(rawText), [rawText]);
  const encryptedText = useMemo(() => {
    if (cipherMethod !== "cesar") return "";
    return encryptCaesar(normalizedText, shift);
  }, [normalizedText, shift, cipherMethod]);

  return (
    <main className="min-h-[calc(100svh-3.5rem)] bg-white px-4 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Proyecto 1 / Criptografia
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Encriptacion</h1>
          <p className="max-w-2xl text-muted-foreground">
            Cifrado Cesar usando la formula (p + K) mod 27 con alfabeto espanol A-Z y Ñ.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Texto de entrada</CardTitle>
            <CardDescription>
              Se aplican automaticamente las reglas: mayusculas, sin tildes, sin espacios ni signos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="min-h-44 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="Escribe o pega aqui el texto..."
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              aria-label="Texto original"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Tipo de cifrado</span>
                <select
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={cipherMethod}
                  onChange={(event) => setCipherMethod(event.target.value)}
                  aria-label="Seleccionar tipo de cifrado"
                >
                  <option value="cesar">Cesar</option>
                </select>
              </label>

              <label className="space-y-1 text-sm">
                <span className="font-medium">Desplazamiento K</span>
                <select
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={shift}
                  onChange={(event) => setShift(Number(event.target.value))}
                  aria-label="Seleccionar desplazamiento K"
                >
                  {Array.from({ length: 27 }, (_, index) => (
                    <option key={index} value={index}>
                      K = {index}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">Reglas aplicadas</p>
              <p className="mt-1 text-muted-foreground">Alfabeto: A B C D E F G H I J K L M N Ñ O P Q R S T U V W X Y Z</p>
              <p className="text-muted-foreground">Limpieza: se eliminan espacios, tildes y puntuacion.</p>
              <p className="text-muted-foreground">Caja: todo el texto queda en MAYUSCULAS.</p>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Texto normalizado</CardTitle>
              <CardDescription>
                Resultado previo al cifrado para validar limpieza y formato.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                {normalizedText.length} caracteres validos
              </p>
              <p className="break-all rounded-lg bg-muted p-4 font-mono text-sm leading-6">
                {normalizedText || "..."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Texto cifrado</CardTitle>
              <CardDescription>Formula aplicada: (p + K) mod 27</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                Metodo: Cesar | K = {shift}
              </p>
              <p className="break-all rounded-lg bg-muted p-4 font-mono text-sm leading-6">
                {encryptedText || "..."}
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
