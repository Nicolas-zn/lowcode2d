import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { CreateTemplateDto } from './dto/create-template.dto'
import { TemplatesRepository } from './templates.repository'

@Injectable()
export class TemplatesService {
  constructor(private readonly templatesRepository: TemplatesRepository) {}

  async getByHash(hashValue: string) {
    const template = await this.templatesRepository.findByHash(hashValue)
    if (!template) throw new NotFoundException('Template not found')
    return this.present(template)
  }

  async create(dto: CreateTemplateDto) {
    const template = await this.templatesRepository.create(
      dto.hashValue.trim(),
      dto.template as Prisma.InputJsonValue
    )
    return this.present(template)
  }

  private present(template: {
    id: bigint
    createdAt: Date
    hashValue: string | null
    template: Prisma.JsonValue | null
  }) {
    return {
      ...template,
      id: template.id.toString()
    }
  }
}
