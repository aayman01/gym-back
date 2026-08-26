import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { sendResponse } from '@common/helpers/send.response';
import { PaginatedSearchQueryDto } from '@common/dto/paginated-search-query.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AdminBannersService } from './admin-banners.service';

const idSchema = z.object({ bannerId: z.string().uuid() });
class BannerIdParamDto extends createZodDto(idSchema) {}

const upsertSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional().nullable(),
  buttonText: z.string().trim().max(50).optional().nullable(),
  buttonLink: z.string().trim().max(500).optional().nullable(),
  mediaId: z.string().uuid().optional().nullable(),
});
class CreateBannerDto extends createZodDto(upsertSchema) {}
class UpdateBannerDto extends createZodDto(upsertSchema.partial()) {}

@Controller('admin/banners')
export class AdminBannersController {
  constructor(private readonly banners: AdminBannersService) {}

  @Post()
  async create(@Body() body: CreateBannerDto) {
    const data = await this.banners.create(body);
    return sendResponse({ success: true, message: 'Banner created', data });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: PaginatedSearchQueryDto) {
    const data = await this.banners.findAll(query);
    return sendResponse({ success: true, message: 'Banners retrieved', data });
  }

  @Get(':bannerId')
  async findOne(@Param() param: BannerIdParamDto) {
    const data = await this.banners.findOne(param.bannerId);
    return sendResponse({ success: true, message: 'Banner retrieved', data });
  }

  @Patch(':bannerId')
  async update(@Param() param: BannerIdParamDto, @Body() body: UpdateBannerDto) {
    const data = await this.banners.update(param.bannerId, body);
    return sendResponse({ success: true, message: 'Banner updated', data });
  }

  @Delete(':bannerId')
  async remove(@Param() param: BannerIdParamDto) {
    const data = await this.banners.remove(param.bannerId);
    return sendResponse({ success: true, message: 'Banner deleted', data });
  }
}
