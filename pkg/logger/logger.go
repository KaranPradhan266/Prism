package logger

import (
	"fmt"
	"log"

	"prism/pkg/websockets"
)

// LogAndBroadcast is a helper to both log a message and broadcast it via WebSocket.
func LogAndBroadcast(hub *websockets.Hub, projectID, format string, v ...interface{}) {
	msg := fmt.Sprintf(format, v...)
	log.Println(msg)
	hub.BroadcastLog(projectID, msg)
}
