import React, {Dispatch, SetStateAction, useEffect} from 'react';
import {STEAM_CURRENCIES, SteamCurrencyInfo} from "../constants";
import {main} from "../../wailsjs/go/models";
import AppSettings = main.AppSettings;

interface settingsProps {
    settings: AppSettings
    setSettings: Dispatch<SetStateAction<AppSettings>>;
    show: boolean;
    setShow: (arg0: boolean) => void;
}

const SettingsModal = ({settings, setSettings, show, setShow}: settingsProps) => {

    const closeModal = (e: React.MouseEvent | MouseEvent) => {
        if(e.target instanceof HTMLElement && e.target.id==="settings-button") {
            return;
        }
        setShow(false);
    }

    useEffect(() => {
        window.addEventListener("click", closeModal);
        return(() => window.removeEventListener("click", closeModal));
    }, []);

    function handleOptionChange(e: React.ChangeEvent<HTMLInputElement>) {
        setSettings(prevSettings => ({
            ...prevSettings,
            open_links_in_steam: Number(e.target.value)
        }));
    }

    function handleCurrencyChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const selectedCurrencyId = parseInt(event.target.value);
        const selectedCurrency = STEAM_CURRENCIES.find(currency => currency.id === selectedCurrencyId);
        if (selectedCurrency) {
            setSettings(prevSettings => ({
                ...prevSettings,
                steam_currency: Number(selectedCurrency.id)
            }));
        }
    }

    return (
            <div className={"fixed z-10 left-1/2 top-1/2 transform -translate-x-1/2 w-max bg-white rounded-lg transition shadow-xl dark:bg-gray-700 " + (show ? "-translate-y-1/2" : "-translate-y-30/1")} onClick={(e) => e.stopPropagation()}>
                <button type="button"
                        className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                        onClick={closeModal}>
                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                         viewBox="0 0 14 14">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                    <span className="sr-only">Close modal</span>
                </button>
                <div className="px-6 py-2 lg:px-8">
                    <h3 className="mb-4 pt-6 font-semibold text-gray-900 dark:text-white">Open links in Steam</h3>
                    <ul className="w-48 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <li className="w-full border-b border-gray-200 rounded-t-lg dark:border-gray-600">
                            <div className="flex items-center pl-3">
                                <input id="list-radio-always" type="radio" value={1} name="link-setting-radio" checked={settings.open_links_in_steam===1} onChange={handleOptionChange}
                                       className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"/>
                                <label htmlFor="list-radio-always"
                                       className="w-full py-3 ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Always</label>
                            </div>
                        </li>
                        <li className="w-full border-b border-gray-200 rounded-t-lg dark:border-gray-600">
                            <div className="flex items-center pl-3">
                                <input id="list-radio-never" type="radio" value={0} name="link-setting-radio" checked={settings.open_links_in_steam===0} onChange={handleOptionChange}
                                       className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"/>
                                <label htmlFor="list-radio-never"
                                       className="w-full py-3 ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Never</label>
                            </div>
                        </li>
                        <li className="w-full border-b border-gray-200 rounded-t-lg dark:border-gray-600">
                            <div className="flex items-center pl-3">
                                <input id="list-radio-hybrid" type="radio" value={2} name="link-setting-radio" checked={settings.open_links_in_steam===2} onChange={handleOptionChange}
                                       className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"/>
                                <label htmlFor="list-radio-hybrid"
                                       className="w-full py-3 ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Only when launched</label>
                            </div>
                        </li>
                    </ul>
                </div>
                <div className="px-6 py-2 lg:px-8">
                    <label htmlFor="currency-dropdown"
                           className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Currency</label>
                    <select id={"currency-dropdown"} value={settings.steam_currency} onChange={handleCurrencyChange} className={"bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"}>
                        {STEAM_CURRENCIES.map(currency => (
                            <option key={currency.id} value={currency.id}>
                                {currency.symbol} / {currency.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
    );
};

export default SettingsModal;