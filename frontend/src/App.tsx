import root from 'react-shadow';
import parser from 'html-react-parser'
import './App.css'
import miniprofileCSS from './assets/steam/shared_global.css'
import pointsIcon from './assets/steam/points-icon.svg'
import {
    AddMarketURIToEquippedItemsViaGolang,
    GetEquippedItemsViaGolang,
    GetPageBodyViaGolang,
    GetSteam32IDViaGolang,
    OpenCustomURLViaGolang, PutMarketPriceToEquippedItemViaGolang
} from "../wailsjs/go/main/App";
import React, {useEffect, useState} from "react";
import ApiKeyForm from "./components/ApiKeyForm";
import SettingsModal from "./components/SettingsModal";
import {openSteamLink, steam32to64} from "./util";
import {main} from "../wailsjs/go/models";
import EquippedItem = main.EquippedItem;

function App() {
    const domParser = new DOMParser();
    const [apiKey, setApiKey] = useState("");
    const [user32Id, setUser32Id] = useState<string>("Not set");
    const [equippedItems, setEquippedItems] = useState<Array<EquippedItem>>([]);
    const [apiInputStatus, setApiInputStatus] = useState<number>(0);
    const [profileInput, setProfileInput] = useState<string>("");
    const [miniprofile, setMiniprofile] = useState<string | JSX.Element | JSX.Element[]>();
    const [isAuto, setAuto] = useState<boolean>(false);
    const [isLoadingProfile, setLoadingProfile] = useState<boolean>(false);
    const [isLoadingItems, setLoadingItems] = useState<boolean>(false);
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [openLinksInSteam, setOpenLinksInSteam] = useState<number>(2);

    function handleProfileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        const inputValue = event.target.value;
        const regex = /^[A-Za-z\d/.:]*$/;
        if (regex.test(inputValue)) {
            setProfileInput(inputValue);
        }
    }

    function fetchMiniProfile(id: string) {
        GetPageBodyViaGolang(`https://steamcommunity.com/miniprofile/${id}.html`).then((result) => {
            const miniprofile = parser(domParser.parseFromString(result, "text/html").body.innerHTML, {});
            setMiniprofile(miniprofile);
        }).catch((err) => console.error(err)).finally(() => setLoadingProfile(false));
    }

    function inspectProfile() {
        if (profileInput.length === 0) {
            return;
        }
        const matches = profileInput.match(/\/(id|profiles)\/(\d+|[a-zA-Z\d_-]+)/);
        const profileURI = matches && matches.length >= 3 ? matches[2] : profileInput;

        const fetchProfileData = (profileURI: string, apiKey: string = "") => {
            setLoadingProfile(true);
            setMiniprofile("");
            setLoadingItems(true);
            setEquippedItems([]);
            GetSteam32IDViaGolang(profileURI, apiKey).then(
                (result) => {
                    const user32Id = result;
                    setUser32Id(user32Id);

                    GetEquippedItemsViaGolang(steam32to64(parseInt(user32Id)), "russian").then(
                        (result) => {
                            setEquippedItems(result.sort((a, b) => a.community_item_class - b.community_item_class));
                            AddMarketURIToEquippedItemsViaGolang(result)
                                .then((result) => {
                                    const equippedItemsWithMarketURI = result.sort(
                                        (a, b) => a.community_item_class - b.community_item_class
                                    );
                                    console.log(equippedItemsWithMarketURI);
                                    setEquippedItems(equippedItemsWithMarketURI);
                                })
                                .catch((err) => console.error(err))
                                .finally(() => setLoadingItems(false));
                        }
                    ).catch((err) => console.error(err));

                    fetchMiniProfile(user32Id);
                }
            ).catch((err: string) => {
                if (err === "API key not authorized to access Steam API") {
                    setApiKey("");
                    setApiInputStatus(-1);
                    fetchProfileData(profileURI);
                } else {
                    setLoadingProfile(false);
                    setLoadingItems(false);
                }
            }).finally(() => {
                setLoadingProfile(false)
            });
        };

        fetchProfileData(profileURI, apiKey);
    }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Enter" && !isLoadingProfile) {
                event.preventDefault();
                inspectProfile();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    });

    useEffect(() => {
        let timerId: number | null = null;
        if (isAuto) {
            timerId = setTimeout(() => {
                inspectProfile();
            }, 300);
        }
        return () => {
            if (timerId) clearTimeout(timerId);
        };
    }, [profileInput, isAuto]);

    return (
        <div className="min-h-screen grid grid-cols-1 place-items-start justify-items-center mx-auto py-8 bg-store">
            <button id={"settings-button"}
                    className="absolute top-0 right-0 block text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-bl text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    type="button" onClick={() => setShowSettings(!showSettings)}>
                Settings
            </button>
            <ApiKeyForm setApiKey={setApiKey} status={apiInputStatus} setStatus={setApiInputStatus}
                        openLinksInSteam={openLinksInSteam}/>
            <div
                className="text-blue-900 bg-white text-2xl font-bold font-mono p-1 flex flex-col items-center rounded-lg">
                <div className="flex">
          <span
              className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md dark:bg-gray-600 dark:text-gray-400 dark:border-gray-600">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true"
                 xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path
                d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z"/></svg>
          </span>
                    <input value={profileInput} onChange={handleProfileInputChange} type="text"
                           className="rounded-none rounded-r-lg bg-gray-50 border text-gray-900 focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                           placeholder="Levosilimo"/>
                </div>
                <button onClick={inspectProfile}
                        className={"bg-blue-500 block hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 mt-2 border-blue-700 hover:border-blue-500 rounded " + (isLoadingProfile ? "cursor-progress" : "cursor-pointer")}>
                    {isLoadingProfile ? (<span className={"inline-block"}><svg aria-hidden="true" role="status"
                                                                               className="inline w-4 h-4 mr-3 text-white animate-spin"
                                                                               viewBox="0 0 100 101" fill="none"
                                                                               xmlns="http://www.w3.org/2000/svg">
            <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="#E5E7EB"/>
            <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentColor"/>
          </svg>
              Loading...</span>) : ("Inspect Profile")}
                </button>
            </div>
            <root.div className="miniprofile_wrapper">
                {(miniprofile as JSX.Element)}
                <style type="text/css">{miniprofileCSS}</style>
            </root.div>
            {(isLoadingItems && !equippedItems.length) ? (<svg aria-hidden="true" role="status"
                                                               className="inline w-4 h-4 mr-3 text-white animate-spin"
                                                               viewBox="0 0 100 101" fill="none"
                                                               xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="#E5E7EB"/>
                <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentColor"/>
            </svg>) : (<div
                className={"grid mt-2 grid-cols-3 gap-2 text-center rounded bg-gray-50 shadow-inner dark:bg-gray-700" + " " + (equippedItems.length ? "p-2" : "")}>
                {equippedItems.map((item) => (
                    <div key={item.item_image_uri} className={"relative"}>
                        <div style={{width: '100%', height: '100%'}}
                             className={"bg-gray-100 rounded-lg dark:bg-gray-800"}>
                            {item.item_image_uri.endsWith('.mp4') ? (
                                <video autoPlay loop muted
                                       style={{height: '150px', width: "267px", objectFit: 'fill'}}>
                                    <source
                                        src={`https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/items/${item.appid}/${item.item_image_uri}`}
                                        type="video/mp4"/>
                                </video>
                            ) : (
                                <img
                                    src={`https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/items/${item.appid}/${item.item_image_uri}`}
                                    style={{
                                        height: '150px',
                                        margin: 'auto',
                                        objectFit: 'cover'
                                    }}/>
                            )}
                            <div className={"equipped-item-lore-wrapper rounded-br-xl"}
                                 style={{top: "0%", left: "0%"}}>
                                <h4>{item.item_title}</h4>
                            </div>
                            <button onClick={() => {
                                if (item.is_active_definition) openSteamLink(item.item_points_uri, openLinksInSteam)
                            }}
                                    className={"text-white rounded px-2 mx-1 uppercase inline-flex items-center gap-1 flex-row-reverse tracking-wide" + " " + (item.is_active_definition ? "bg-blue-500" : "bg-blue-300 cursor-not-allowed")}>
                                <img className="h-4 w-4" src={pointsIcon}/>
                                {item.point_cost}
                            </button>
                            <button onClick={() => {
                                if (item.item_market_uri) openSteamLink(item.item_market_uri, openLinksInSteam)
                            }}
                                    className={"text-white rounded px-2 mx-1 uppercase inline-flex tracking-wide" + " " + (item.item_market_uri ? "bg-blue-500" : "bg-blue-300 cursor-not-allowed")}>
                                {isLoadingItems ? (<span className={"inline-block"}><svg aria-hidden="true"
                                                                                         role="status"
                                                                                         className="inline w-4 h-4 mr-3 text-white animate-spin"
                                                                                         viewBox="0 0 100 101"
                                                                                         fill="none"
                                                                                         xmlns="http://www.w3.org/2000/svg">
            <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="#E5E7EB"/>
            <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentColor"/>
          </svg>
              Loading...</span>) : item.item_market_price ? (<span>{item.item_market_price}</span>) : (<span>Market</span>)}
                            </button>
                        </div>
                    </div>
                ))}
            </div>)
            }
            <SettingsModal show={showSettings} setShow={setShowSettings} checkedRadio={openLinksInSteam}
                           setRadio={setOpenLinksInSteam}/>
        </div>
    )
}

export default App
