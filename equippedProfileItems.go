package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
)

type itemData struct {
	ItemName           string `json:"item_name"`
	ItemTitle          string `json:"item_title"`
	ItemDescription    string `json:"item_description"`
	ItemImageLarge     string `json:"item_image_large"`
	ItemImageSmall     string `json:"item_image_small"`
	ItemMovieWebm      string `json:"item_movie_webm"`
	ItemMovieMp4       string `json:"item_movie_mp4"`
	ItemMovieWebmSmall string `json:"item_movie_webm_small"`
	ItemMovieMp4Small  string `json:"item_movie_mp4_small"`
	Animated           bool   `json:"animated"`
}

type itemDefinition struct {
	Appid                 int      `json:"appid"`
	Defid                 int      `json:"defid"`
	Type                  int      `json:"type"`
	CommunityItemClass    int      `json:"community_item_class"`
	CommunityItemType     int      `json:"community_item_type"`
	PointCost             string   `json:"point_cost"`
	TimestampCreated      int      `json:"timestamp_created"`
	TimestampUpdated      int      `json:"timestamp_updated"`
	TimestampAvailable    int      `json:"timestamp_available"`
	TimestampAvailableEnd int      `json:"timestamp_available_end"`
	Quantity              string   `json:"quantity"`
	InternalDescription   string   `json:"internal_description"`
	Active                bool     `json:"active"`
	CommunityItemData     itemData `json:"community_item_data"`
	UsableDuration        int      `json:"usable_duration"`
	BundleDiscount        int      `json:"bundle_discount"`
	BundleDefids          []int    `json:"bundle_defids"`
}

type equippedItemsResponse struct {
	ActiveDefinitions   []itemDefinition `json:"active_definitions"`
	InactiveDefinitions []itemDefinition `json:"inactive_definitions"`
}

type equippedItemsGlobalResponse struct {
	Response equippedItemsResponse `json:"response"`
}

type EquippedItem struct {
	Appid               int    `json:"appid"`
	CommunityItemClass  int    `json:"community_item_class"`
	ItemName            string `json:"item_name"`
	ItemTitle           string `json:"item_title"`
	PointCost           string `json:"point_cost"`
	ItemDescription     string `json:"item_description"`
	Active              bool   `json:"active"`
	InternalDescription string `json:"internal_description"`
	Animated            bool   `json:"animated"`
	IsActiveDefinition  bool   `json:"is_active_definition"`
	ItemImageURI        string `json:"item_image_uri"`
	ItemPointsURI       string `json:"item_points_uri"`
	ItemMarketURI       string `json:"item_market_uri"`
	ItemMarketID        int    `json:"item_market_id"`
	ItemMarketPrice     string `json:"item_market_price"`
}

func GetEquippedItems(steam64ID string, language string) ([]EquippedItem, error) {
	res, err := http.Get(fmt.Sprintf("https://api.steampowered.com/ILoyaltyRewardsService/GetEquippedProfileItems/v1?steamid=%s&language=%s", steam64ID, language))
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	var response equippedItemsGlobalResponse
	err = json.NewDecoder(res.Body).Decode(&response)
	if err != nil {
		return nil, err
	}
	activeItems := make([]EquippedItem, len(response.Response.ActiveDefinitions))
	inactiveItems := make([]EquippedItem, len(response.Response.InactiveDefinitions))
	eqItemCh := make(chan EquippedItem, len(activeItems)+len(inactiveItems))
	defer close(eqItemCh)
	for _, item := range response.Response.ActiveDefinitions {
		go func(item itemDefinition, isActive bool) {
			eqItemCh <- createEquippedItemFromDefinition(item, true)
		}(item, true)
	}
	for _, item := range response.Response.InactiveDefinitions {
		go func(item itemDefinition, isActive bool) {
			eqItemCh <- createEquippedItemFromDefinition(item, false)
		}(item, false)
	}
	equippedItems := make([]EquippedItem, 0, len(activeItems)+len(inactiveItems))
	for i := 0; i < len(activeItems)+len(inactiveItems); i++ {
		equippedItems = append(equippedItems, <-eqItemCh)
	}

	return equippedItems, nil
}

