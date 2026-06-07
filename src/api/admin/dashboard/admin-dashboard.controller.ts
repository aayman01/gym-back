import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { sendResponse } from '@common/helpers/send.response';
import { AdminDashboardService } from './admin-dashboard.service';
import { GetDashboardQueryDto } from './dto/get-dashboard-query.dto';

@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getDashboard(@Query() query: GetDashboardQueryDto) {
    const data = await this.adminDashboardService.getDashboard(query.period);
    return sendResponse({
      success: true,
      message: 'Dashboard data retrieved',
      data,
    });
  }
}
