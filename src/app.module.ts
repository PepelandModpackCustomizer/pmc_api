import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import {AuthModule} from "./auth/auth.module.js";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [ConfigModule.forRoot(), AuthModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
