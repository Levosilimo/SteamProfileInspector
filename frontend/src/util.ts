import {OpenCustomURLViaGolang} from "../wailsjs/go/main/App";

export function steam32to64(steam32: number) {
    return '765' + (steam32 + 61197960265728).toString();
}

export function openSteamLink(url: string, openLinksInSteam: number) {
    switch (openLinksInSteam) {
        case 0:
            return OpenCustomURLViaGolang(url, "", "");
        case 1:
            return OpenCustomURLViaGolang("steam://openurl/"+url, "", "");
        default:
            return OpenCustomURLViaGolang("steam://openurl/"+url, url, "steam");
    }
}