import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('products')
@Index('uq_products_barcode', ['barcode'], { unique: true })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32 })
  barcode: string;

  @Column({ type: 'varchar', length: 500 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  brand?: string | null;

  @Column({ type: 'text', nullable: true })
  imageUrl?: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  servingSize?: number | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  servingUnit?: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  caloriesPer100g: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  proteinPer100g: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  fatPer100g: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  carbsPer100g: number;

  @Column({ type: 'varchar', length: 64 })
  source: string;

  @Column({ type: 'jsonb', nullable: true })
  rawExternalData?: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
