const servers_div = document.querySelector("div.server-list");
const loading_text = document.querySelector("p.wait-servers");
const CACHE_KEY = "fs_servers_cache";
const CACHE_LIFETIME = 30*1000;

const { openUrl } = window.__TAURI__.opener;

function cleanType(str) {
  const withoutNumbers = str.replace(/\d+/g, '');
  const parts = withoutNumbers.split('-');
  return parts[0];
}

function add_server(name, type, map, ip_port, player, max_players) {
  var server = document.createElement("div");
  server.classList.add("server");
  servers_div.appendChild(server);

  var server_image = document.createElement("div");
  server_image.classList.add("server-img");
  server_image.style.backgroundImage = "url(" + "\"assets/img/" + cleanType(type) + ".png\")"

  var server_data = document.createElement("div");
  server_data.classList.add("server-data");

  var server_title = document.createElement("p");
  server_title.className = "server-title";
  server_title.innerText = name.split('|')[0].trim();

  var server_map = document.createElement("p");
  server_map.className = "server-map";

  var map_icon = document.createElement("i");
  map_icon.className = "bx bx-map-alt server-icon";
  server_map.appendChild(map_icon);
  server_map.appendChild(document.createTextNode(" " + map));

  /*var players = document.createElement("p");
  players.className = "server-online";
  players.innerText = player + " / " + max_players;*/

  var playersContainer = document.createElement("div");
  playersContainer.className = "players-container";
  
  var progressContainer = document.createElement("div");
  progressContainer.className = "progress-container";
  
  var progressBar = document.createElement("div");
  progressBar.className = "online-progress-bar";
  
  const percentage = max_players > 0 ? (player / max_players) * 100 : 0;
  progressBar.style.width = percentage + "%";
  
  var playersText = document.createElement("span");
  playersText.className = "online-players-text";
  playersText.innerText = player + " / " + max_players;
  
  progressContainer.appendChild(progressBar);
  playersContainer.appendChild(progressContainer);
  playersContainer.appendChild(playersText);

  var connect_button = document.createElement("button");
  connect_button.className = "server-connect";
  connect_button.innerText= "Присоедениться";
  connect_button.addEventListener("click", async () => {
    await openUrl(`steam://connect/${ip_port}`);
  });

  server.appendChild(server_image);
  server.appendChild(server_data)

  server_data.appendChild(server_title);
  server_data.appendChild(server_map);
  server_data.appendChild(playersContainer);
  server_data.appendChild(connect_button);
}

function getCachedServers() {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    if (!cache) return null;
    
    const { timestamp, data } = JSON.parse(cache);
    const now = Date.now();
    
    //check cache expiration
    if (now - timestamp < CACHE_LIFETIME) {
      return data;
    }
    
    //removing expired cache
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Error reading cache:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

function cacheServers(data) {
  try {
    const cacheData = {
      timestamp: Date.now(),
      data: data
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching servers:', error);
  }
}

function filterActiveServers(servers) {
  return servers.filter(srv => 
    srv.data?.info?.server_name !== "No ping..." && 
    srv.data?.info?.map_name !== "No ping..."
  );
}

function clearServersList() {
  const servers = servers_div.querySelectorAll('.server');
  servers.forEach(server => server.remove());
}

function displayServers(servers) {
  if (loading_text && loading_text.parentNode) {
    loading_text.remove();
  }

  clearServersList();
  
  const activeServers = filterActiveServers(servers);
  
  if (activeServers.length === 0) {
    const noServers = document.createElement("p");
    noServers.textContent = "Нет доступных серверов";
    noServers.style.textAlign = "center";
    noServers.style.color = "#888";
    servers_div.appendChild(noServers);
    return;
  }
  
  activeServers.forEach(srv => {
    add_server(
      srv.data.info.server_name,
      srv.server,
      srv.data.info.map_name,
      srv.data.con[0] + ":" + srv.data.con[1],
      srv.data.info.player_count,
      srv.data.info.max_players
    );
  });
}

function updateServers() {
  //getting cache
  const cached = getCachedServers();
  
  if (cached) {
    console.log('Using cached servers');
    displayServers(cached);
    
    //update in background
    fetchFreshServers();
  } else {
    //if no cache loading new
    fetchFreshServers();
  }
}

function getCurrentTime() {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
}

function fetchFreshServers() {
  console.log(`[BACKGROUND | ${getCurrentTime()}] Fetching fresh servers...`);
  
  fetch("https://api.fsto.cc/monitoring/")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data)) {
        throw new Error('API returned non-array data');
      }
      
      cacheServers(data);
      
      displayServers(data, false);
    })
    .catch((error) => {
      console.error('Error fetching servers:', error);
      
      if (servers_div.children.length === 0 && loading_text && loading_text.parentNode) {
        loading_text.textContent = "Ошибка загрузки серверов";
        loading_text.style.color = "#ff4444";
      } else if (servers_div.children.length === 0) {
        const errorMsg = document.createElement("p");
        errorMsg.className = "error-message";
        errorMsg.textContent = "Ошибка загрузки серверов";
        errorMsg.style.color = "#ff4444";
        errorMsg.style.textAlign = "center";
        servers_div.appendChild(errorMsg);
      }
    });
}

function debugState() {
  console.log('[DEBUG] Current state:');
  console.log('[DEBUG] loading_text exists:', !!loading_text);
  console.log('[DEBUG] servers_div children:', servers_div.children.length);
  console.log('[DEBUG] cache exists:', !!getCachedServers());
}

addEventListener("DOMContentLoaded", () => {
  console.info('DOM loaded, initializing...');
  
  updateServers();
  debugState();
  
  setInterval(fetchFreshServers, CACHE_LIFETIME);
});

// addEventListener("DOMContentLoaded", () => {
//   fetch("https://api.fsto.cc/monitoring/")
//     .then((response) => response.json())
//     .then((data) => {
//       loading_text.remove();
//       console.log(data);

//       data.forEach(srv => {
//         if (srv.data.info.server_name != "No ping..." && srv.data.info.map_name != "No ping...") {
//           add_server(srv.data.info.server_name, srv.server, srv.data.info.map_name, srv.data.con[0] + ":" + srv.data.con[1], srv.data.info.player_count, srv.data.info.max_players)
//         }
//       });
//     });
// });