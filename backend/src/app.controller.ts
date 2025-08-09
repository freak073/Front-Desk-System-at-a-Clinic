import { ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';

@ApiTags('Health')
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