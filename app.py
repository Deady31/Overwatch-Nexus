import streamlit as st
import json
import plotly.express as px
import pandas as pd
import os
import numpy as np

# --- CONFIG & SETUP ---
# App Engine completely offline. No API Keys required.
st.set_page_config(page_title="OW Counter S16", page_icon="🎯", layout="wide", initial_sidebar_state="collapsed")

# Inject Custom High-End CSS (Parallax, Glow, Animations)
st.markdown("""
<style>
    /* Parallax Background - Cool Fan Art */
    [data-testid="stAppViewContainer"] {
        background-image: linear-gradient(rgba(15, 15, 35, 0.8), rgba(15, 15, 35, 0.95)), url('https://images8.alphacoders.com/133/1332026.png');
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
        background-repeat: no-repeat;
    }
    
    /* Remove default Streamlit top padding and styling */
    header {visibility: hidden;}
    .block-container {
        padding-top: 2rem !important;
        padding-bottom: 2rem !important;
        max-width: 1400px;
    }
    
    /* Global Variables */
    :root {
        --ow-orange: #f99e1a;
        --ow-dark: #212529;
        --neon-purple: #A855F7;
        --neon-cyan: #06b6d4;
        --glow-green: #10B981;
        --glow-red: #EF4444;
        --glass-bg: rgba(20, 20, 35, 0.65);
        --glass-border: rgba(168, 85, 247, 0.3);
    }
    
    h1, h2, h3, h4 {
        color: white !important;
        text-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        font-family: 'Inter', sans-serif;
        font-weight: 900 !important;
        text-transform: uppercase;
        letter-spacing: 2px;
    }

    .section-title {
        text-align: center;
        margin-top: 50px;
        margin-bottom: 30px;
        font-size: 2.5rem;
        background: -webkit-linear-gradient(45deg, var(--neon-cyan), var(--neon-purple));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: none;
    }
    
    /* Glassmorphism Cards */
    .glass-card {
        background: var(--glass-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--glass-border);
        border-radius: 12px;
        padding: 30px;
        margin-bottom: 30px;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .glass-card:hover {
        border-color: var(--neon-purple);
        box-shadow: 0 0 25px rgba(168, 85, 247, 0.3);
    }

    /* Primary Action Button (Analysis) */
    .stButton>button {
        background: linear-gradient(45deg, var(--neon-purple), var(--neon-cyan)) !important;
        border: none !important;
        border-radius: 8px !important;
        color: white !important;
        font-weight: 900 !important;
        padding: 15px 40px !important;
        font-size: 1.2rem !important;
        text-transform: uppercase;
        letter-spacing: 2px;
        transition: all 0.3s ease !important;
        box-shadow: 0 0 20px rgba(168, 85, 247, 0.4) !important;
        width: 100%;
    }
    .stButton>button:hover {
        transform: scale(1.02);
        box-shadow: 0 0 35px rgba(6, 182, 212, 0.6) !important;
    }
    
    /* Input Styling OVERRIDES */
    .stSelectbox>div>div>div {
        background: rgba(10, 10, 20, 0.8) !important;
        border: 1px solid var(--glass-border) !important;
        color: white !important;
        border-radius: 6px !important;
    }
    .stSelectbox>div>div>div:focus-within {
        border-color: var(--neon-cyan) !important;
        box-shadow: 0 0 10px rgba(6, 182, 212, 0.3) !important;
    }

    /* Images styling */
    .hero-avatar {
        width: 100%;
        aspect-ratio: 1/1;
        object-fit: cover;
        border-radius: 8px;
        border: 2px solid rgba(255,255,255,0.1);
        transition: all 0.3s ease;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    }
    .hero-avatar:hover {
        border-color: var(--neon-purple);
        transform: scale(1.05);
        box-shadow: 0 0 15px rgba(168, 85, 247, 0.5);
    }
    .map-banner {
        width: 100%;
        height: 200px;
        object-fit: cover;
        border-radius: 12px;
        border: 2px solid var(--neon-purple);
        box-shadow: 0 0 20px rgba(168,85,247,0.3);
        filter: brightness(0.8) contrast(1.1);
    }

    /* WR Progress Bars for new tab */
    .wr-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .wr-label { width: 100px; font-weight: bold; font-size: 1.1rem; color: white;}
    .wr-bar-container { flex-grow: 1; height: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; overflow: hidden; margin: 0 15px; }
    .wr-bar-green { height: 100%; background: linear-gradient(90deg, #059669, #10B981); box-shadow: 0 0 10px #10B981;}
    .wr-bar-red { height: 100%; background: linear-gradient(90deg, #B91C1C, #EF4444); box-shadow: 0 0 10px #EF4444;}
    .wr-value { width: 60px; text-align: right; font-weight: bold; font-family: monospace; font-size: 1.1rem; }
    
    /* Horizontal divider */
    hr {
        border-color: rgba(168, 85, 247, 0.3);
        margin: 40px 0;
        box-shadow: 0 0 10px rgba(168, 85, 247, 0.2);
    }
</style>
""", unsafe_allow_html=True)

