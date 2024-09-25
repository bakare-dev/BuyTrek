import { Controller } from '@nestjs/common';
import { CoreService } from '../service/core.service';

@Controller('/api/v1/core')
export class CoreController {
    constructor(private coreService: CoreService) {}
}
