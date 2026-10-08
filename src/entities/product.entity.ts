import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from './base/base.entity';
import { numericTransformer } from './base/transformers';

@Entity('products')
@Index('uq_products_barcode', ['barcode'], { unique: true })
export class Product extends BaseEntity {
  @Column({ type: 'varchar', length: 32 })
  barcode: string;

  @Column({ type: 'varchar', length: 500 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  brand?: string | null;

  @Column({ type: 'text', nullable: true })
  imageUrl?: string | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  servingSize?: number | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  servingUnit?: string | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  caloriesPer100g: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  proteinPer100g: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  fatPer100g: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  carbsPer100g: number;

  @Column({ type: 'varchar', length: 64 })
  source: string;

  @Column({ type: 'jsonb', nullable: true })
  rawExternalData?: Record<string, any> | null;
}
