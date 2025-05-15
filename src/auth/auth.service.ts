import {Injectable} from "@nestjs/common";
import { DatabaseService } from "../database/db.service";

@Injectable()
export class AuthService {
    constructor(private readonly dbService: DatabaseService) {
    }

    async isUserExists(userId: bigint) {
        const user = this.dbService.getUser(userId)
        return user != undefined
    }

    async loginDiscord(code: string) {
        return await this.dbService.getUser(BigInt(1))
    }

    private async registerDiscord(discordId: bigint) {

    }
}
