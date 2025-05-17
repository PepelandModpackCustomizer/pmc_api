function decToBin(n: number): string {
    if (n < 0) throw new Error("Number should be a positive integer");
    return (n >>> 0).toString(2);
}

export const PermissionsMap: string[] = [
    "admin"
]

export class Permissions {
    constructor(permissions: number = 0) {
        this._permissions = permissions;
    }

    private _permissions: number = 0

    public static DEFAULT = new Permissions()
    public static ALL = new Permissions().setAll(true)

    public set(key: string, value: boolean): Permissions {
        if (!PermissionsMap.includes(key)) {
            console.warn(`PermissionsMap mismatch: ${key}`)
            return this;
        }
        let binary = decToBin(this._permissions)
        while (binary.length < PermissionsMap.length) {
            binary = "0" + binary
        }
        const index = binary.length - 1 - PermissionsMap.indexOf(key);
        let result = "";
        result = binary.slice(0, index) + (value ? "1" : "0")
        if (index + 1 < binary.length) result += binary.slice(index + 1);
        this._permissions = parseInt(result, 2);
        return this;
    }

    public get(key: string): boolean {
        if (!PermissionsMap.includes(key)) {
            console.warn(`PermissionsMap mismatch: ${key}`)
            return false;
        }
        let binary = decToBin(this._permissions)
        while (binary.length < PermissionsMap.length) {
            binary = "0" + binary
        }
        const index = binary.length - 1 - PermissionsMap.indexOf(key);
        return binary[index] == "1";
    }

    public setAll(value: boolean): Permissions {
        let binary = "";
        while (binary.length < PermissionsMap.length) {
            binary += "1";
        }
        this._permissions = parseInt(binary, 2)
        return this;
    }

    public getAll(): number {
        return this._permissions;
    }
}

export interface User {
    user_id: bigint,
    permissions: Permissions
}

export interface UserIntegrations {
    user_id: bigint,
    discord_id?: bigint
}
