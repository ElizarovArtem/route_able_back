import {
  BadRequestException,
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../libs/guards/auth.guard';
import { ProductsService } from './products.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('barcode/:barcode')
  getByBarcode(@Param('barcode') barcode: string) {
    if (!/^\d{6,14}$/.test(barcode)) {
      throw new BadRequestException('Некорректный штрихкод');
    }

    return this.productsService.getByBarcode(barcode);
  }
}
