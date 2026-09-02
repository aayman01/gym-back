import { Controller, Get } from '@nestjs/common';
import { Public } from '@common/decorators/public.decorator';
import { AppService } from './app.service';

@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHome() {
    return this.appService.getHome();
  }

  @Get('health')
  healthCheck() {
    return this.appService.getHealth();
  }
}
