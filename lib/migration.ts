export interface Migration {
  up(): string;
  down(): string;
}
