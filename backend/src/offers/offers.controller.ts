import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { CreateOfferDto, UpdateOfferDto } from './dto';
import { AdminPermissions, Public, Roles } from '../common/decorators';
import { UserRole } from '../common/enums';
import { AdminPermission } from '../common/permissions';
import { PaginationDto } from '../common/utils';

@ApiTags('Offers')
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all active offers (public)' })
  findAll() {
    return this.offersService.findAllPublic();
  }
}

@ApiTags('Admin - Offers')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin/offers')
export class AdminOffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  @AdminPermissions(AdminPermission.OFFERS_VIEW)
  @ApiOperation({ summary: 'Get all offers (admin)' })
  findAll(@Query() query: PaginationDto) {
    return this.offersService.findAllAdmin(query);
  }

  @Get(':id')
  @AdminPermissions(AdminPermission.OFFERS_VIEW)
  @ApiOperation({ summary: 'Get offer by ID (admin)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.offersService.findOneAdmin(id);
  }

  @Post()
  @AdminPermissions(AdminPermission.OFFERS_MANAGE)
  @ApiOperation({ summary: 'Create a new offer' })
  create(@Body() dto: CreateOfferDto) {
    return this.offersService.create(dto);
  }

  @Patch(':id')
  @AdminPermissions(AdminPermission.OFFERS_MANAGE)
  @ApiOperation({ summary: 'Update an offer' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOfferDto) {
    return this.offersService.update(id, dto);
  }

  @Delete(':id')
  @AdminPermissions(AdminPermission.OFFERS_MANAGE)
  @ApiOperation({ summary: 'Delete an offer' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.offersService.remove(id);
  }
}
