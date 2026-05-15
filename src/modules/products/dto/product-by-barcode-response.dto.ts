export class ProductByBarcodeResponseDto {
  id: string;
  barcode: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  servingSize: number | null;
  servingUnit: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  source: string;
}
