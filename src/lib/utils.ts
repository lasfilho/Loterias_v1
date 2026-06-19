import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export function formatNumbers(numbers: number[]): string {
  return numbers.map((n) => String(n).padStart(2, "0")).join(" - ");
}

export function parseBrazilianDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split("/").map(Number);
  // Meio-dia UTC: data oficial da Caixa sem deslocar o dia por fuso horário
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Remove bytes nulos que a API da Caixa às vezes envia e o Postgres rejeita em JSON/texto. */
export function sanitizeJsonForPostgres<T>(value: T): T {
  if (typeof value === "string") {
    return value.replace(/\u0000/g, "") as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonForPostgres(item)) as T;
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        sanitizeJsonForPostgres(nested),
      ])
    ) as T;
  }
  return value;
}
