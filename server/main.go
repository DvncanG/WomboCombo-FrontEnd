package main

import (
	"log"
	"os"

	"wombocombo-backend/db"
	"wombocombo-backend/handlers"
	mw "wombocombo-backend/middleware"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	db.Init()

	e := echo.New()
	e.HideBanner = true

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Authorization", "Content-Type"},
	}))

	// Health
	e.GET("/api/health", func(c echo.Context) error {
		return c.JSON(200, echo.Map{"status": "ok"})
	})

	// Auth
	auth := e.Group("/api/auth")
	auth.POST("/register", handlers.Register)
	auth.POST("/login", handlers.Login)
	auth.GET("/me", handlers.Me, mw.Auth)

	// Rooms
	rooms := e.Group("/api/rooms")
	rooms.GET("", handlers.ListRooms)
	rooms.GET("/:code", handlers.GetRoom)
	rooms.POST("", handlers.CreateRoom, mw.Auth)
	rooms.POST("/:code/join", handlers.JoinRoom, mw.Auth)
	rooms.POST("/:code/leave", handlers.LeaveRoom, mw.Auth)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("[SERVER] Running on http://localhost:%s", port)
	e.Logger.Fatal(e.Start(":" + port))
}
