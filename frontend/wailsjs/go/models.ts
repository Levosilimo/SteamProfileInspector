export namespace main {
	
	export class AppSettings {
	    api_key: string;
	    open_links_in_steam: number;
	    steam_currency: number;
	
	    static createFrom(source: any = {}) {
	        return new AppSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.api_key = source["api_key"];
	        this.open_links_in_steam = source["open_links_in_steam"];
	        this.steam_currency = source["steam_currency"];
	    }
	}
	
	export class EquippedItem {
	    appid: number;
	    community_item_class: number;
	    item_name: string;
	    item_title: string;
	    point_cost: string;
	    item_description: string;
	    active: boolean;
	    internal_description: string;
	    animated: boolean;
	    is_active_definition: boolean;
	    item_image_uri: string;
	    item_points_uri: string;
	    item_market_uri: string;
	    item_market_id: number;
	    item_market_price: string;
	
	    static createFrom(source: any = {}) {
	        return new EquippedItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.appid = source["appid"];
	        this.community_item_class = source["community_item_class"];
	        this.item_name = source["item_name"];
	        this.item_title = source["item_title"];
	        this.point_cost = source["point_cost"];
	        this.item_description = source["item_description"];
	        this.active = source["active"];
	        this.internal_description = source["internal_description"];
	        this.animated = source["animated"];
	        this.is_active_definition = source["is_active_definition"];
	        this.item_image_uri = source["item_image_uri"];
	        this.item_points_uri = source["item_points_uri"];
	        this.item_market_uri = source["item_market_uri"];
	        this.item_market_id = source["item_market_id"];
	        this.item_market_price = source["item_market_price"];
	    }
	}

}

