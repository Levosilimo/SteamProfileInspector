package main

import (
	"context"
	"encoding/json"
	"fmt"
	"golang.org/x/net/html"
	"io"
	"net/http"
	"net/url"
	"os/exec"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"time"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	// Perform your setup here
	a.ctx = ctx
}

// domReady is called after front-end resources have been loaded
func (a App) domReady(ctx context.Context) {
	// Add your action here
}

// beforeClose is called when the application is about to quit,
// either by clicking the window close button or calling runtime.Quit.
// Returning true will cause the application to continue, false will continue shutdown as normal.
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	return false
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	// Perform your teardown here
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

type Cache struct {
	steamIDCache map[string]string
	gameCache    map[string]string
}

func NewCache() *Cache {
	return &Cache{
		steamIDCache: make(map[string]string),
		gameCache:    make(map[string]string),
	}
}

func (c *Cache) lookupSteamID(url string) string {
	return c.steamIDCache[url]
}

func (c *Cache) addSteamID(url string, image string, ttl int) {
	c.steamIDCache[url] = image
	go func() {
		<-time.After(time.Duration(ttl) * time.Minute)
		delete(c.steamIDCache, url)
	}()
}

func (c *Cache) lookupGame(url string) string {
	return c.gameCache[url]
}

func (c *Cache) addGame(url string, name string, ttl int) {
	c.gameCache[url] = name
	go func() {
		<-time.After(time.Duration(ttl) * time.Minute)
		delete(c.gameCache, url)
	}()
}

func getImage(profileURL string, cache *Cache) (string, error) {
	cachedResult := cache.lookupSteamID(profileURL)
	if cachedResult != "" && cachedResult != "NO_BACKGROUND" {
		return cachedResult, nil
	}

	client := &http.Client{}
	req, err := http.NewRequest("GET", profileURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to make request: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %v", err)
	}
	responseBody := string(body)

	doc, err := html.Parse(strings.NewReader(responseBody))
	if err != nil {
		panic(err)
	}

	var divsWithBackgroundImage []*html.Node
	var findDivsWithBackgroundImage func(*html.Node)

	findDivsWithBackgroundImage = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "div" {
			for _, a := range n.Attr {
				if a.Key == "class" && strings.Contains(a.Val, "profile_page") && strings.Contains(a.Val, "has_profile_background") {
					divsWithBackgroundImage = append(divsWithBackgroundImage, n)
					break
				}
			}
		}

		for c := n.FirstChild; c != nil; c = c.NextSibling {
			findDivsWithBackgroundImage(c)
		}
	}

	findDivsWithBackgroundImage(doc)

	for _, divWithBackgroundImage := range divsWithBackgroundImage {
		var backgroundImageURL string

		for _, a := range divWithBackgroundImage.Attr {
			if a.Key == "style" {
				style := strings.TrimSpace(a.Val)
				re := regexp.MustCompile(`background-image:\s*url\(\s*'?(.*?)'\s*?\);`)
				matches := re.FindStringSubmatch(style)
				if len(matches) < 2 {
					backgroundImageURL = ""
				} else {
					backgroundImageURL = strings.TrimSpace(matches[1])
				}
			}
		}
		if backgroundImageURL != "" {
			cache.addSteamID(profileURL, backgroundImageURL, 7)
			return backgroundImageURL, nil
		} else {
			videoSourceURL := ""
			for profileAnimatedBackground := divWithBackgroundImage.FirstChild; profileAnimatedBackground != nil; profileAnimatedBackground = profileAnimatedBackground.NextSibling {
				if profileAnimatedBackground.Type == html.ElementNode && profileAnimatedBackground.Data == "div" {
					for _, a := range profileAnimatedBackground.Attr {
						if a.Key == "class" && strings.Contains(a.Val, "profile_animated_background") {
							for videoNode := profileAnimatedBackground.FirstChild; videoNode != nil; videoNode = videoNode.NextSibling {
								if videoNode != nil && videoNode.Type == html.ElementNode && videoNode.Data == "video" {
									for c := videoNode.FirstChild; c != nil; c = c.NextSibling {
										if c.Type == html.ElementNode && c.Data == "source" {
											for _, sourceAttr := range c.Attr {
												if sourceAttr.Key == "type" && sourceAttr.Val == "video/mp4" {
													videoSourceURL = c.Attr[0].Val
													break
												}
											}
										}
									}
								}
							}
						}
					}

					if videoSourceURL != "" {
						cache.addSteamID(profileURL, videoSourceURL, 7)
						return videoSourceURL, nil
					}
				}
			}
		}
	}

	cache.addSteamID(profileURL, "NO_BACKGROUND", 1)
	return "Profile has no background", nil
}

