import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiResponseDto } from '../common/dto/api-response.dto';

interface CSRFRequest extends Request {
  csrfToken?: string;
}

@ApiTags('Security')
@Controller('security')
export class CSRFController {
  @Get('csrf-token')
  @ApiOperation({ summary: 'Get CSRF token for form submissions' })
  @ApiResponse({ status: 200, description: 'CSRF token retrieved successfully' })
  getCSRFToken(@Req() req: CSRFRequest): ApiResponseDto<{ csrfToken: string }> {
    const token = req.csrfToken || 'no-token-available';
    return ApiResponseDto.success({ csrfToken: token });
  }
}