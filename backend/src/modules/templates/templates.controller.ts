import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { CreateTemplateDto } from './dto/create-template.dto'
import { TemplatesService } from './templates.service'

@ApiTags('Templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get(':hashValue')
  getByHash(@Param('hashValue') hashValue: string) {
    return this.templatesService.getByHash(hashValue)
  }

  @Post()
  create(@Body() dto: CreateTemplateDto) {
    return this.templatesService.create(dto)
  }
}
