import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      success: true,
      message: 'Front Desk System API is running',
      timestamp: new Date().toISOString(),
    };
  }
}