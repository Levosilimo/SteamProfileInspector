import {useState} from "react";
import {GetPageBodyViaGolang} from "../../wailsjs/go/main/App";
import parser from "html-react-parser";
import MiniprofileShadow from "./MiniprofileShadow";

function ProfileForm({ apiKey }: any) {
  const domParser = new DOMParser();
  const [profileInput, setProfileInput] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [miniprofile, setMiniprofile] = useState(null);

  const handleProfileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProfileInput(event.target.value);
  };

  async function getSteam32Id(profileInput: string, apiKey: string) {
    const matches = profileInput.match(/\/(id|profiles)\/(\d+|[a-zA-Z\d_-]+)/);
    if (matches && matches.length >= 3) {
      return matches[2];
    } else {
      const vanityUrl = profileInput.trim().toLowerCase().replace(/\s/g, "");
      const response = await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${apiKey}&vanityurl=${vanityUrl}`);
      const data = await response.json();
      if (data.response.success === 1) {
        return data.response.steamid;
      } else {
        throw new Error("Profile not found");
      }
    }
  }

  async function getMiniprofile(id: string) {
    let miniprofile;
    await GetPageBodyViaGolang(`https://steamcommunity.com/miniprofile/${id}.html`).then((result) => {
      miniprofile = parser(domParser.parseFromString(result, "text/html").body.innerHTML, {});
    }).catch((err) => console.error(err));
    if(miniprofile) return miniprofile;
    return null;
  }

  const inspectProfile = async () => {
    setLoading(true);
    const id = await getSteam32Id(profileInput, apiKey);
    const miniprofile = await getMiniprofile(id);
    if (miniprofile) setMiniprofile(miniprofile);
    setLoading(false);
  };

  return (
    <div className="">
      <div className="flex">
        <span className=""></span>
        <input
          value={profileInput}
          onChange={handleProfileInputChange}
          type="text"
          className=""
          placeholder="Levosilimo"
        />
      </div>
      <button onClick={inspectProfile} className="">
        {isLoading ? <span className={"inline-block"}>Loading...</span> : "Inspect Profile"}
      </button>
      {miniprofile && <MiniprofileShadow miniprofile={miniprofile} />}
    </div>
  );
}