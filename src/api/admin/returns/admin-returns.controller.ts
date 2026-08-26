import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { sendResponse } from '@common/helpers/send.response';
import { PaginatedSearchQueryDto } from '@common/dto/paginated-search-query.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ReturnRequestStatus } from '@prisma/client';
import { AdminReturnsService } from './admin-returns.service';

const idSchema = z.object({ returnId: z.string().uuid() });
class ReturnIdParamDto extends createZodDto(idSchema) {}

const statusSchema = z.object({
  status: z.nativeEnum(ReturnRequestStatus),
  adminComment: z.string().max(2000).optional().nullable(),
});
class UpdateReturnStatusDto extends createZodDto(statusSchema) {}

@Controller('admin/returns')
export class AdminReturnsController {
  constructor(private readonly returns: AdminReturnsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: PaginatedSearchQueryDto) {
    const data = await this.returns.findAll(query);
    return sendResponse({ success: true, message: 'Returns retrieved', data });
  }

  @Get(':returnId')
  async findOne(@Param() param: ReturnIdParamDto) {
    const data = await this.returns.findOne(param.returnId);
    return sendResponse({ success: true, message: 'Return retrieved', data });
  }

  @Patch(':returnId/status')
  async updateStatus(
    @Param() param: ReturnIdParamDto,
    @Body() body: UpdateReturnStatusDto,
  ) {
    const data = await this.returns.updateStatus(
      param.returnId,
      body.status,
      body.adminComment,
    );
    return sendResponse({ success: true, message: 'Return status updated', data });
  }
}
