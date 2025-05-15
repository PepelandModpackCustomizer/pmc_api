import {Injectable} from "@nestjs/common";
import {neon, NeonQueryFunction} from "@neondatabase/serverless";

function decToBinBuiltIn(n: number): string {
    if (n < 0) throw new Error("Number should be a positive integer");
    return (n >>> 0).toString(2);
}

const  PermissionsMap: string[] = [
    "admin"
]

export class Permissions {
    constructor(permissions: number = 0) {
        this._permissions = permissions;
    }

    private _permissions: number = 0



    public set(key: string, value: boolean): Permissions {
        if (!PermissionsMap.includes(key)) {
            console.warn(`PermissionsMap mismatch: ${key}`)
            return this;
        }
        let binary = decToBinBuiltIn(this._permissions)
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
        let binary = decToBinBuiltIn(this._permissions)
        while (binary.length < PermissionsMap.length) {
            binary = "0" + binary
        }
        const index = binary.length - 1 - PermissionsMap.indexOf(key);
        return binary[index] == "1";
    }

    public getAll(): number {
        return this._permissions;
    }
}

export interface User {
    user_id: string,
    permissions: Permissions
}

@Injectable()
export class DatabaseService {
    // <core>
    async connect(): Promise<NeonQueryFunction<false, false>> {
        if (!process.env.DATABASE_URL) throw new Error("Missing database URL in .env");
        return neon(process.env.DATABASE_URL);
    }

    async doSql(query: string, params?: any){
        const sql = await this.connect();
        const res = await sql.query(query, params)
        return res;
    }

    async getRows(values: string, table: string, where: string, params?: any[], additional_query: string = "") {
        const res = await this.doSql(`SELECT ${values} FROM ${table} WHERE ${where} ${additional_query}`, params)
        return res;
    }

    async getSingleRow(values: string, table: string, where: string, params?: any[], additional_query: string = "") {
        const [res] = await this.getRows(values, table, where, params, additional_query);
        return res;
    }

    async insertRow(table: string, columns: string, values: string, params?: any[], additional_query: string = "") {
        await this.doSql(`INSERT INTO ${table} (${columns}) VALUES (${values}) ${additional_query}`, params)
    }

    async deleteRow(table: string, where: string, params?: any[], additional_query: string = "") {
        await this.doSql(`DELETE FROM ${table} WHERE ${where} ${additional_query}`, params)
    }
    // </core>

    // <auth>
    async getUser(user_id: bigint, values: string = "*") {
        const user = await this.getSingleRow(values, "Users", "user_id = $1", [user_id])
        const parsed_user = user as User;
        parsed_user.permissions = new Permissions(user["permissions"])
        return parsed_user;
    }

    async createUser(permissions: Permissions) {
        const convertedPermissions = permissions.getAll();
        await this.insertRow("Users", "permissions", "$1", [convertedPermissions])
    }

    async deleteUser(user_id: bigint) {
        await this.deleteRow("Users", "user_id = $1", [user_id])
    }
    // </auth>
}
