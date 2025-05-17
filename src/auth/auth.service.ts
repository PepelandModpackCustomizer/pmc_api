import {Injectable} from "@nestjs/common";
import { DatabaseService } from "../database/db.service.js";
import DiscordOAuth from "easy-discord-oauth";
import { Permissions, User } from "../database/types.js";

@Injectable()
export class AuthService {
    constructor(private readonly dbService: DatabaseService) {
    }

    async isUserExists(userId: bigint) {
        const user = this.dbService.getUser(userId)
        return user != undefined
    }

    async loginDiscord(code: string) {
        if (!process.env.DISCORD_REDIRECT_URL ||
            !process.env.DISCORD_CLIENT_ID ||
            !process.env.DISCORD_CLIENT_SECRET) throw new Error();
        const discordTokenRes = await DiscordOAuth.exchangeCode(
            code,
            process.env.DISCORD_REDIRECT_URL,
            process.env.DISCORD_CLIENT_ID,
            process.env.DISCORD_CLIENT_SECRET
        )
        const discordToken = discordTokenRes.accessToken
        const discordUserId = BigInt((await DiscordOAuth.User.getCurrentUser(discordToken)).id)
        const integrations = await this.dbService.getUserIntegrationsDiscord(discordUserId)
        let user;
        if (!integrations || !integrations.discord_id) {
            user = this.registerDiscord(discordUserId)
        } else {
            user = this.dbService.getUser(integrations.user_id)
        }
        console.log(user)
    }

    async registerDiscord(discordId: bigint): Promise<User> {
        const user = await this.dbService.createUser(Permissions.DEFAULT)
        if (!user) throw new Error("User registration failed");
        await this.dbService.setUserIntegration(user.user_id, "discord_id", discordId)
        return user;
    }
}
