package websockets

import (
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
)

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	hub      *Hub
	conn     *websocket.Conn
	send     chan []byte
	projectID string
}

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	clients    map[string]map[*Client]bool
	broadcast  chan *broadcastMessage
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

type broadcastMessage struct {
	projectID string
	message   []byte
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan *broadcastMessage),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[string]map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if _, ok := h.clients[client.projectID]; !ok {
				h.clients[client.projectID] = make(map[*Client]bool)
			}
			h.clients[client.projectID][client] = true
			h.mu.Unlock()
			log.Printf("Client registered for project %s", client.projectID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.projectID]; ok {
				if _, ok := h.clients[client.projectID][client]; ok {
					delete(h.clients[client.projectID], client)
					close(client.send)
					if len(h.clients[client.projectID]) == 0 {
						delete(h.clients, client.projectID)
					}
				}
			}
			h.mu.Unlock()
			log.Printf("Client unregistered for project %s", client.projectID)

		case message := <-h.broadcast:
			h.mu.Lock()
			if clients, ok := h.clients[message.projectID]; ok {
				for client := range clients {
					select {
					case client.send <- message.message:
					default:
						close(client.send)
						delete(h.clients[message.projectID], client)
					}
				}
			}
			h.mu.Unlock()
		}
	}
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow connections from your frontend development server
		return r.Header.Get("Origin") == "http://localhost:5173"
	},
}

func (h *Hub) ServeWs(w http.ResponseWriter, r *http.Request) {
	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		http.Error(w, "Invalid WebSocket URL", http.StatusBadRequest)
		return
	}
	projectID := pathParts[3]
	log.Printf("Attempting to upgrade connection for project: %s", projectID)

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := &Client{hub: h, conn: conn, send: make(chan []byte, 256), projectID: projectID}
	client.hub.register <- client

	// Allow collection of memory referenced by the caller by doing all work in new goroutines.
	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	// Configure wait time and pong handler
	for {
		if _, _, err := c.conn.NextReader(); err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
	}
}

func (c *Client) writePump() {
	defer func() {
		c.conn.Close()
	}()
	for message := range c.send {
		w, err := c.conn.NextWriter(websocket.TextMessage)
		if err != nil {
			return
		}
		w.Write(message)

		// Add queued chat messages to the current websocket message.
		n := len(c.send)
		for i := 0; i < n; i++ {
			w.Write([]byte("\n"))
			w.Write(<-c.send)
		}

		if err := w.Close(); err != nil {
			return
		}
	}

	// The hub closed the channel, so send a close message.
	c.conn.WriteMessage(websocket.CloseMessage, []byte{})
}

func (h *Hub) BroadcastLog(projectID, line string) {
	message := &broadcastMessage{
		projectID: projectID,
		message:   []byte(line),
	}
	h.broadcast <- message
}