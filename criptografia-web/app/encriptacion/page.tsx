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
const COPRIME_VALUES = [1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19, 20, 22, 23, 25, 26];

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
  return plaintext.split("").map((character) => {
    const position = ALPHABET.indexOf(character);
    return ALPHABET[(position + shift) % ALPHABET.length];
  }).join("");
}

function encryptAffine(plaintext: string, a: number, b: number) {
  return plaintext.split("").map((character) => {
    const position = ALPHABET.indexOf(character);
    return ALPHABET[(a * position + b) % ALPHABET.length];
  }).join("");
}

function encryptVigenere(plaintext: string, key: string) {
  if (!key) return "";

  return plaintext.split("").map((character, index) => {
    const plaintextPosition = ALPHABET.indexOf(character);
    const keyPosition = ALPHABET.indexOf(key[index % key.length]);
    return ALPHABET[(plaintextPosition + keyPosition) % ALPHABET.length];
  }).join("");
}

export default function EncriptacionPage() {
  const [rawText, setRawText] = useState("");
  const [cipherMethod, setCipherMethod] = useState("cesar");
  const [shift, setShift] = useState(0);
  const [affineA, setAffineA] = useState("5");
  const [affineB, setAffineB] = useState("7");
  const [vigenereKey, setVigenereKey] = useState("");

  const normalizedText = useMemo(() => normalizeText(rawText), [rawText]);
  const normalizedVigenereKey = useMemo(() => normalizeText(vigenereKey), [vigenereKey]);
  const affineAValue = Number(affineA);
  const affineBValue = Number(affineB);
  const isAffineKeyValid = Number.isInteger(affineAValue)
    && COPRIME_VALUES.includes(affineAValue)
    && Number.isInteger(affineBValue)
    && affineBValue >= 0
    && affineBValue < ALPHABET.length;
  const encryptedText = useMemo(() => {
    if (cipherMethod === "cesar") return encryptCaesar(normalizedText, shift);
    if (cipherMethod === "afin") {
      if (!isAffineKeyValid) return "";
      return encryptAffine(normalizedText, affineAValue, affineBValue);
    }
    return encryptVigenere(normalizedText, normalizedVigenereKey);
  }, [normalizedText, shift, cipherMethod, affineAValue, affineBValue, isAffineKeyValid, normalizedVigenereKey]);

  return (
    <main className="min-h-[calc(100svh-3.5rem)] bg-white px-4 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Proyecto / Criptografia</p>
          <h1 className="text-3xl font-semibold tracking-tight">Encriptacion</h1>
          <p className="max-w-2xl text-muted-foreground">Normaliza el texto y aplica un cifrado Cesar, Afin o Vigenere con el alfabeto espanol de 27 caracteres.</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Texto de entrada</CardTitle>
            <CardDescription>Escribe el mensaje que quieres cifrar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="min-h-44 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="Escribe o pega aqui el texto..."
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              aria-label="Texto original"
            />
            <label className="block max-w-sm space-y-1 text-sm">
              <span className="font-medium">Tipo de cifrado</span>
              <select
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                value={cipherMethod}
                onChange={(event) => setCipherMethod(event.target.value)}
                aria-label="Seleccionar tipo de cifrado"
              >
                <option value="cesar">Cesar</option>
                <option value="afin">Afin</option>
                <option value="vigenere">Vigenere</option>
              </select>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuracion y resultado</CardTitle>
            <CardDescription>Ajusta la clave del metodo seleccionado y revisa los resultados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {cipherMethod === "cesar" ? (
              <label className="block max-w-sm space-y-1 text-sm">
                <span className="font-medium">Desplazamiento K</span>
                <select
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={shift}
                  onChange={(event) => setShift(Number(event.target.value))}
                  aria-label="Seleccionar desplazamiento K"
                >
                  {Array.from({ length: 27 }, (_, index) => <option key={index} value={index}>K = {index}</option>)}
                </select>
              </label>
            ) : cipherMethod === "afin" ? (
              <div className="grid max-w-sm gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Clave a</span>
                  <input className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" type="number" min="0" max="26" step="1" value={affineA} onChange={(event) => setAffineA(event.target.value)} aria-label="Valor a de la clave afin" />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Clave b</span>
                  <input className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" type="number" min="0" max="26" step="1" value={affineB} onChange={(event) => setAffineB(event.target.value)} aria-label="Valor b de la clave afin" />
                </label>
              </div>
            ) : (
              <label className="block max-w-sm space-y-1 text-sm">
                <span className="font-medium">Palabra clave</span>
                <input
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm uppercase outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  type="text"
                  maxLength={30}
                  placeholder="Ejemplo: SEGURIDAD"
                  value={vigenereKey}
                  onChange={(event) => setVigenereKey(event.target.value)}
                  aria-label="Palabra clave de Vigenere"
                />
                <span className="block text-xs text-muted-foreground">La clave se normaliza y se repite sobre todo el texto.</span>
              </label>
            )}

            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">Reglas aplicadas</p>
              <p className="mt-1 text-muted-foreground">Alfabeto: A B C D E F G H I J K L M N Ñ O P Q R S T U V W X Y Z</p>
              <p className="text-muted-foreground">Limpieza: se eliminan espacios, tildes y puntuacion.</p>
              <p className="text-muted-foreground">Caja: todo el texto queda en MAYUSCULAS.</p>
              <p className="text-muted-foreground">Formula: {cipherMethod === "cesar" ? "C = (p + K) mod 27" : cipherMethod === "afin" ? "C = (a × P + b) mod 27" : "C = (p + kᵢ) mod 27"}</p>
            </div>

            {cipherMethod === "afin" && !isAffineKeyValid && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">La clave no es valida: a debe ser coprimo con 27 y b debe estar entre 0 y 26.</div>
            )}
            {cipherMethod === "vigenere" && !normalizedVigenereKey && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">Introduce una palabra clave con letras del alfabeto español.</div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 className="mb-2 text-sm font-medium">Texto normalizado</h2>
                <p className="mb-3 text-sm text-muted-foreground">{normalizedText.length} caracteres validos</p>
                <p className="min-h-24 break-all rounded-lg bg-muted p-4 font-mono text-sm leading-6">{normalizedText || "..."}</p>
              </div>
              <div>
                <h2 className="mb-2 text-sm font-medium">Texto cifrado</h2>
                <p className="mb-3 text-sm text-muted-foreground">Metodo: {cipherMethod === "cesar" ? `Cesar | K = ${shift}` : cipherMethod === "afin" ? `Afin | a = ${affineA}, b = ${affineB}` : `Vigenere | clave = ${normalizedVigenereKey || "..."}`}</p>
                <p className="min-h-24 break-all rounded-lg bg-muted p-4 font-mono text-sm leading-6">{encryptedText || "..."}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
