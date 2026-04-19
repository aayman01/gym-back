import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { sendResponse } from '@common/helpers/send.response';
import { CurrentAdmin } from '@common/decorators/current-admin.decorator';
import type { AdminSessionData } from '../auth/types/admin-session.types';
import { AdminGalleryService } from './admin-gallery.service';
import { GetGalleryQueryDto } from './dto/get-gallery-query.dto';
import { AddToGalleryDto } from './dto/add-to-gallery.dto';
import { SwapGalleryOrderDto } from './dto/swap-gallery-order.dto';
import { MediaIdParamDto } from './dto/media-id-param.dto';

@Controller('admin/gallery')
export class AdminGalleryController {
  constructor(private readonly galleryService: AdminGalleryService) {}

  @Get()
  async findAll(@Query() query: GetGalleryQueryDto) {
    const data = await this.galleryService.findAll(query);
    return sendResponse({
      success: true,
      message: 'Gallery items retrieved successfully',
      data,
    });
  }

  @Post()
  async add(
    @CurrentAdmin() admin: AdminSessionData,
    @Body() body: AddToGalleryDto,
  ) {
    const data = await this.galleryService.addToGallery(admin.id, body);
    return sendResponse({
      success: true,
      message: 'Media added to gallery successfully',
      data,
    });
  }

  @Patch('swap-order')
  async swap(@Body() body: SwapGalleryOrderDto) {
    await this.galleryService.swapOrder(body);
    return sendResponse({
      success: true,
      message: 'Gallery order updated successfully',
      data: null,
    });
  }

  @Get(':mediaId')
  async findOne(@Param() params: MediaIdParamDto) {
    const data = await this.galleryService.findOne(params.mediaId);
    return sendResponse({
      success: true,
      message: 'Gallery item retrieved successfully',
      data,
    });
  }

  @Delete(':mediaId')
  async remove(@Param() params: MediaIdParamDto) {
    const data = await this.galleryService.removeFromGallery(params.mediaId);
    return sendResponse({
      success: true,
      message: 'Media removed from gallery successfully',
      data,
    });
  }
}
