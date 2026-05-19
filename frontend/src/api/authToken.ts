/** Token local de demo; no es JWT y no debe usarse contra el API real. */
export function isSimulatedToken(value: string | null | undefined): boolean {
  if (!value) return false;
  return value === 'simulado' || value.startsWith('simulado-');
}
