import { BadRequestException, Injectable } from '@nestjs/common';
import { ContactMessageStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { SubmitContactDto } from './dto/submit-contact.dto';

@Injectable()
export class PublicContactService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(dto: SubmitContactDto) {
    if (dto.website && dto.website.trim().length > 0) {
      throw new BadRequestException('Invalid submission');
    }

    const config = await this.prisma.storeConfig.findFirst({
      where: { deletedAt: null },
      select: { contactFormEnabled: true },
    });

    if (config && !config.contactFormEnabled) {
      throw new BadRequestException('Contact form is currently disabled');
    }

    const row = await this.prisma.contactMessage.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone?.trim() ? dto.phone.trim() : null,
        subject: dto.subject?.trim() ? dto.subject.trim() : null,
        message: dto.message,
        status: ContactMessageStatus.NEW,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    return row;
  }
}
