import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {AuthModule} from "./auth/auth.module";
import { ConfigModule } from "@nestjs/config";
import { DatabaseService } from "./database/db.service";

@Module({
    imports: [ConfigModule.forRoot(), AuthModule],
    controllers: [AppController],
    providers: [AppService, DatabaseService],
})
export class AppModule {}
