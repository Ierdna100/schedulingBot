import { Application } from "../Application.js";
import { Authlevel } from "../dto/AuthLevel.js";
import { MongoModels } from "../dto/MongoModels.js";

export class PermissionsManager {
    public static async getUserAuthLevel(userId: string): Promise<Authlevel> {
        const userAuthData = (await Application.instance.collections.auth.findOne({
            userId: userId
        })) as unknown as MongoModels.AuthData | null;

        if (userAuthData == null) {
            return Authlevel.none;
        }

        return userAuthData.level;
    }

    public static async getUserBanned(userId: string): Promise<boolean> {
        const userBanData = (await Application.instance.collections.auth.findOne({
            userId: userId
        })) as unknown as MongoModels.BannedUser | null;

        if (userBanData == null) {
            return false;
        }

        return true;
    }
}
