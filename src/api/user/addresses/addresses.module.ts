import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { UserAuthModule } from '../auth/user-auth.module';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';

@Module({
  imports: [PrismaModule, UserAuthModule],
  controllers: [AddressesController],
  providers: [AddressesService],
})
export class AddressesModule {}
