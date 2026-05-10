import requests
import json

def fetch_overfast_data():
    base_url = "https://overfast-api.tekrop.fr"
    
    print("Fetching heroes...")
    try:
        heroes_resp = requests.get(f"{base_url}/heroes")
        heroes_data = heroes_resp.json()
        
        hero_dict = {}
        for h in heroes_data:
            hero_dict[h['name']] = {
                "name": h['name'],
                "role": h['role'],
                "portrait": h['portrait']
            }
        
        with open("data/s16_heroes.json", "w", encoding="utf-8") as f:
            json.dump(hero_dict, f, indent=4, ensure_ascii=False)
            
    except Exception as e:
        print(f"Error fetching heroes: {e}")
        
    print("Fetching maps...")
    try:
        maps_resp = requests.get(f"{base_url}/maps")
        maps_data = maps_resp.json()
        
        valid_modes = ["control", "escort", "flashpoint", "hybrid", "push", "clash"]
        map_dict = {}
        for m in maps_data:
            # Fix: m.get('gamemodes', []) returns a list of strings now, e.g. ["flashpoint"]
            if any(mode in valid_modes for mode in m.get('gamemodes', [])):
                if m['name'] not in map_dict:
                    map_dict[m['name']] = {
                        "name": m['name'],
                        "image": m['screenshot']
                    }
                    
        with open("data/s16_maps.json", "w", encoding="utf-8") as f:
            json.dump(map_dict, f, indent=4, ensure_ascii=False)
            
    except Exception as e:
        print(f"Error fetching maps: {e}")
        
    print("Done!")

if __name__ == "__main__":
    fetch_overfast_data()
