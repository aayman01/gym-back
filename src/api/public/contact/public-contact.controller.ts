import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '@common/decorators/public.decorator';
import { sendResponse } from '@common/helpers/send.response';
import { SubmitContactDto } from './dto/submit-contact.dto';
import { PublicContactService } from './public-contact.service';

@Public()
@Controller('public/contact')
export class PublicContactController {
  constructor(private readonly contact: PublicContactService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async submit(@Body() body: SubmitContactDto) {
    const data = await this.contact.submit(body);
    return sendResponse({
      success: true,
      message: 'Inquiry submitted successfully',
      data,
    });
  }
}