# --- LOAD DATA ---
@st.cache_data
def load_json(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

heroes_dict = load_json('data/s16_heroes.json')
maps_dict = load_json('data/s16_maps.json')
live_winrates = load_json('data/live_winrates.json')

hero_names = list(heroes_dict.keys())
map_names = list(maps_dict.keys())

if not hero_names:
    hero_names = ["Ana", "Ashe", "Baptiste", "Cassidy", "D.Va"]
if not map_names:
    map_names = ["Circuit Royal", "Dorado", "Havana"]

# --- SESSION STATE ---
if "queue_history" not in st.session_state:
    st.session_state.queue_history = []
if "last_analysis" not in st.session_state:
    st.session_state.last_analysis = None
if "selected_map_wr" not in st.session_state:
    st.session_state.selected_map_wr = map_names[0] if map_names else ""

# --- STRATEGIC ENGINE (No API Needed) ---

# Core Counter Dictionary (Target: [Hard Counters])
OW_COUNTERS = {
    # Tanks
    "D.Va": ["Zarya", "Symmetra", "Mei", "Echo", "Winston"],
    "Doomfist": ["Sombra", "Ana", "Orisa", "Pharah", "Cassidy"],
    "Orisa": ["Zarya", "Echo", "Pharah", "Hanzo", "Zenyatta"],
    "Ramattra": ["Ana", "Orisa", "Zenyatta", "Bastion", "Pharah"],
    "Reinhardt": ["Ramattra", "Pharah", "Bastion", "Mei", "Orisa"],
    "Roadhog": ["Ana", "Mauga", "Reaper", "Zenyatta", "Sombra"],
    "Sigma": ["Doomfist", "Winston", "Symmetra", "Sombra", "Lucio"],
    "Winston": ["Reaper", "Roadhog", "Bastion", "Torbjorn", "D.Va"],
    "Wrecking Ball": ["Sombra", "Mei", "Roadhog", "Ana", "Cassidy"],
    "Zarya": ["Reinhardt", "Pharah", "Widowmaker", "Winston", "Bastion"],
    "Mauga": ["Ana", "Sigma", "D.Va", "Zenyatta", "Reaper"],

    # Common DPS & Supports Base logic
    "Pharah": ["Hitscans (Ashe, Cassidy, Widowmaker)", "D.Va", "Ana"],
    "Widowmaker": ["Sombra", "Genji", "Winston", "Tracer", "Wrecking Ball"],
    "Genji": ["Winston", "Zarya", "Moira", "Symmetra", "Mei"],
    "Tracer": ["Cassidy", "Torbjorn", "Brigitte", "Winston", "Moira"],
    "Ana": ["Winston", "D.Va", "Tracer", "Doomfist", "Kiriko"],
}

def get_strategic_analysis(mode, map_name, enemy_comp):
    scores = {}
    reasons = {}
    for h in hero_names:
        scores[str(h)] = 0
        reasons[str(h)] = []
    
    # Analyze enemy comp
    for enemy in enemy_comp:
        # Give points to heroes that counter this enemy
        if enemy in OW_COUNTERS:
            for counter in OW_COUNTERS[enemy]:
                if counter in scores:
                    scores[counter] += 5
                    reasons[counter].append(f"Détruit {enemy}")
        
        # Penalize heroes that this enemy counters
        for hero, counters in OW_COUNTERS.items():
            if enemy in counters and hero in scores:
                scores[hero] -= 4
                reasons[hero].append(f"Faible face à {enemy}")
                
    # Sort heroes by strategic score (+ combine with base winrate slightly)
    for h in scores:
        base_wr = live_winrates.get(h, 50.0)
        scores[h] += (base_wr - 50.0) # slightly uplift high winrate heroes
        
    ranked_heroes = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    
    top_3 = []
    for i in range(min(3, len(ranked_heroes))):
        top_3.append(ranked_heroes[i])
        
    bot_3 = []
    for i in range(min(3, len(ranked_heroes))):
        bot_3.append(ranked_heroes[len(ranked_heroes) - 1 - i])
    
    # Format the markdown result
    output = f"🎯 **ANALYSE STRATÉGIQUE LOCALE (V2.0)**\n\n"
    output += "### ✨ PICKS FORTS (S TIER)\n"
    for i, (hero, score) in enumerate(top_3):
        # Fallback reason if it just won by baseline winrate
        reason_str = ", ".join(reasons[hero]) if reasons[hero] else f"Excellent profil sur la meta"
        wr_display = live_winrates.get(hero, 50.0)
        output += f"{i+1}. **{hero}** ({wr_display:.1f}% WR) - {reason_str}\n"

    output += "\n### ☠️ À ÉVITER (THROW)\n"
    bot_idx = 1
    for hero, score in reversed(bot_3): # Reversed so very worst is #1 throw
        reason_str = ", ".join(reasons[hero]) if reasons[hero] else "Statistiques défavorables."
        wr_display = live_winrates.get(hero, 50.0)
        output += f"{bot_idx}. **{hero}** ({wr_display:.1f}% WR) - {reason_str}\n"
        bot_idx += 1
        
    return output

# --- HEADER ---
st.markdown("<h1 style='text-align: center; color: white; margin-bottom: 5px; font-size: 4rem;'><span style='color: var(--ow-orange);'>O</span>VERWATCH <span style='color: var(--neon-cyan);'>NEXUS</span></h1>", unsafe_allow_html=True)
st.markdown("<p style='text-align: center; color: rgba(255,255,255,0.7); margin-bottom: 30px;font-style:italic;font-size: 1.2rem;'>Agent Stratégique S16 • [KingOfGuezzz#2459]</p>", unsafe_allow_html=True)


# ==========================================
# 1. PARAMÈTRES (HOME)
# ==========================================
st.markdown("<h2 class='section-title'>1. CONFIGURATION DU MATCH</h2>", unsafe_allow_html=True)
st.markdown("<div class='glass-card'>", unsafe_allow_html=True)

col_settings, col_enemies = st.columns([1, 2])

with col_settings:
    st.markdown("<h3>⚙️ Paramètres</h3>", unsafe_allow_html=True)
    mode = st.radio("Format de Match:", ["5v5", "6v6"], horizontal=True)
    selected_map = st.selectbox("Sélectionne la Map S16:", map_names)
    
    if selected_map in maps_dict and 'image' in maps_dict[selected_map]:
        st.markdown(f"<img src='{maps_dict[selected_map]['image']}' class='map-banner' style='height: 140px; margin-top: 15px;'>", unsafe_allow_html=True)
        
with col_enemies:
    st.markdown("<h3>⚔️ Composition Ennemie</h3>", unsafe_allow_html=True)
    num_enemies = 6 if mode == "6v6" else 5
    enemy_comp = []
    
    # Row 1
    cols_r1 = st.columns(3)
    for i in range(min(3, num_enemies)):
        with cols_r1[i]:
            hero = st.selectbox(f"Slot {i+1}", hero_names, index=i, key=f"home_e_{i}")
            enemy_comp.append(hero)
            if hero in heroes_dict:
                st.markdown(f"<img src='{heroes_dict[hero]['portrait']}' class='hero-avatar'>", unsafe_allow_html=True)
            
    # Row 2
    st.write("") 
    if num_enemies > 3:
        cols_r2 = st.columns(3)
        for i in range(3, num_enemies):
            with cols_r2[i-3]:
                hero = st.selectbox(f"Slot {i+1}", hero_names, index=i+5, key=f"home_e_{i}")
                enemy_comp.append(hero)
                if hero in heroes_dict:
                    st.markdown(f"<img src='{heroes_dict[hero]['portrait']}' class='hero-avatar'>", unsafe_allow_html=True)

st.markdown("</div>", unsafe_allow_html=True)

# Big Analyze Button
_, btn_c, _ = st.columns([1, 2, 1])
with btn_c:
    if st.button("⚡ OBTENIR LE COUNTER PARFAIT ⚡"):
        with st.spinner("Analyse du champ de bataille en cours..."):
            result = get_strategic_analysis(mode, selected_map, enemy_comp)
            st.session_state.last_analysis = {
                "mode": mode,
                "map": selected_map,
                "comp": enemy_comp,
                "result": result
            }
            st.session_state.queue_history.append({
                "Map": selected_map,
                "Mode": mode,
                "Ennemis": ", ".join(enemy_comp)
            })
            st.toast("Analyse terminée ! Regarde les résultats ci-dessous.", icon="✅")


# ==========================================
# 2. DASHBOARD RESULTATS
# ==========================================
st.markdown("<hr>", unsafe_allow_html=True)
st.markdown("<h2 class='section-title'>2. RÉSULTATS TACTIQUES</h2>", unsafe_allow_html=True)

if st.session_state.last_analysis:
    map_name = st.session_state.last_analysis['map']
    
    st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
    # Header banner
    if map_name in maps_dict and 'image' in maps_dict[map_name]:
        st.markdown(f"""
        <div style="position: relative; text-align: center; margin-bottom: 20px;">
            <img src="{maps_dict[map_name]['image']}" class="map-banner" style="height: 300px;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; background: rgba(0,0,0,0.5); padding: 15px 0; backdrop-filter: blur(4px);">
            <h1 style="margin:0; font-size: 3rem;">{map_name}</h1>
            <h3 style="margin:0; color: var(--neon-cyan) !important;">FORMAT: {st.session_state.last_analysis['mode']}</h3>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
    st.markdown(f"<h3 style='text-align: center;'>Composition Cible : <span style='color: var(--ow-orange);'>{', '.join(st.session_state.last_analysis['comp'])}</span></h3>", unsafe_allow_html=True)
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Display Result
    st.markdown(st.session_state.last_analysis['result'])
    st.markdown("</div>", unsafe_allow_html=True)
else:
    st.markdown("<div class='glass-card' style='text-align: center;'><h3 style='color: rgba(255,255,255,0.5) !important;'>Aucune analyse en cours. Lance une analyse ci-dessus.</h3></div>", unsafe_allow_html=True)


# ==========================================
# 3. WINRATES (DONNEES)
# ==========================================
st.markdown("<hr>", unsafe_allow_html=True)
st.markdown("<h2 class='section-title'>3. WINRATES GLOBAUX S16</h2>", unsafe_allow_html=True)

st.markdown("<div class='glass-card'>", unsafe_allow_html=True)

# Map selector for specific winrates
col_w1, col_w2 = st.columns([1, 2])
with col_w1:
    default_idx = 0
    for i, m in enumerate(map_names):
        if m == st.session_state.selected_map_wr:
            default_idx = i
            break
        
    st.session_state.selected_map_wr = st.selectbox("Afficher la Meta d'une Map:", map_names, index=default_idx)
    sel_map = st.session_state.selected_map_wr
    
    if sel_map in maps_dict:
        st.markdown(f"<img src='{maps_dict[sel_map]['image']}' class='map-banner' style='height: auto;'>", unsafe_allow_html=True)
        
with col_w2:
    st.markdown("<h3>Top 3 Héros (Winrate)</h3>", unsafe_allow_html=True)
    # Use legitimate live data if available, randomly shift slightly per map to simulate map bias
    np.random.seed(sum([ord(c) for c in sel_map]))
    
    wrs = {}
    for h in hero_names:
        base_wr = live_winrates.get(h, 49.0)
        map_bias = np.random.uniform(-1.5, 1.5) # Simulate hero performance variance on this map
        wrs[str(h)] = float(base_wr + map_bias)
        
    sorted_wrs = sorted(wrs.items(), key=lambda x: x[1], reverse=True)
    
    # Extract safely for Pyre
    top_list = []
    for i in range(min(3, len(sorted_wrs))):
        top_list.append(sorted_wrs[i])
        
    bot_list = []
    for i in range(min(3, len(sorted_wrs))):
        bot_list.append(sorted_wrs[len(sorted_wrs) - 1 - i])
    
    # Render Top 3 (Green)
    for h, wr in top_list:
        width_pct = max(0, min(100, (wr - 40) / (60 - 40) * 100)) # Clamped for realistic UI display
        img_url = heroes_dict[h]['portrait'] if h in heroes_dict else ""
        st.markdown(f"""
        <div class='wr-row'>
            <img src='{img_url}' style='width: 30px; height: 30px; border-radius: 5px; margin-right: 10px;'>
            <div class='wr-label'>{h}</div>
            <div class='wr-bar-container'><div class='wr-bar-green' style='width: {width_pct}%;'></div></div>
            <div class='wr-value' style='color:#10B981;'>{wr:.1f}%</div>
        </div>
        """, unsafe_allow_html=True)
        
    st.markdown("<hr style='border-color: rgba(255,255,255,0.1); margin: 20px 0; box-shadow: none;'>", unsafe_allow_html=True)
    st.markdown("<h3>Bottom 3 (À éviter)</h3>", unsafe_allow_html=True)
    
    # Render Bot 3 (Red)
    for h, wr in bot_list: # Already reversed manually
        width_pct = max(0, min(100, (wr - 40) / (60 - 40) * 100))
        img_url = heroes_dict[h]['portrait'] if h in heroes_dict else ""
        st.markdown(f"""
        <div class='wr-row'>
            <img src='{img_url}' style='width: 30px; height: 30px; border-radius: 5px; margin-right: 10px;'>
            <div class='wr-label'>{h}</div>
            <div class='wr-bar-container'><div class='wr-bar-red' style='width: {width_pct}%;'></div></div>
            <div class='wr-value' style='color:#EF4444;'>{wr:.1f}%</div>
        </div>
        """, unsafe_allow_html=True)

st.markdown("</div>", unsafe_allow_html=True)


# ==========================================
# 4. HISTORIQUE
# ==========================================
st.markdown("<hr>", unsafe_allow_html=True)
st.markdown("<h2 class='section-title'>4. ARCHIVE DES MATCHS</h2>", unsafe_allow_html=True)

st.markdown("<div class='glass-card'>", unsafe_allow_html=True)
if len(st.session_state.queue_history) > 0:
    df_history = pd.DataFrame(st.session_state.queue_history)
    st.dataframe(df_history, use_container_width=True, hide_index=True)
else:
    st.info("Aucune donnée enregistrée au cours de cette session.")
st.markdown("</div>", unsafe_allow_html=True)
