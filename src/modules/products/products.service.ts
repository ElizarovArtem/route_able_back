import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { ProductByBarcodeResponseDto } from './dto/product-by-barcode-response.dto';

type OpenFoodFactsProduct = {
  code?: string;
  product_name?: string;
  product_name_en?: string;
  generic_name?: string;
  brands?: string;
  image_front_url?: string;
  image_url?: string;
  serving_quantity?: string | number;
  serving_quantity_unit?: string;
  serving_size?: string;
  nutriments?: {
    ['energy-kcal_100g']?: number | string;
    ['energy-kcal']?: number | string;
    ['energy_100g']?: number | string;
    proteins_100g?: number | string;
    fat_100g?: number | string;
    carbohydrates_100g?: number | string;
  };
};

type OpenFoodFactsResponse = {
  product?: OpenFoodFactsProduct;
  status?: string;
  errors?: unknown[];
};

@Injectable()
export class ProductsService {
  private readonly openFoodFactsUrl =
    'https://world.openfoodfacts.org/api/v3/product';

  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  async getByBarcode(barcode: string): Promise<ProductByBarcodeResponseDto> {
    const cached = await this.productsRepo.findOne({ where: { barcode } });
    if (cached) {
      return this.toResponse(cached);
    }

    const externalProduct = await this.fetchOpenFoodFactsProduct(barcode);
    const normalized = this.normalizeOpenFoodFactsProduct(
      barcode,
      externalProduct,
    );
    const saved = await this.productsRepo.save(
      this.productsRepo.create(normalized),
    );

    return this.toResponse(saved);
  }

  private async fetchOpenFoodFactsProduct(
    barcode: string,
  ): Promise<OpenFoodFactsProduct> {
    try {
      const { data } = await axios.get<OpenFoodFactsResponse>(
        `${this.openFoodFactsUrl}/${barcode}`,
        {
          headers: {
            'User-Agent': 'route-able/1.0 (route-able product barcode lookup)',
          },
          params: {
            product_type: 'food',
            fields:
              'code,product_name,product_name_en,generic_name,brands,image_front_url,image_url,serving_quantity,serving_quantity_unit,serving_size,nutriments',
          },
          timeout: 5000,
        },
      );

      if (!data.product) {
        throw new NotFoundException('Продукт не найден');
      }

      return data.product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new NotFoundException('Продукт не найден');
      }

      throw new BadGatewayException(
        'Не удалось получить данные продукта по штрихкоду',
      );
    }
  }

  private normalizeOpenFoodFactsProduct(
    barcode: string,
    product: OpenFoodFactsProduct,
  ): Partial<Product> {
    const nutriments = product.nutriments ?? {};
    const caloriesPer100g = this.resolveCalories(nutriments);
    const proteinPer100g = this.toNumber(nutriments.proteins_100g);
    const fatPer100g = this.toNumber(nutriments.fat_100g);
    const carbsPer100g = this.toNumber(nutriments.carbohydrates_100g);
    const name =
      product.product_name ||
      product.product_name_en ||
      product.generic_name ||
      `Продукт ${barcode}`;

    if (
      caloriesPer100g === null ||
      proteinPer100g === null ||
      fatPer100g === null ||
      carbsPer100g === null
    ) {
      throw new NotFoundException('У продукта не заполнены КБЖУ');
    }

    return {
      barcode,
      name,
      brand: product.brands || null,
      imageUrl: product.image_front_url || product.image_url || null,
      servingSize: this.toNumber(product.serving_quantity),
      servingUnit: product.serving_quantity_unit || null,
      caloriesPer100g,
      proteinPer100g,
      fatPer100g,
      carbsPer100g,
      source: 'open_food_facts',
      rawExternalData: product as Record<string, any>,
    };
  }

  private resolveCalories(
    nutriments: OpenFoodFactsProduct['nutriments'],
  ): number | null {
    const kcal = this.toNumber(nutriments?.['energy-kcal_100g']);
    if (kcal !== null) return kcal;

    const fallbackKcal = this.toNumber(nutriments?.['energy-kcal']);
    if (fallbackKcal !== null) return fallbackKcal;

    const kj = this.toNumber(nutriments?.['energy_100g']);
    return kj === null ? null : kj / 4.184;
  }

  private toNumber(value: string | number | undefined): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const normalized =
      typeof value === 'string' ? Number(value.replace(',', '.')) : value;

    return Number.isFinite(normalized) ? Number(normalized.toFixed(2)) : null;
  }

  private toResponse(product: Product): ProductByBarcodeResponseDto {
    return {
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      brand: product.brand ?? null,
      imageUrl: product.imageUrl ?? null,
      servingSize:
        product.servingSize === null || product.servingSize === undefined
          ? null
          : Number(product.servingSize),
      servingUnit: product.servingUnit ?? null,
      caloriesPer100g: Number(product.caloriesPer100g),
      proteinPer100g: Number(product.proteinPer100g),
      fatPer100g: Number(product.fatPer100g),
      carbsPer100g: Number(product.carbsPer100g),
      source: product.source,
    };
  }
}
