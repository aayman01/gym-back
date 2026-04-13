import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TaxAdminService } from './tax-admin.service';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';
import { GetTaxesQueryDto } from './dto/get-taxes-query.dto';
import { TaxIdParamDto } from './dto/tax-id-param.dto';
import { sendResponse } from '../../../common/helpers/send.response';

@Controller('admin/taxes')
export class TaxAdminController {
  constructor(private readonly taxAdminService: TaxAdminService) {}

  @Post()
  async create(@Body() body: CreateTaxDto) {
    const data = await this.taxAdminService.create(body);
    return sendResponse({
      success: true,
      message: 'Tax created successfully',
      data,
    });
  }

  @Get()
  async findAll(@Query() query: GetTaxesQueryDto) {
    const data = await this.taxAdminService.findAll(query);
    return sendResponse({
      success: true,
      message: 'Taxes retrieved successfully',
      data,
    });
  }

  @Get('default')
  async getDefault() {
    const data = await this.taxAdminService.getDefault();
    return sendResponse({
      success: true,
      message: 'Default tax retrieved successfully',
      data,
    });
  }

  @Patch(':taxId/set-default')
  async setDefault(@Param() param: TaxIdParamDto) {
    const data = await this.taxAdminService.setDefault(param.taxId);
    return sendResponse({
      success: true,
      message: 'Tax set as default successfully',
      data,
    });
  }

  @Patch(':taxId/unset-default')
  async unsetDefault(@Param() param: TaxIdParamDto) {
    const data = await this.taxAdminService.unsetDefault(param.taxId);
    return sendResponse({
      success: true,
      message: 'Tax unset as default successfully',
      data,
    });
  }

  @Patch(':taxId/activate')
  async activate(@Param() param: TaxIdParamDto) {
    const data = await this.taxAdminService.activate(param.taxId);
    return sendResponse({
      success: true,
      message: 'Tax activated successfully',
      data,
    });
  }

  @Patch(':taxId/deactivate')
  async deactivate(@Param() param: TaxIdParamDto) {
    const data = await this.taxAdminService.deactivate(param.taxId);
    return sendResponse({
      success: true,
      message: 'Tax deactivated successfully',
      data,
    });
  }

  @Get(':taxId')
  async findOne(@Param() param: TaxIdParamDto) {
    const data = await this.taxAdminService.findOne(param.taxId);
    return sendResponse({
      success: true,
      message: 'Tax retrieved successfully',
      data,
    });
  }

  @Patch(':taxId')
  async update(
    @Param() param: TaxIdParamDto,
    @Body() body: UpdateTaxDto,
  ) {
    const data = await this.taxAdminService.update(param.taxId, body);
    return sendResponse({
      success: true,
      message: 'Tax updated successfully',
      data,
    });
  }

  @Delete(':taxId')
  async remove(@Param() param: TaxIdParamDto) {
    const data = await this.taxAdminService.remove(param.taxId);
    return sendResponse({
      success: true,
      message: 'Tax deleted successfully',
      data,
    });
  }
}
