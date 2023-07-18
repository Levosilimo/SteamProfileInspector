import React, {Dispatch, SetStateAction, useState} from "react";
import {openSteamLink} from "../util";
import {main} from "../../wailsjs/go/models";
import AppSettings = main.AppSettings;

interface ApiKeyFormProps {
    settings: AppSettings
    setSettings: Dispatch<SetStateAction<AppSettings>>;
    status: number;
    setStatus: (arg0: number) => void;
}

function ApiKeyForm({settings, setSettings, status, setStatus}: ApiKeyFormProps) {
    const [showApiKey, setShowApiKey] = useState(false);
    const [APIInputValue, setAPIInputValue] = useState<string>(settings.api_key);

    const handleShowApiKey = (event: React.FormEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setShowApiKey(!showApiKey);
    };

    function handleAPIInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        const inputValue = event.target.value;
        const pattern = /^[A-F\d]{0,32}$/;
        const isValid = pattern.test(inputValue);
        if (isValid || !inputValue.length) {
            setAPIInputValue(inputValue);
            setStatus(0);
        }

        if (event.target.validity.patternMismatch) {
            event.target.setCustomValidity("Invalid Steam API key. Please enter a valid 32-character key.");
        } else {
            event.target.setCustomValidity("");
        }
    }

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        if (!form.checkValidity()) {
            return;
        }
        setSettings(prevSettings => ({ ...prevSettings, api_key: APIInputValue }));
        setStatus(1);
    };

    const handleGetApiClick = () => {
        openSteamLink("https://steamcommunity.com/dev/apikey", settings.open_links_in_steam);
    }

    return (
        <div className={"w-1/2"}>
            <form onSubmit={handleSubmit} className="w-100 flex items-center">
                <div className="relative w-full">
                    <input
                        type={showApiKey ? "text" : "password"}
                        value={APIInputValue} onChange={handleAPIInputChange}
                        placeholder="Steam API Key"
                        className={"block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-r-lg border-l-gray-100 border-l-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500" + (status == -1 ? "bg-red-50 border-red-500 text-red-900 placeholder-red-700 focus:ring-red-500 focus:border-red-500 dark:text-red-500 dark:placeholder-red-500 dark:border-red-500" : status ? "bg-green-50 border border-green-500 text-green-900 dark:text-green-400 placeholder-green-700 dark:placeholder-green-500 focus:ring-green-500 focus:border-green-500 dark:border-green-500" : "")}
                        pattern="^[0-9A-F]{32}$" required
                    />
                    <button
                        className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-600 mr-16"
                        onClick={handleShowApiKey}
                    >
                        {showApiKey ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                                />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                        )}
                    </button>
                    <button
                        type="submit"
                        className="absolute top-0 right-0 p-2.5 h-full text-sm font-medium text-white bg-blue-700 rounded-r-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    >
                        Submit
                    </button>
                </div>
            </form>
            <p className="block px-2.5 py-1 w-max mt-1 text-sm text-gray-900 bg-gray-50 rounded-lg border-l-gray-100 border-l-1 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500">
                <span onClick={handleGetApiClick}
                      className="font-medium text-blue-600 cursor-pointer hover:underline dark:text-blue-500">
                    Get API Key
                </span>
            </p>
        </div>
    );
}

export default ApiKeyForm;