import { ValueTransformer } from 'typeorm';

/**
 * Postgres отдаёт `numeric` строкой ("82.50"), чтобы не терять точность.
 * Трансформер приводит значение к числу и сохраняет `null` как `null`.
 */
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | number | null) =>
    value == null ? null : Number(value),
};
