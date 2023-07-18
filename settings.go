package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type AppSettings struct {
	APIKey           string `json:"api_key"`
	OpenLinksInSteam int    `json:"open_links_in_steam"`
	SteamCurrency    int    `json:"steam_currency"`
}

func SaveSettings(settings AppSettings) error {
	dir, err := getAppdataDir()
	if err != nil {
		return err
	}
	err = os.MkdirAll(dir, 0755)
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(settings, "", "    ")
	if err != nil {
		return err
	}
	filename := filepath.Join(dir, "settings.json")
	err = os.WriteFile(filename, data, 0644)
	if err != nil {
		return err
	}

	return nil
}

func LoadSettings() (AppSettings, error) {
	var settings = AppSettings{
		APIKey:           "",
		OpenLinksInSteam: 2,
		SteamCurrency:    1,
	}
	dir, err := getAppdataDir()
	if err != nil {
		return settings, err
	}
	filename := filepath.Join(dir, "settings.json")
	data, err := os.ReadFile(filename)
	if err != nil {
		return settings, err
	}
	err = json.Unmarshal(data, &settings)
	if err != nil {
		return settings, err
	}

	return settings, nil
}

func (a *App) SaveAppSettings(settings AppSettings) error {
	err := SaveSettings(settings)
	return err
}

func (a *App) GetSettings() AppSettings {
	return a.settings
}

func getAppdataDir() (string, error) {
	appdata, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(appdata, "SteamProfileInspector"), nil
}
