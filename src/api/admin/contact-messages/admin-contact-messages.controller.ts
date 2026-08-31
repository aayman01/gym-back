import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { sendResponse } from '@common/helpers/send.response';
import { paginatedSearchQuerySchema } from '@common/dto/paginated-search-query.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ContactMessageStatus } from '@prisma/client';
import { AdminContactMessagesService } from './admin-contact-messages.service';

const idSchema = z.object({ messageId: z.string().uuid() });
class MessageIdParamDto extends createZodDto(idSchema) {}

const listQuerySchema = paginatedSearchQuerySchema.extend({
  status: z.nativeEnum(ContactMessageStatus).optional(),
});
class ListContactMessagesQueryDto extends createZodDto(listQuerySchema) {}

const statusSchema = z.object({
  status: z.nativeEnum(ContactMessageStatus),
});
class UpdateContactMessageStatusDto extends createZodDto(statusSchema) {}

@Controller('admin/contact-messages')
export class AdminContactMessagesController {
  constructor(private readonly messages: AdminContactMessagesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: ListContactMessagesQueryDto) {
    const data = await this.messages.findAll(query);
    return sendResponse({
      success: true,
      message: 'Contact messages retrieved',
      data,
    });
  }

  @Get(':messageId')
  async findOne(@Param() param: MessageIdParamDto) {
    const data = await this.messages.findOne(param.messageId);
    return sendResponse({
      success: true,
      message: 'Contact message retrieved',
      data,
    });
  }

  @Patch(':messageId/status')
  async updateStatus(
    @Param() param: MessageIdParamDto,
    @Body() body: UpdateContactMessageStatusDto,
  ) {
    const data = await this.messages.updateStatus(
      param.messageId,
      body.status,
    );
    return sendResponse({
      success: true,
      message: 'Contact message status updated',
      data,
    });
  }
}
