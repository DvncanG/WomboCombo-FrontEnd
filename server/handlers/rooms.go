package handlers

import (
	"math/rand"
	"net/http"

	"wombocombo-backend/db"

	"github.com/labstack/echo/v4"
)

type createRoomReq struct {
	Name       string `json:"name"`
	MaxPlayers int    `json:"max_players"`
	IsPublic   *bool  `json:"is_public"`
}

type roomResp struct {
	ID         int    `json:"id"`
	Code       string `json:"code"`
	HostID     int    `json:"host_id"`
	Name       string `json:"name"`
	MaxPlayers int    `json:"max_players"`
	IsPublic   bool   `json:"is_public"`
	Status     string `json:"status"`
	CreatedAt  string `json:"created_at"`
}

type roomListItem struct {
	roomResp
	HostName    string `json:"host_name"`
	PlayerCount int    `json:"player_count"`
}

type roomPlayer struct {
	ID          int    `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	JoinedAt    string `json:"joined_at"`
}

func generateCode() string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 6)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return string(b)
}

func CreateRoom(c echo.Context) error {
	userID := c.Get("user_id").(int)

	var req createRoomReq
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Invalid body"})
	}

	if req.Name == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Room name required"})
	}
	if req.MaxPlayers <= 0 {
		req.MaxPlayers = 2
	}
	isPublic := true
	if req.IsPublic != nil {
		isPublic = *req.IsPublic
	}

	code := generateCode()
	var room roomResp
	err := db.DB.QueryRow(
		`INSERT INTO rooms (code, host_id, name, max_players, is_public)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, code, host_id, name, max_players, is_public, status, created_at`,
		code, userID, req.Name, req.MaxPlayers, isPublic,
	).Scan(&room.ID, &room.Code, &room.HostID, &room.Name, &room.MaxPlayers, &room.IsPublic, &room.Status, &room.CreatedAt)

	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "Server error"})
	}

	// Host joins automatically
	db.DB.Exec("INSERT INTO room_players (room_id, user_id) VALUES ($1, $2)", room.ID, userID)

	return c.JSON(http.StatusCreated, echo.Map{"room": room})
}

func ListRooms(c echo.Context) error {
	rows, err := db.DB.Query(`
		SELECT r.id, r.code, r.host_id, r.name, r.max_players, r.is_public, r.status, r.created_at,
		       u.username,
		       (SELECT COUNT(*) FROM room_players rp WHERE rp.room_id = r.id)
		FROM rooms r
		JOIN users u ON u.id = r.host_id
		WHERE r.is_public = true AND r.status = 'waiting'
		ORDER BY r.created_at DESC
		LIMIT 20
	`)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "Server error"})
	}
	defer rows.Close()

	rooms := []roomListItem{}
	for rows.Next() {
		var r roomListItem
		rows.Scan(&r.ID, &r.Code, &r.HostID, &r.Name, &r.MaxPlayers, &r.IsPublic, &r.Status, &r.CreatedAt, &r.HostName, &r.PlayerCount)
		rooms = append(rooms, r)
	}

	return c.JSON(http.StatusOK, echo.Map{"rooms": rooms})
}

func GetRoom(c echo.Context) error {
	code := c.Param("code")

	var room roomResp
	var hostName string
	err := db.DB.QueryRow(
		`SELECT r.id, r.code, r.host_id, r.name, r.max_players, r.is_public, r.status, r.created_at, u.username
		 FROM rooms r JOIN users u ON u.id = r.host_id
		 WHERE r.code = $1`, code,
	).Scan(&room.ID, &room.Code, &room.HostID, &room.Name, &room.MaxPlayers, &room.IsPublic, &room.Status, &room.CreatedAt, &hostName)

	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "Room not found"})
	}

	rows, _ := db.DB.Query(
		`SELECT u.id, u.username, u.display_name, rp.joined_at
		 FROM room_players rp JOIN users u ON u.id = rp.user_id
		 WHERE rp.room_id = $1`, room.ID,
	)
	defer rows.Close()

	players := []roomPlayer{}
	for rows.Next() {
		var p roomPlayer
		rows.Scan(&p.ID, &p.Username, &p.DisplayName, &p.JoinedAt)
		players = append(players, p)
	}

	return c.JSON(http.StatusOK, echo.Map{"room": room, "host_name": hostName, "players": players})
}

func JoinRoom(c echo.Context) error {
	userID := c.Get("user_id").(int)
	code := c.Param("code")

	var room roomResp
	err := db.DB.QueryRow(
		"SELECT id, code, host_id, name, max_players, is_public, status, created_at FROM rooms WHERE code = $1", code,
	).Scan(&room.ID, &room.Code, &room.HostID, &room.Name, &room.MaxPlayers, &room.IsPublic, &room.Status, &room.CreatedAt)

	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "Room not found"})
	}

	if room.Status != "waiting" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Room is not accepting players"})
	}

	var count int
	db.DB.QueryRow("SELECT COUNT(*) FROM room_players WHERE room_id = $1", room.ID).Scan(&count)
	if count >= room.MaxPlayers {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "Room is full"})
	}

	db.DB.Exec(
		"INSERT INTO room_players (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
		room.ID, userID,
	)

	return c.JSON(http.StatusOK, echo.Map{"message": "Joined room", "room": room})
}

func LeaveRoom(c echo.Context) error {
	userID := c.Get("user_id").(int)
	code := c.Param("code")

	var roomID, hostID int
	err := db.DB.QueryRow("SELECT id, host_id FROM rooms WHERE code = $1", code).Scan(&roomID, &hostID)
	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "Room not found"})
	}

	db.DB.Exec("DELETE FROM room_players WHERE room_id = $1 AND user_id = $2", roomID, userID)

	if hostID == userID {
		db.DB.Exec("UPDATE rooms SET status = 'closed' WHERE id = $1", roomID)
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "Left room"})
}
