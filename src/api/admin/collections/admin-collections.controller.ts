import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { sendResponse } from '@common/helpers/send.response';
import { PaginatedSearchQueryDto } from '@common/dto/paginated-search-query.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CollectionType } from '@prisma/client';
import { AdminCollectionsService } from './admin-collections.service';

const idSchema = z.object({ collectionId: z.string().uuid() });
class CollectionIdParamDto extends createZodDto(idSchema) {}

const upsertSchema = z.object({
  title: z.string().trim().min(1).max(255),
  subTitle: z.string().trim().max(255).optional().nullable(),
  slug: z.string().trim().min(1).max(255),
  type: z.nativeEnum(CollectionType).optional(),
  isActive: z.boolean().optional(),
  productIds: z.array(z.string().uuid()).optional(),
});
class UpsertCollectionDto extends createZodDto(upsertSchema) {}

const updateSchema = upsertSchema.partial();
class UpdateCollectionDto extends createZodDto(updateSchema) {}

@Controller('admin/collections')
export class AdminCollectionsController {
  constructor(private readonly collections: AdminCollectionsService) {}

  @Post()
  async create(@Body() body: UpsertCollectionDto) {
    const data = await this.collections.create(body);
    return sendResponse({ success: true, message: 'Collection created', data });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: PaginatedSearchQueryDto) {
    const data = await this.collections.findAll(query);
    return sendResponse({ success: true, message: 'Collections retrieved', data });
  }

  @Get(':collectionId')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() param: CollectionIdParamDto) {
    const data = await this.collections.findOne(param.collectionId);
    return sendResponse({ success: true, message: 'Collection retrieved', data });
  }

  @Patch(':collectionId')
  async update(
    @Param() param: CollectionIdParamDto,
    @Body() body: UpdateCollectionDto,
  ) {
    const data = await this.collections.update(param.collectionId, body);
    return sendResponse({ success: true, message: 'Collection updated', data });
  }

  @Delete(':collectionId')
  async remove(@Param() param: CollectionIdParamDto) {
    const data = await this.collections.remove(param.collectionId);
    return sendResponse({ success: true, message: 'Collection deleted', data });
  }
}