func (a *App) GetAppId(url string) string {
	return getAppIDGolang(url)
}

func (a *App) GetGameName(url string, cache *Cache) (string, error) {
	return getGameName(url, cache)
}

func (a *App) GetBackground(url string, cache *Cache) (string, error) {
	return getImage(url, cache)
}

func (a *App) GetPageBodyViaGolang(url string) (string, error) {
	return getPageBodyViaGolang(url)
}

func (a *App) GetSteam32IDViaGolang(username string, key string) (string, error) {
	if key != "" {
		steam64ID, err := getSteam64IDViaAPI(username, key)
		if err != nil {
			if strings.Contains(err.Error(), "API key not authorized to access this resource") {
				return "", fmt.Errorf("API key not authorized to access Steam API")
			}
			return getSteam32IDViaScrapper(username)
		}
		steam32ID, err := steam64ToSteam32(steam64ID)
		if err != nil {
			return getSteam32IDViaScrapper(username)
		}
		return steam32ID, nil
	}
	return getSteam32IDViaScrapper(username)
}

func (a *App) GetEquippedItemsViaGolang(steam64ID string, language string) ([]EquippedItem, error) {
	return GetEquippedItems(steam64ID, language)
}

func (a *App) OpenCustomURLViaGolang(url string, fallbackUrl string, appName string) error {
	return openCustomUrl(url, fallbackUrl, appName)
}

func (a *App) AddMarketURIToEquippedItemsViaGolang(items []EquippedItem) []EquippedItem {
	return addMarketURIToEquippedItems(items)
}

func (a *App) PutMarketPriceToEquippedItemViaGolang(item EquippedItem) EquippedItem {
	return putMarketPriceToEquippedItem(item)
}

func openCustomUrl(url string, fallbackUrl string, appName string) error {
	var err error
	if len(fallbackUrl) == 0 {
		err = openUrl(url)
		return err
	}
	if isAppRunning(appName) {
		err = openUrl(url)
	} else {
		err = openUrl(fallbackUrl)
	}
	return err
}

func isAppRunning(appName string) bool {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "linux", "darwin":
		cmd = exec.Command("pgrep", appName)
	case "windows":
		cmd = exec.Command("tasklist", "/FI", "IMAGENAME eq "+appName+".exe")
	default:
		return false
	}
	output, err := cmd.CombinedOutput()
	if err != nil {
		return false
	}
	if runtime.GOOS == "windows" {
		return strings.Contains(string(output), appName)
	} else {
		pid, err := strconv.Atoi(strings.TrimSpace(string(output)))
		if err != nil {
			return false
		}
		return pid > 0
	}
}

func openUrl(url string) error {
	var err error
	switch runtime.GOOS {
	case "windows":
		err = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "linux":
		err = exec.Command("xdg-open", url).Start()
	default:
		err = exec.Command("open", url).Start()
	}
	return err
}

func getSteam64IDViaAPI(username string, key string) (string, error) {
	requestURL := fmt.Sprintf("http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=%s&vanityurl=%s", key, username)
	resp, err := http.Get(requestURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode == 403 {
		return "", fmt.Errorf("API key not authorized to access this resource")
	}
	var data map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&data)
	if err != nil {
		return "", err
	}
	response, ok := data["response"].(map[string]interface{})
	if !ok {
		str, _ := json.Marshal(data)
		return "", fmt.Errorf("response not found in data " + string(str))
	}
	steamid, ok := response["steamid"].(string)
	if !ok {
		str, _ := json.Marshal(data)
		return "", fmt.Errorf("SteamID not found in response " + string(str))
	}
	return steamid, nil
}

