import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { CreateQueueEntryDto, UpdateQueueEntryDto, QueueEntryResponseDto, QueueQueryDto } from './dto';
import { plainToClass } from 'class-transformer';

@Controller('queue')
@UseInterceptors(ClassSerializerInterceptor)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post()
  async addToQueue(@Body() createQueueEntryDto: CreateQueueEntryDto): Promise<QueueEntryResponseDto> {
    const queueEntry = await this.queueService.addToQueue(createQueueEntryDto);
    return plainToClass(QueueEntryResponseDto, queueEntry);
  }

  @Get()
  async findAll(@Query() query: QueueQueryDto): Promise<QueueEntryResponseDto[]> {
    const queueEntries = await this.queueService.findAll(query);
    return queueEntries.map(entry => plainToClass(QueueEntryResponseDto, entry));
  }

  @Get('current')
  async getCurrentQueue(): Promise<QueueEntryResponseDto[]> {
    const queueEntries = await this.queueService.getCurrentQueue();
    return queueEntries.map(entry => plainToClass(QueueEntryResponseDto, entry));
  }

  @Get('stats')
  async getQueueStats() {
    return await this.queueService.getQueueStats();
  }

  @Get('search')
  async searchQueue(@Query('q') searchTerm: string): Promise<QueueEntryResponseDto[]> {
    const queueEntries = await this.queueService.searchQueue(searchTerm);
    return queueEntries.map(entry => plainToClass(QueueEntryResponseDto, entry));
  }

  @Get('number/:queueNumber')
  async findByQueueNumber(
    @Param('queueNumber', ParseIntPipe) queueNumber: number,
  ): Promise<QueueEntryResponseDto> {
    const queueEntry = await this.queueService.findByQueueNumber(queueNumber);
    return plainToClass(QueueEntryResponseDto, queueEntry);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<QueueEntryResponseDto> {
    const queueEntry = await this.queueService.findOne(id);
    return plainToClass(QueueEntryResponseDto, queueEntry);
  }

  @Patch(':id')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQueueEntryDto: UpdateQueueEntryDto,
  ): Promise<QueueEntryResponseDto> {
    const queueEntry = await this.queueService.updateStatus(id, updateQueueEntryDto);
    return plainToClass(QueueEntryResponseDto, queueEntry);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFromQueue(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.queueService.removeFromQueue(id);
  }
}