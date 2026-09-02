import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHome() {
    return {
      message: 'Gym API backend server is running',
      service: 'gym-api',
      docs: '/api/v1/health',
    };
  }

  getHealth() {
    return {
      status: 'ok',
      message: 'Service is healthy',
      service: 'gym-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
