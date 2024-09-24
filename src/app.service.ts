import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
    getHome() {
        return {
            api: '/api/v1',
            health: '/health',
            doc: '/swagger',
        };
    }

    getHealth() {
        return {
            status: 'server is running fine',
        };
    }
}