func createEquippedItemFromDefinition(item itemDefinition, isActive bool) EquippedItem {
	itemImageURI := ""
	if item.CommunityItemData.Animated {
		if item.CommunityItemData.ItemMovieMp4 != "" {
			itemImageURI = item.CommunityItemData.ItemMovieMp4
		} else if item.CommunityItemData.ItemMovieWebm != "" {
			itemImageURI = item.CommunityItemData.ItemMovieWebm
		} else {
			itemImageURI = item.CommunityItemData.ItemImageSmall
		}
	} else {
		itemImageURI = item.CommunityItemData.ItemImageLarge
	}

	return EquippedItem{
		Appid:               item.Appid,
		CommunityItemClass:  item.CommunityItemClass,
		ItemName:            item.CommunityItemData.ItemName,
		ItemTitle:           item.CommunityItemData.ItemTitle,
		PointCost:           item.PointCost,
		ItemDescription:     item.CommunityItemData.ItemDescription,
		Active:              item.Active,
		InternalDescription: item.InternalDescription,
		Animated:            item.CommunityItemData.Animated,
		IsActiveDefinition:  isActive,
		ItemImageURI:        itemImageURI,
		ItemPointsURI:       fmt.Sprintf("https://store.steampowered.com/points/shop/app/%d/reward/%d/", item.Appid, item.Defid),
		ItemMarketURI:       "",
		ItemMarketID:        0,
	}
}

func addMarketURIToEquippedItems(equippedItems []EquippedItem, currency int) []EquippedItem {
	eqItemCh := make(chan EquippedItem, len(equippedItems))

	for i := range equippedItems {
		go func(item EquippedItem) {
			if item.ItemMarketURI == "" {
				itemMarketURI := fmt.Sprintf("https://steamcommunity.com/market/listings/753/%d-%s", item.Appid, strings.ReplaceAll(item.ItemName, " ", "%20"))

				client := &http.Client{Timeout: 10 * time.Second}
				resp, err := client.Get(itemMarketURI)
				if err != nil {
					fmt.Printf("Error getting market URI for item %s: %v", item.ItemName, err)
					item.ItemMarketURI = ""
				} else {
					defer resp.Body.Close()
					body, err := io.ReadAll(resp.Body)
					if err != nil {
						fmt.Printf("Error reading response body for item %s: %v", item.ItemName, err)
						item.ItemMarketURI = ""
					} else {
						bodyString := string(body)
						re := regexp.MustCompile(`<div id="searchResultsTable"[\s\S]*?class="market_content_block market_home_listing_table market_home_main_listing_table market_listing_table">`)
						if !re.MatchString(bodyString) {
							item.ItemMarketURI = itemMarketURI
							reNum := regexp.MustCompile(`Market_LoadOrderSpread\(\s*(\d+)\s*\);`)
							match := reNum.FindStringSubmatch(bodyString)
							if len(match) > 1 {
								num, err := strconv.Atoi(match[1])
								if err != nil {
									fmt.Printf("Error parsing number from response body for item %s: %v", item.ItemName, err)
								} else {
									item.ItemMarketID = num
									item = putMarketPriceToEquippedItem(item, currency)
								}
							}
						} else {
							item.ItemMarketURI = ""
						}
					}
				}
			}
			eqItemCh <- item
		}(equippedItems[i])
	}

	equippedItemsWithMarketURI := make([]EquippedItem, 0, len(equippedItems))
	for i := 0; i < len(equippedItems); i++ {
		item := <-eqItemCh
		equippedItemsWithMarketURI = append(equippedItemsWithMarketURI, item)
	}

	return equippedItemsWithMarketURI
}

func putMarketPriceToEquippedItem(item EquippedItem, currency int) EquippedItem {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(fmt.Sprintf("https://steamcommunity.com/market/itemordershistogram?language=english&currency=%d&item_nameid=%d", currency, item.ItemMarketID))
	if err != nil {
		fmt.Printf("Error making a request to steam market API for item %s: %v", item.ItemName, err)
	} else {
		defer resp.Body.Close()
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			fmt.Printf("Error reading response body for item %s: %v", item.ItemName, err)
		} else {
			bodyString := string(body)
			regex := regexp.MustCompile(`<span class=\\"market_commodity_orders_header_promote\\">([^<]*)<\\/span>",`)
			match := regex.FindStringSubmatch(bodyString)
			if len(match) > 0 {
				extractedString := match[1]
				item.ItemMarketPrice = extractedString
			} else {
				fmt.Printf("No match found: %s", bodyString)
			}
		}
	}
	return item
}
