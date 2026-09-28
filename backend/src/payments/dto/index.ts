import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsIn,
  Min,
  IsEnum,
  IsDateString,
  MaxLength,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/utils';
import { PaymentMethod, PaymentStatus } from '../../common/enums';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Order ID to pay for', example: 1 })
  @IsInt()
  @Type(() => Number)
  order_id!: number;

  @ApiPropertyOptional({
    description: 'Payment method e.g. card, apple_pay',
    example: 'card',
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Return URL after payment completes' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  return_url?: string;
}

export class PaymentWebhookDto {
  @ApiProperty({ example: 'txn_1740685000_a1b2c3d4' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  transaction_id!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  order_id!: number;

  @ApiProperty({
    enum: ['paid', 'completed', 'success', 'failed'],
    example: 'paid',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['paid', 'completed', 'success', 'failed'])
  status!: string;

  @ApiProperty({ example: 719.1 })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount!: number;

  @ApiPropertyOptional({ example: 'AED' })
  @IsOptional()
  @IsString()
  @IsIn(['AED'])
  currency?: string;
}

export class ConfirmManualPaymentDto {
  @ApiProperty({ description: 'Order ID whose external payment was received' })
  @IsInt()
  @Type(() => Number)
  order_id!: number;

  @ApiProperty({ example: 400 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(9_999_999.99)
  @Type(() => Number)
  amount!: number;

  @ApiProperty({
    enum: ['payment_link', 'qr_code', 'bank_transfer', 'cash', 'other'],
    example: 'payment_link',
  })
  @IsString()
  @IsIn(['payment_link', 'qr_code', 'bank_transfer', 'cash', 'other'])
  payment_method!:
    'payment_link' | 'qr_code' | 'bank_transfer' | 'cash' | 'other';

  @ApiPropertyOptional({
    description: 'Reference supplied by the external payment channel',
    example: 'PAYLINK-48291',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  transaction_reference?: string;

  @ApiPropertyOptional({
    description: 'When the money was received; defaults to now',
  })
  @IsOptional()
  @IsDateString()
  payment_date?: string;

  @ApiPropertyOptional({ description: 'Private reconciliation note' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class ConfirmDemoPaymentDto {
  @ApiProperty({ example: 'demo_8b14337b-fba2-4a7c-aad7-0e951115a9cd' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  transaction_id!: string;

  @ApiProperty({ example: '4242 4242 4242 4242' })
  @IsString()
  @Matches(/^[\d ]{16,23}$/)
  card_number!: string;

  @ApiProperty({ example: '12/30' })
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/)
  expiry!: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @Matches(/^\d{3}$/)
  cvc!: string;

  @ApiProperty({ example: 'SANAD TEST' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  cardholder_name!: string;
}

export class PaymentFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by payment status e.g. paid, pending, failed',
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Filter by transaction ID' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  transaction_id?: string;

  @ApiPropertyOptional({ description: 'Filter by order ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  order_id?: number;
}