func steam64ToSteam32(steam64 string) (string, error) {
	const steam64Base = 76561197960265728
	id, err := strconv.ParseUint(steam64, 10, 64)
	if err != nil {
		return "", err
	}
	steam32 := strconv.FormatUint(id-steam64Base, 10)
	return steam32, nil
}

func getSteam32IDViaScrapper(username string) (string, error) {
	var profileURL string
	if match, _ := regexp.MatchString(`^7\d{15}([02468])$`, username); match {
		profileURL = "https://steamcommunity.com/profiles/" + username
	} else {
		profileURL = "https://steamcommunity.com/id/" + username
	}
	htmlString, err := getPageBodyViaGolang("https://steamid.xyz/" + profileURL)
	if err != nil {
		return "", fmt.Errorf("failed to get page body: %v", err)
	}
	doc, err := html.Parse(strings.NewReader(htmlString))
	if err != nil {
		return "", fmt.Errorf("failed to parse html: %v", err)
	}
	steam32Regex := regexp.MustCompile(`^STEAM_0:(\d+):(\d+)$`)
	var steam32Input *html.Node
	var findSteam32Input func(*html.Node)
	findSteam32Input = func(n *html.Node) {
		if steam32Input != nil {
			return
		}
		if n.Type == html.ElementNode && n.Data == "input" {
			for _, attr := range n.Attr {
				if attr.Key == "value" && strings.HasPrefix(attr.Val, "STEAM_") {
					steam32Input = n
					return
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			findSteam32Input(c)
		}
	}
	findSteam32Input(doc)
	if err != nil || steam32Input == nil {
		return "", fmt.Errorf("input not found: %v", err)
	}
	steam32Value := ""
	for _, attr := range steam32Input.Attr {
		if attr.Key == "value" {
			steam32Value = attr.Val
			break
		}
	}
	matches := steam32Regex.FindStringSubmatch(steam32Value)
	if err != nil {
		return "", fmt.Errorf("value not found: %v", err)
	}
	a, _ := strconv.Atoi(matches[1])
	b, _ := strconv.Atoi(matches[2])
	steam32ID := strconv.Itoa(b*2 + a)
	return steam32ID, nil
}

func getPageBodyViaGolang(url string) (string, error) {
	resp, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("failed to make request: %v", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %v", err)
	}
	return string(body), nil
}

func getAppIDGolang(url string) string {
	pattern := regexp.MustCompile(`(\d+)(?:/|\.[\da-z]+$)`)
	matcher := pattern.FindStringSubmatch(url)
	if len(matcher) < 1 {
		return ""
	}
	return matcher[1]
}

func getGameName(imageURL string, cache *Cache) (string, error) {
	cachedResult := cache.lookupGame(imageURL)
	if cachedResult != "" && cachedResult != "NOT_EXIST" {
		return cachedResult, nil
	}
	appId := getAppIDGolang(imageURL)
	if appId == "" {
		return "", nil
	}
	resp, err := http.Get(fmt.Sprintf("https://store.steampowered.com/api/appdetails?appids=%s", appId))
	if err != nil {
		return "", fmt.Errorf("failed to make request: %v", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %v", err)
	}
	responseBody := string(body)
	if strings.Contains(responseBody, `"success":true`) {
		pattern := regexp.MustCompile(`name":"(.*?)"`)
		nameMatcher := pattern.FindStringSubmatch(responseBody)
		if len(nameMatcher) > 1 {
			name := nameMatcher[1]
			cache.addGame(imageURL, name, 32)
			return name, nil
		} else {
			cache.addGame(imageURL, "NOT_EXIST", 7)
			return "", nil
		}
	} else {
		cache.addGame(imageURL, "NOT_EXIST", 7)
		return "", nil
	}
}

func (a *App) invalidURL(profileURL string) bool {
	u, err := url.Parse(profileURL)
	if err != nil {
		return true
	}
	return u.Host != "steamcommunity.com"
}
