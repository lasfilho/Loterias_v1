import { type GameRules } from "../../constants";

/** Números primos no universo do jogo (1 não é primo). */
export function getPrimesInUniverse(rules: GameRules): number[] {
  const numbers: number[] = [];
  for (let n = rules.minNumber; n <= rules.maxNumber; n++) {
    if (isPrime(n)) numbers.push(n);
  }
  return numbers;
}

/** Dezenas de Fibonacci presentes no universo (sequência clássica, sem repetir 1). */
export function getFibonacciInUniverse(rules: GameRules): number[] {
  const set = new Set<number>();
  let a = 1;
  let b = 1;

  while (a <= rules.maxNumber) {
    if (a >= rules.minNumber) set.add(a);
    const next = a + b;
    a = b;
    b = next;
  }

  return [...set].sort((x, y) => x - y);
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

export function buildNumberSetLookup(numbers: number[]): Set<number> {
  return new Set(numbers);
}

/** Média teórica de dezenas da categoria por sorteio (hipergeomérica simplificada). */
export function theoreticalMeanPerDraw(
  rules: GameRules,
  categorySize: number
): number {
  return (rules.drawCount * categorySize) / (rules.maxNumber - rules.minNumber + 1);
}
