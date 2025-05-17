import { HttpException, Injectable } from "@nestjs/common";
import { DatabaseService } from "../database/db.service";
import DiscordOAuth from "easy-discord-oauth";
import { Permissions, User } from "../database/types";

@Injectable()
export class AuthService {
    constructor(private readonly dbService: DatabaseService) {}

    async createSession(userId: bigint, scope?: Permissions) {
        const user = await this.dbService.getUser(userId);
        if (!user) throw new HttpException("User does not exist", 404);
    }

    async loginDiscord(code: string) {
        const discordRedirectUrl = process.env.DISCORD_REDIRECT_URL;
        const discordClientId = process.env.DISCORD_CLIENT_ID;
        const discordClientSecret = process.env.DISCORD_CLIENT_SECRET;
        if (!discordRedirectUrl || !discordClientId || !discordClientSecret)
            throw new HttpException("Internal Error", 500);
        const discordTokenRes = await DiscordOAuth.exchangeCode(
            code,
            discordRedirectUrl,
            discordClientId,
            discordClientSecret
        );
        const discordToken = discordTokenRes.accessToken;

        const discordUserId = BigInt(
            (await DiscordOAuth.User.getCurrentUser(discordToken)).id
        );
        const integrations =
            await this.dbService.getUserIntegrationsDiscord(discordUserId);
        let user;
        if (!integrations || !integrations.discord_id) {
            user = await this.registerDiscord(discordUserId);
        } else {
            user = await this.dbService.getUser(integrations.user_id);
        }
    }

    async registerDiscord(discordId: bigint): Promise<User> {
        const user = await this.dbService.createUser(Permissions.DEFAULT);
        if (!user) throw new HttpException("Failed to register new user", 500);
        await this.dbService.setUserIntegration(
            user.user_id,
            "discord_id",
            discordId
        );
        return user;
    }
}
