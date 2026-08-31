import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminContactMessagesController } from './admin-contact-messages.controller';
import { AdminContactMessagesService } from './admin-contact-messages.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminContactMessagesController],
  providers: [AdminContactMessagesService],
})
export class AdminContactMessagesModule {}
