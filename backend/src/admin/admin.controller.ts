import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  CustomerFilterDto,
  UpdateCustomerStatusDto,
  ActivityLogFilterDto,
  PurgeActivityLogsDto,
  DashboardFilterDto,
} from './dto';
import { Roles, CurrentUser } from '../common/decorators';
import { UserRole } from '../common/enums';

@ApiTags('Admin')
@ApiBearerAuth('bearer')
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Admin Dashboard KPIs and real-time analytics' })
  async getDashboard(@Query() query: DashboardFilterDto) {
    return this.adminService.getDashboardStats(query);
  }

  @Get('customers')
  @ApiOperation({ summary: 'List all registered customers with statistics' })
  async getCustomers(@Query() query: CustomerFilterDto) {
    return this.adminService.getCustomers(query);
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get customer profile and order history' })
  async getCustomerDetails(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getCustomerDetails(id);
  }

  @Patch('customers/:id/status')
  @ApiOperation({ summary: 'Lock or unlock customer account' })
  async updateCustomerStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerStatusDto,
    @CurrentUser('id') adminId: number,
  ) {
    return this.adminService.updateCustomerStatus(id, dto, adminId);
  }

  @Get('activity-logs')
  @ApiOperation({
    summary: 'View audit activity logs of administrative actions',
  })
  async getActivityLogs(@Query() query: ActivityLogFilterDto) {
    return this.adminService.getActivityLogs(query);
  }

  @Post('activity-logs/purge')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Permanently remove audit logs before a retention cutoff',
  })
  async purgeActivityLogs(
    @Body() dto: PurgeActivityLogsDto,
    @CurrentUser('id') adminId: number,
  ) {
    return this.adminService.purgeActivityLogs(dto, adminId);
  }

  @Delete('activity-logs/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Permanently remove one audit activity log' })
  async deleteActivityLog(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') adminId: number,
  ) {
    return this.adminService.deleteActivityLog(id, adminId);
  }
}
